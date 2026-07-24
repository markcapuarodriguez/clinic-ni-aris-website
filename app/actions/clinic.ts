"use server";

import { getStaffUser } from "@/app/chatgpt-auth";
import { hasValidStaffSession } from "@/app/admin/staff-session";
import {
  addAppointmentToConvex,
  deleteAppointmentFromConvex,
  getClinicDataFromConvex,
  importLegacyDataToConvex,
  updateAppointmentInConvex,
  updateSettingsInConvex,
} from "@/lib/convex/server";
import type { Appointment } from "@/types/appointment";
import type { ClinicSettings } from "@/types/schedule";

export async function loadPublicClinicData() {
  const data = await getClinicDataFromConvex();
  return {
    ...data,
    appointments: data.appointments.map((item) => ({
      ...item,
      referenceNumber: "",
      patient: { name: "", phone: "", reason: "" },
    })),
  };
}

export async function createClinicAppointment(appointment: Appointment) {
  return addAppointmentToConvex(appointment);
}

export async function loadStaffClinicData() {
  await requireStaff();
  return getClinicDataFromConvex();
}

export async function saveClinicSettings(settings: ClinicSettings) {
  await requireStaff();
  await updateSettingsInConvex(settings);
  return getClinicDataFromConvex();
}

export async function saveClinicAppointment(appointment: Appointment) {
  await requireStaff();
  await updateAppointmentInConvex(appointment);
  return getClinicDataFromConvex();
}

export async function removeClinicAppointment(appointmentId: string) {
  await requireStaff();
  await deleteAppointmentFromConvex(appointmentId);
  return getClinicDataFromConvex();
}

export async function importLegacyClinicData(data: {
  appointments: Appointment[];
  settings: ClinicSettings;
}) {
  await requireStaff();
  await importLegacyDataToConvex(data.appointments, data.settings);
  return getClinicDataFromConvex();
}

async function requireStaff() {
  const user = await getStaffUser();
  if (!user || !(await hasValidStaffSession(user.email))) {
    throw new Error("Unauthorized");
  }
}
