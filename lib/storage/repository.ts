import type { Appointment } from "@/types/appointment";
import type { ClinicSettings } from "@/types/schedule";
import {
  createClinicAppointment,
  importLegacyClinicData,
  loadPublicClinicData,
  loadStaffClinicData,
  removeClinicAppointment,
  saveClinicAppointment,
  saveClinicSettings,
} from "@/app/actions/clinic";

export interface ClinicData {
  version: number;
  appointments: Appointment[];
  settings: ClinicSettings;
}

export async function loadClinicData(): Promise<ClinicData> {
  return loadPublicClinicData();
}

export async function loadAdminClinicData(): Promise<ClinicData> {
  return loadStaffClinicData();
}

export async function addAppointment(appointment: Appointment): Promise<Appointment> {
  return createClinicAppointment(appointment);
}

export function updateClinicSettings(settings: ClinicSettings): Promise<ClinicData> {
  return saveClinicSettings(settings);
}

export function updateAppointment(appointment: Appointment): Promise<ClinicData> {
  return saveClinicAppointment(appointment);
}

export function deleteAppointment(appointmentId: string): Promise<ClinicData> {
  return removeClinicAppointment(appointmentId);
}

export async function migrateLocalClinicData(): Promise<ClinicData | null> {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem("clinic-appointment-booking");
  if (!saved) return null;
  try {
    const data = JSON.parse(saved) as Partial<ClinicData>;
    if (!Array.isArray(data.appointments) || !data.settings?.schedule) return null;
    const migrated = await importLegacyClinicData({
      appointments: data.appointments,
      settings: data.settings,
    });
    window.localStorage.removeItem("clinic-appointment-booking");
    return migrated;
  } catch {
    return null;
  }
}
