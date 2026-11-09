import { describe, expect, it } from 'vitest';
import { appointmentNotificationIds, getAppointmentReminderDays, notificationId, reminderDate, REMINDER_DAYS } from './reminderSchedule';

describe('appointment reminder schedule', () => {
  it('offers the supported reminder intervals', () => {
    expect(REMINDER_DAYS).toEqual([7, 3, 1]);
  });

  it('calculates the alert date preserving the appointment local time', () => {
    const appointment = { date: '2026-11-20', time: '14:35' };
    expect(reminderDate(appointment, 7).toISOString()).toBe(new Date(2026, 10, 13, 14, 35).toISOString());
    expect(reminderDate(appointment, 3).toISOString()).toBe(new Date(2026, 10, 17, 14, 35).toISOString());
    expect(reminderDate(appointment, 1).toISOString()).toBe(new Date(2026, 10, 19, 14, 35).toISOString());
  });

  it('preserves the legacy one-day reminder when editing old appointments', () => {
    expect(getAppointmentReminderDays({ reminder: '1440' })).toEqual([1]);
    expect(getAppointmentReminderDays({ reminder: '30' })).toEqual([]);
  });

  it('generates stable, distinct identifiers per appointment and interval', () => {
    expect(notificationId('appointment-a', 7)).toBe(notificationId('appointment-a', 7));
    expect(new Set(appointmentNotificationIds('appointment-a')).size).toBe(3);
    expect(notificationId('appointment-a', 7)).not.toBe(notificationId('appointment-b', 7));
  });
});
