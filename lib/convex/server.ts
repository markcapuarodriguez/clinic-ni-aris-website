import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Appointment } from "@/types/appointment";
import type { ClinicSettings } from "@/types/schedule";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  return new ConvexHttpClient(url);
}

function getSecret() {
  const secret = process.env.CLINIC_API_SECRET;
  if (!secret) throw new Error("CLINIC_API_SECRET is not configured.");
  return secret;
}

export async function getClinicDataFromConvex() {
  return getConvexClient().query(api.clinic.getData, { secret: getSecret() });
}

export async function addAppointmentToConvex(appointment: Appointment) {
  return getConvexClient().mutation(api.clinic.addAppointment, { secret: getSecret(), appointment });
}

export async function updateAppointmentInConvex(appointment: Appointment) {
  await getConvexClient().mutation(api.clinic.updateAppointment, { secret: getSecret(), appointment });
}

export async function deleteAppointmentFromConvex(appointmentId: string) {
  await getConvexClient().mutation(api.clinic.deleteAppointment, { secret: getSecret(), appointmentId });
}

export async function updateSettingsInConvex(settings: ClinicSettings) {
  await getConvexClient().mutation(api.clinic.updateSettings, { secret: getSecret(), settings });
}

export async function importLegacyDataToConvex(appointments: Appointment[], settings: ClinicSettings) {
  await getConvexClient().mutation(api.clinic.importLegacyData, {
    secret: getSecret(),
    appointments,
    settings,
  });
}
