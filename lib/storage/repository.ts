import type { Appointment } from "@/types/appointment";
import type { ClinicSettings } from "@/types/schedule";
import { CLINIC_ADDRESS, CLINIC_NAME, DEFAULT_CLINIC_SETTINGS, REGULAR_WEEKLY_HOURS } from "./seed";

const STORAGE_KEY = "clinic-appointment-booking";
const STORAGE_VERSION = 3;

export interface ClinicData {
  version: number;
  appointments: Appointment[];
  settings: ClinicSettings;
}

function createInitialData(): ClinicData {
  return {
    version: STORAGE_VERSION,
    appointments: [],
    settings: structuredClone(DEFAULT_CLINIC_SETTINGS),
  };
}

function isClinicData(value: unknown): value is ClinicData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<ClinicData>;
  return data.version === STORAGE_VERSION && Array.isArray(data.appointments) && Boolean(data.settings?.schedule);
}

function migrateClinicData(value: unknown): ClinicData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<ClinicData>;
  if (![1, 2].includes(data.version ?? 0) || !Array.isArray(data.appointments) || !data.settings?.schedule) return null;

  return {
    version: STORAGE_VERSION,
    appointments: data.appointments,
    settings: {
      ...data.settings,
      clinicName: CLINIC_NAME,
      clinicAddress: CLINIC_ADDRESS,
      schedule: {
        ...data.settings.schedule,
        weeklyHours: data.version === 1 ? structuredClone(REGULAR_WEEKLY_HOURS) : data.settings.schedule.weeklyHours,
      },
    },
  };
}

export function loadClinicData(): ClinicData {
  if (typeof window === "undefined") return createInitialData();
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const initialData = createInitialData();
    saveClinicData(initialData);
    return initialData;
  }
  try {
    const parsed: unknown = JSON.parse(saved);
    if (isClinicData(parsed)) return parsed;
    const migrated = migrateClinicData(parsed);
    if (migrated) {
      saveClinicData(migrated);
      return migrated;
    }
    return createInitialData();
  } catch {
    return createInitialData();
  }
}

export function saveClinicData(data: ClinicData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addAppointment(appointment: Appointment): ClinicData {
  const data = loadClinicData();
  const updated = { ...data, appointments: [...data.appointments, appointment] };
  saveClinicData(updated);
  return updated;
}

export function updateClinicSettings(settings: ClinicSettings): ClinicData {
  const data = loadClinicData();
  const updated = { ...data, settings };
  saveClinicData(updated);
  return updated;
}

export function updateAppointment(appointment: Appointment): ClinicData {
  const data = loadClinicData();
  const updated = {
    ...data,
    appointments: data.appointments.map((item) => item.id === appointment.id ? appointment : item),
  };
  saveClinicData(updated);
  return updated;
}

export function deleteAppointment(appointmentId: string): ClinicData {
  const data = loadClinicData();
  const updated = {
    ...data,
    appointments: data.appointments.filter((item) => item.id !== appointmentId),
  };
  saveClinicData(updated);
  return updated;
}
