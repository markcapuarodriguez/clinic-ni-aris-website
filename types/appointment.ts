export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked-in"
  | "completed"
  | "cancelled";

export interface PatientDetails {
  name: string;
  phone: string;
  email?: string;
  reason: string;
}

export interface Appointment {
  id: string;
  referenceNumber: string;
  date: string;
  time: string;
  patient: PatientDetails;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentDraft {
  date: string;
  time: string;
  patient: PatientDetails;
}
