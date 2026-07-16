import type { ClinicSettings } from "@/types/schedule";

const WEEKDAY_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00",
  "10:30", "13:00", "13:30", "14:00", "14:30",
];

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: "Klinika ni Dok Aris",
  announcement: "Paalala: Walang klinika tuwing Linggo.",
  schedule: {
    weeklyHours: {
      1: WEEKDAY_TIMES,
      2: WEEKDAY_TIMES,
      3: WEEKDAY_TIMES,
      4: WEEKDAY_TIMES,
      5: WEEKDAY_TIMES,
      6: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"],
    },
    closedDates: [],
    slotCapacity: 1,
  },
};
