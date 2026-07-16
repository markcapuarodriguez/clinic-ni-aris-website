import { fromDateKey, isPastDate } from "@/lib/dates/calendar";
import type { Appointment, AppointmentDraft } from "@/types/appointment";
import type { ClinicSchedule, Weekday } from "@/types/schedule";

export interface BookingValidationResult {
  valid: boolean;
  errors: string[];
}

const ACTIVE_STATUSES = new Set<Appointment["status"]>([
  "pending",
  "confirmed",
  "checked-in",
]);

export function getAvailableTimes(
  dateKey: string,
  schedule: ClinicSchedule,
  appointments: Appointment[],
): string[] {
  const date = fromDateKey(dateKey);
  if (!date || isPastDate(dateKey) || schedule.closedDates.includes(dateKey)) return [];

  const weekday = date.getDay() as Weekday;
  return (schedule.weeklyHours[weekday] ?? []).filter((time) => {
    const bookingCount = appointments.filter(
      (appointment) =>
        appointment.date === dateKey &&
        appointment.time === time &&
        ACTIVE_STATUSES.has(appointment.status),
    ).length;
    return bookingCount < schedule.slotCapacity;
  });
}

export function validateBooking(
  draft: AppointmentDraft,
  schedule: ClinicSchedule,
  appointments: Appointment[],
): BookingValidationResult {
  const errors: string[] = [];
  const phone = draft.patient.phone.replace(/\s/g, "");

  if (!draft.patient.name.trim()) errors.push("Ilagay ang pangalan ng pasyente.");
  if (!/^(?:\+63|0)9\d{9}$/.test(phone)) errors.push("Maglagay ng wastong numero ng telepono.");
  if (!draft.patient.reason.trim()) errors.push("Ilagay ang dahilan ng pagbisita.");
  if (draft.patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.patient.email.trim())) {
    errors.push("Maglagay ng wastong email address o iwan itong walang laman.");
  }
  if (!fromDateKey(draft.date) || isPastDate(draft.date)) errors.push("Pumili ng kasalukuyan o susunod na petsa.");
  if (!getAvailableTimes(draft.date, schedule, appointments).includes(draft.time)) {
    errors.push("Hindi na available ang napiling oras.");
  }

  const isDuplicate = appointments.some(
    (appointment) =>
      ACTIVE_STATUSES.has(appointment.status) &&
      appointment.date === draft.date &&
      appointment.time === draft.time &&
      appointment.patient.phone.replace(/\s/g, "") === phone,
  );
  if (isDuplicate) errors.push("May booking na ang numerong ito sa parehong petsa at oras.");

  return { valid: errors.length === 0, errors };
}
