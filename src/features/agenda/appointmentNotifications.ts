import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Appointment } from '../../domain/models';
import { appointmentNotificationIds, getAppointmentReminderDays, getAppointmentReminderMinutes, notificationId, reminderDate, reminderDateByMinutes } from './reminderSchedule';

export { appointmentNotificationIds, getAppointmentReminderDays, getAppointmentReminderMinutes, notificationId, reminderDate, reminderDateByMinutes, REMINDER_DAYS, REMINDER_MINUTES } from './reminderSchedule';
export type { ReminderDay, ReminderMinutes } from './reminderSchedule';

export type ReminderResult = 'scheduled' | 'permission-denied' | 'unsupported' | 'none';

async function ensurePermission(request: boolean): Promise<boolean> {
  let permission = await LocalNotifications.checkPermissions();
  if (permission.display === 'granted') return true;
  if (!request) return false;
  permission = await LocalNotifications.requestPermissions();
  return permission.display === 'granted';
}

async function ensureChannel() {
  if (Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.createChannel({
    id: 'pjowl-appointments',
    name: 'Lembretes da agenda',
    description: 'Avisos sobre compromissos cadastrados no PJ OWL.',
    importance: 5,
    visibility: 1,
  });
}

export async function cancelAppointmentNotifications(appointmentId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({
    notifications: appointmentNotificationIds(appointmentId).map((id) => ({ id })),
  });
}

export async function scheduleAppointmentNotifications(
  appointment: Appointment,
  requestPermission = true,
): Promise<ReminderResult> {
  const selectedDays = getAppointmentReminderDays(appointment);
  const selectedMinutes = getAppointmentReminderMinutes(appointment);
  if (!selectedDays.length && !selectedMinutes.length) return 'none';
  if (!Capacitor.isNativePlatform()) return 'unsupported';

  const granted = await ensurePermission(requestPermission);
  if (!granted) return 'permission-denied';

  await ensureChannel();
  await cancelAppointmentNotifications(appointment.id);

  const now = Date.now();
  const notifications = [
    ...selectedDays.map((daysBefore) => ({
      id: notificationId(appointment.id, daysBefore),
      title: daysBefore === 1 ? 'Compromisso amanhã' : `Compromisso em ${daysBefore} dias`,
      body: appointment.address
        ? `${appointment.description} · ${appointment.address}`
        : appointment.description,
      schedule: { at: reminderDate(appointment, daysBefore), allowWhileIdle: true },
      isExactNotification: true,
      channelId: 'pjowl-appointments',
      extra: { appointmentId: appointment.id, daysBefore },
    })),
    ...selectedMinutes.map((minutesBefore) => ({
      id: notificationId(appointment.id, minutesBefore, 'minutes'),
      title: minutesBefore === 60 ? 'Compromisso em 1 hora' : `Compromisso em ${minutesBefore / 60} horas`,
      body: appointment.address ? `${appointment.description} · ${appointment.address}` : appointment.description,
      schedule: { at: reminderDateByMinutes(appointment, minutesBefore), allowWhileIdle: true },
      isExactNotification: true, channelId: 'pjowl-appointments', extra: { appointmentId: appointment.id, minutesBefore },
    })),
  ].filter((notification) => notification.schedule.at.getTime() > now);

  if (notifications.length) await LocalNotifications.schedule({ notifications });
  return 'scheduled';
}

/** Recria lembretes futuros sem abrir uma nova solicitação de permissão. */
export async function synchronizeAppointmentNotifications(appointments: Appointment[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const granted = await ensurePermission(false);
  if (!granted) return;
  await ensureChannel();
  await Promise.all(appointments.map(async (appointment) => {
    await cancelAppointmentNotifications(appointment.id);
    const days = getAppointmentReminderDays(appointment);
    const minutes = getAppointmentReminderMinutes(appointment);
    if (!days.length && !minutes.length) return;
    const notifications = [
      ...days.map((daysBefore) => ({
        id: notificationId(appointment.id, daysBefore),
        title: daysBefore === 1 ? 'Compromisso amanhã' : `Compromisso em ${daysBefore} dias`,
        body: appointment.address ? `${appointment.description} · ${appointment.address}` : appointment.description,
        schedule: { at: reminderDate(appointment, daysBefore), allowWhileIdle: true },
        isExactNotification: true,
        channelId: 'pjowl-appointments',
        extra: { appointmentId: appointment.id, daysBefore },
      })),
      ...minutes.map((minutesBefore) => ({
        id: notificationId(appointment.id, minutesBefore, 'minutes'),
        title: minutesBefore === 60 ? 'Compromisso em 1 hora' : `Compromisso em ${minutesBefore / 60} horas`,
        body: appointment.address ? `${appointment.description} · ${appointment.address}` : appointment.description,
        schedule: { at: reminderDateByMinutes(appointment, minutesBefore), allowWhileIdle: true },
        isExactNotification: true, channelId: 'pjowl-appointments', extra: { appointmentId: appointment.id, minutesBefore },
      })),
    ].filter((notification) => notification.schedule.at.getTime() > Date.now());
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  }));
}
