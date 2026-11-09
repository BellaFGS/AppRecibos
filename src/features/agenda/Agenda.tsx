import React, { useState } from 'react';
import type { Appointment } from '../../domain/models';
import { longDate, today, uid } from '../../domain/utils';
import { Button, EmptyState, Field, Icon } from '../../shared/components/ui';
import { PageTitle } from '../../shared/layout/AppLayout';
import {
  cancelAppointmentNotifications,
  scheduleAppointmentNotifications,
} from './appointmentNotifications';
import { getAppointmentReminderDays, REMINDER_DAYS, type ReminderDay } from './reminderSchedule';

type AppointmentForm = {
  date: string;
  time: string;
  description: string;
  address: string;
  reminderDays: ReminderDay[];
};

type Props = {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setDeleteTarget: (target: { type: 'appointment'; id: string }) => void;
  notify: (message: string) => void;
};

const emptyForm = (): AppointmentForm => ({ date: today(), time: '09:00', description: '', address: '', reminderDays: [1] });

export function Agenda({ appointments, setAppointments, setDeleteTarget, notify }: Props) {
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const sorted = [...appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const toggleReminder = (day: ReminderDay) => {
    setForm((current) => ({
      ...current,
      reminderDays: current.reminderDays.includes(day)
        ? current.reminderDays.filter((value) => value !== day)
        : [...current.reminderDays, day].sort((a, b) => b - a),
    }));
  };

  const saveAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.description.trim()) {
      notify('Dê um nome para o compromisso.');
      return;
    }

    const appointment: Appointment = {
      id: editingId ?? uid('appointment'),
      date: form.date,
      time: form.time,
      description: form.description.trim(),
      address: form.address.trim(),
      reminderDays: form.reminderDays,
    };

    try {
      if (editingId) await cancelAppointmentNotifications(editingId);
      const result = await scheduleAppointmentNotifications(appointment, true);
      setAppointments((current) => [appointment, ...current.filter((item) => item.id !== appointment.id)]
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)));
      setForm(emptyForm());
      setEditingId(null);
      if (result === 'permission-denied') {
        notify('Compromisso salvo. Permita notificações nas configurações do Android para receber os lembretes.');
      } else if (result === 'unsupported' && appointment.reminderDays?.length) {
        notify('Compromisso salvo. Os alertas programados ficam disponíveis na versão Android.');
      } else {
        notify(editingId ? 'Compromisso atualizado e lembretes reajustados.' : 'Compromisso salvo e lembretes agendados.');
      }
    } catch {
      setAppointments((current) => [appointment, ...current.filter((item) => item.id !== appointment.id)]
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)));
      setForm(emptyForm());
      setEditingId(null);
      notify('Compromisso salvo, mas não foi possível programar os alertas. Confira as permissões de notificação.');
    }
  };

  const editAppointment = (item: Appointment) => {
    setEditingId(item.id);
    setForm({
      date: item.date,
      time: item.time,
      description: item.description,
      address: item.address ?? '',
      reminderDays: getAppointmentReminderDays(item),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyAddress = async (address: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        const temporaryInput = document.createElement('textarea');
        temporaryInput.value = address;
        temporaryInput.setAttribute('readonly', '');
        temporaryInput.style.position = 'fixed';
        temporaryInput.style.opacity = '0';
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand('copy');
        temporaryInput.remove();
        if (!copied) throw new Error('Clipboard indisponível');
      }
      notify('Endereço copiado para a área de transferência.');
    } catch {
      notify('Não foi possível copiar. Tente selecionar e copiar o endereço manualmente.');
    }
  };

  return (
    <div className="page">
      <PageTitle eyebrow="Organize seus dias" title="Agenda" description="Cadastre compromissos e receba lembretes antes da hora marcada." />
      <section className="agenda-layout">
        <div className="card form-card">
          <div className="card-heading">
            <div><span className="section-kicker">{editingId ? 'Editar compromisso' : 'Novo compromisso'}</span><h2>{editingId ? 'Atualize os detalhes' : 'O que vem pela frente?'}</h2></div>
            <span className="heading-icon blue-bg"><Icon name="calendar" /></span>
          </div>
          <form onSubmit={saveAppointment} className="stack-form">
            <div className="two-fields">
              <Field label="Data"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Field>
              <Field label="Horário"><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></Field>
            </div>
            <Field label="Descrição"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Entrega para a Ana" required /></Field>
            <Field label="Endereço (opcional)"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número ou ponto de encontro" /></Field>
            <fieldset className="reminder-options">
              <legend>Lembretes antes do compromisso</legend>
              <p>Escolha quando o PJ OWL deve avisar você.</p>
              <div className="reminder-checks">
                {REMINDER_DAYS.map((day) => <label key={day}>
                  <input type="checkbox" checked={form.reminderDays.includes(day)} onChange={() => toggleReminder(day)} />
                  <span>{day} {day === 1 ? 'dia antes' : 'dias antes'}</span>
                </label>)}
              </div>
            </fieldset>
            <div className="form-actions-inline">
              <Button type="submit" icon="check">{editingId ? 'Salvar alterações' : 'Guardar compromisso'}</Button>
              {editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setForm(emptyForm()); }}>Cancelar edição</Button>}
            </div>
          </form>
        </div>

        <div className="card list-card">
          <div className="card-heading"><div><span className="section-kicker">Sua agenda</span><h2>Compromissos</h2></div><span className="soft-count">{appointments.length}</span></div>
          {sorted.length ? <div className="appointment-list">{sorted.map((item) => (
            <div className="appointment-item" key={item.id}>
              <div className="date-tile large"><strong>{new Date(`${item.date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${item.date}T12:00:00`)).replace('.', '')}</span></div>
              <div className="appointment-content">
                <div className="appointment-top"><strong>{item.description}</strong><div className="appointment-actions">
                  <button className="mini-delete" type="button" title="Editar compromisso" aria-label={`Editar ${item.description}`} onClick={() => editAppointment(item)}><Icon name="edit" size={15} /></button>
                  <button className="mini-delete" type="button" title="Excluir compromisso" aria-label={`Excluir ${item.description}`} onClick={() => setDeleteTarget({ type: 'appointment', id: item.id })}><Icon name="trash" size={15} /></button>
                </div></div>
                <span><Icon name="clock" size={13} /> {longDate(item.date)} às {item.time}</span>
                <span><Icon name="bell" size={13} /> {getAppointmentReminderDays(item).length ? [...getAppointmentReminderDays(item)].sort((a, b) => b - a).map((day) => `${day} dia${day > 1 ? 's' : ''}`).join(', ') + ' antes' : 'Sem lembretes'}</span>
                {item.address && <div className="appointment-address"><span><Icon name="target" size={13} /> {item.address}</span><button type="button" className="copy-address-button" onClick={() => void copyAddress(item.address)}><Icon name="copy" size={14} /> Copiar endereço</button></div>}
              </div>
            </div>
          ))}</div> : <EmptyState title="Sua agenda está tranquila" text="Adicione o próximo compromisso para não deixar nada escapar." action="Preencher agora" onAction={() => document.querySelector<HTMLInputElement>('input[placeholder^="Ex."]')?.focus()} />}
        </div>
      </section>
    </div>
  );
}
