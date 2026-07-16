export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ClinicSchedule {
  weeklyHours: Partial<Record<Weekday, string[]>>;
  closedDates: string[];
  slotCapacity: number;
}

export interface ClinicSettings {
  clinicName: string;
  announcement: string;
  schedule: ClinicSchedule;
}
