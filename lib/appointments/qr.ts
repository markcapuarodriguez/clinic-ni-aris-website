import QRCode from "qrcode";
import type { Appointment } from "@/types/appointment";

export function createQrPayload(appointment: Appointment): string {
  return [
    `Appointment ID: ${appointment.referenceNumber}`,
    `Name: ${appointment.patient.name}`,
    `Date: ${appointment.date}`,
    `Time: ${appointment.time}`,
  ].join("\n");
}

export async function createQrImage(appointment: Appointment): Promise<string> {
  return QRCode.toDataURL(createQrPayload(appointment), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 360,
    color: { dark: "#062f58", light: "#ffffff" },
  });
}
