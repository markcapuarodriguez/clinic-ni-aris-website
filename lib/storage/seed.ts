import type { ClinicSettings } from "@/types/schedule";

export const REGULAR_CLINIC_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

export const REGULAR_WEEKLY_HOURS = {
  1: REGULAR_CLINIC_TIMES,
  2: REGULAR_CLINIC_TIMES,
  3: REGULAR_CLINIC_TIMES,
  4: REGULAR_CLINIC_TIMES,
  5: REGULAR_CLINIC_TIMES,
  6: REGULAR_CLINIC_TIMES,
} as const;

export const CLINIC_NAME = "Reyes Medical Clinic";
export const CLINIC_ADDRESS = "33 A. Dela Cruz Street, Tayabas City, Quezon";

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: CLINIC_NAME,
  clinicAddress: CLINIC_ADDRESS,
  announcement: "Paalala: Walang klinika tuwing Linggo.",
  schedule: {
    weeklyHours: REGULAR_WEEKLY_HOURS,
    closedDates: [],
    slotCapacity: 1,
  },
};
