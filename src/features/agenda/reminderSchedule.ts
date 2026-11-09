import type { Appointment } from '../../domain/models';

export const REMINDER_DAYS = [7, 3, 1] as const;
export type ReminderDay = (typeof REMINDER_DAYS)[number];

export function notificationId(appointmentId: string, daysBefore: number): number {
  const source = `${appointmentId}:${daysBefore}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2_000_000_000 + 1;
}

export function reminderDate(appointment: Pick<Appointment, 'date' | 'time'>, daysBefore: number): Date {
  const eventDate = new Date(`${appointment.date}T${appointment.time || '09:00'}:00`);
  eventDate.setDate(eventDate.getDate() - daysBefore);
  return eventDate;
}

export function getAppointmentReminderDays(appointment: Pick<Appointment, 'reminderDays' | 'reminder'>): ReminderDay[] {
  if (appointment.reminderDays?.length) {
    return appointment.reminderDays.filter((day): day is ReminderDay => REMINDER_DAYS.includes(day as ReminderDay));
  }
  // Compatibilidade com o lembrete antigo de 1 dia (1440 minutos).
  return appointment.reminder === '1440' ? [1] : [];
}

export function appointmentNotificationIds(appointmentId: string): number[] {
  return REMINDER_DAYS.map((days) => notificationId(appointmentId, days));
}
