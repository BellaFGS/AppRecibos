import { describe, expect, it } from 'vitest';
import { appointmentNotificationIds, getAppointmentReminderDays, getAppointmentReminderMinutes, notificationId, reminderDate, reminderDateByMinutes, REMINDER_DAYS, REMINDER_MINUTES } from './reminderSchedule';

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

  it('supports reminders by hour on the same day', () => {
    const appointment = { date: '2026-11-20', time: '14:35' };
    expect(REMINDER_MINUTES).toEqual([60, 180, 360]);
    expect(reminderDateByMinutes(appointment, 60).toISOString()).toBe(new Date(2026, 10, 20, 13, 35).toISOString());
    expect(getAppointmentReminderMinutes({ reminderMinutesBefore: [60, 180] })).toEqual([60, 180]);
    expect(notificationId('appointment-a', 60, 'minutes')).not.toBe(notificationId('appointment-a', 60));
  });

  it('preserves the legacy one-day reminder when editing old appointments', () => {
    expect(getAppointmentReminderDays({ reminder: '1440' })).toEqual([1]);
    expect(getAppointmentReminderDays({ reminder: '30' })).toEqual([]);
  });

  it('generates stable, distinct identifiers per appointment and interval', () => {
    expect(notificationId('appointment-a', 7)).toBe(notificationId('appointment-a', 7));
    expect(new Set(appointmentNotificationIds('appointment-a')).size).toBe(6);
    expect(notificationId('appointment-a', 7)).not.toBe(notificationId('appointment-b', 7));
  });
});
