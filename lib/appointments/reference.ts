export function createAppointmentId(): string {
  return crypto.randomUUID();
}

export function createReferenceNumber(dateKey: string): string {
  const date = dateKey.replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  return `APPT-${date}-${random}`.toUpperCase();
}
