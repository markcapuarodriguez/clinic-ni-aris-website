import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const CLINIC_NAME = "Reyes Medical Clinic";
const CLINIC_ADDRESS = "33 A. Dela Cruz Street, Tayabas City, Quezon";
const REGULAR_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];
const DEFAULT_WEEKLY_HOURS = {
  1: REGULAR_TIMES,
  2: REGULAR_TIMES,
  3: REGULAR_TIMES,
  4: REGULAR_TIMES,
  5: REGULAR_TIMES,
  6: REGULAR_TIMES,
};
const ACTIVE_STATUSES = new Set(["pending", "confirmed", "checked-in"]);

const appointmentValue = v.object({
  id: v.string(),
  referenceNumber: v.string(),
  date: v.string(),
  time: v.string(),
  patient: v.object({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    reason: v.string(),
  }),
  status: v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("checked-in"),
    v.literal("completed"),
    v.literal("cancelled"),
  ),
  createdAt: v.string(),
  updatedAt: v.string(),
});

const scheduleValue = v.object({
  weeklyHours: v.any(),
  closedDates: v.array(v.string()),
  slotCapacity: v.number(),
});

const settingsValue = v.object({
  clinicName: v.string(),
  clinicAddress: v.string(),
  announcement: v.string(),
  schedule: scheduleValue,
});

function assertSecret(secret: string) {
  const expected = process.env.CLINIC_API_SECRET;
  if (!expected || secret !== expected) throw new ConvexError("Unauthorized");
}

function defaultSettings() {
  return {
    clinicName: CLINIC_NAME,
    clinicAddress: CLINIC_ADDRESS,
    announcement: "Paalala: Walang klinika tuwing Linggo.",
    schedule: {
      weeklyHours: DEFAULT_WEEKLY_HOURS,
      closedDates: [] as string[],
      slotCapacity: 1,
    },
  };
}

function mapAppointment(row: {
  appId: string;
  referenceNumber: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientReason: string;
  status: "pending" | "confirmed" | "checked-in" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: row.appId,
    referenceNumber: row.referenceNumber,
    date: row.date,
    time: row.time,
    patient: {
      name: row.patientName,
      phone: row.patientPhone,
      email: row.patientEmail,
      reason: row.patientReason,
    },
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const getData = query({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const [appointments, storedSettings] = await Promise.all([
      ctx.db.query("appointments").collect(),
      ctx.db.query("clinicSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique(),
    ]);
    const settings = storedSettings
      ? {
          clinicName: storedSettings.clinicName,
          clinicAddress: storedSettings.clinicAddress,
          announcement: storedSettings.announcement,
          schedule: {
            weeklyHours: JSON.parse(storedSettings.weeklyHoursJson),
            closedDates: storedSettings.closedDates,
            slotCapacity: storedSettings.slotCapacity,
          },
        }
      : defaultSettings();

    return {
      version: 4,
      appointments: appointments.map(mapAppointment),
      settings,
    };
  },
});

export const addAppointment = mutation({
  args: { secret: v.string(), appointment: appointmentValue },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const appointment = args.appointment;
    const existingId = await ctx.db
      .query("appointments")
      .withIndex("by_app_id", (q) => q.eq("appId", appointment.id))
      .unique();
    if (existingId) throw new ConvexError("Duplicate appointment ID");

    const storedSettings = await ctx.db
      .query("clinicSettings")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();
    const settings = storedSettings
      ? {
          weeklyHours: JSON.parse(storedSettings.weeklyHoursJson) as Record<string, string[]>,
          closedDates: storedSettings.closedDates,
          slotCapacity: storedSettings.slotCapacity,
        }
      : defaultSettings().schedule;
    const weekday = new Date(`${appointment.date}T00:00:00Z`).getUTCDay();
    if (
      settings.closedDates.includes(appointment.date) ||
      !(settings.weeklyHours[String(weekday)] ?? []).includes(appointment.time)
    ) {
      throw new ConvexError("Hindi available ang napiling petsa o oras.");
    }

    const appointmentsForDate = await ctx.db
      .query("appointments")
      .withIndex("by_date", (q) => q.eq("date", appointment.date))
      .collect();
    const activeForSlot = appointmentsForDate.filter(
      (item) => item.time === appointment.time && ACTIVE_STATUSES.has(item.status),
    );
    if (activeForSlot.length >= settings.slotCapacity) {
      throw new ConvexError("Hindi na available ang napiling oras.");
    }
    const normalizedPhone = appointment.patient.phone.replace(/\s/g, "");
    if (
      activeForSlot.some((item) => item.patientPhone.replace(/\s/g, "") === normalizedPhone)
    ) {
      throw new ConvexError("May booking na ang numerong ito sa parehong petsa at oras.");
    }

    await ctx.db.insert("appointments", {
      appId: appointment.id,
      referenceNumber: appointment.referenceNumber,
      date: appointment.date,
      time: appointment.time,
      patientName: appointment.patient.name,
      patientPhone: appointment.patient.phone,
      patientEmail: appointment.patient.email,
      patientReason: appointment.patient.reason,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    });
    return appointment;
  },
});

export const updateAppointment = mutation({
  args: { secret: v.string(), appointment: appointmentValue },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const row = await ctx.db
      .query("appointments")
      .withIndex("by_app_id", (q) => q.eq("appId", args.appointment.id))
      .unique();
    if (!row) throw new ConvexError("Hindi makita ang appointment.");
    await ctx.db.patch(row._id, {
      status: args.appointment.status,
      updatedAt: args.appointment.updatedAt,
    });
  },
});

export const deleteAppointment = mutation({
  args: { secret: v.string(), appointmentId: v.string() },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const row = await ctx.db
      .query("appointments")
      .withIndex("by_app_id", (q) => q.eq("appId", args.appointmentId))
      .unique();
    if (row) await ctx.db.delete(row._id);
  },
});

export const updateSettings = mutation({
  args: { secret: v.string(), settings: settingsValue },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const row = await ctx.db
      .query("clinicSettings")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();
    const value = {
      key: "main",
      clinicName: args.settings.clinicName,
      clinicAddress: args.settings.clinicAddress,
      announcement: args.settings.announcement,
      weeklyHoursJson: JSON.stringify(args.settings.schedule.weeklyHours),
      closedDates: args.settings.schedule.closedDates,
      slotCapacity: args.settings.schedule.slotCapacity,
      updatedAt: new Date().toISOString(),
    };
    if (row) await ctx.db.patch(row._id, value);
    else await ctx.db.insert("clinicSettings", value);
  },
});

export const importLegacyData = mutation({
  args: {
    secret: v.string(),
    appointments: v.array(appointmentValue),
    settings: settingsValue,
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    for (const appointment of args.appointments) {
      const existing = await ctx.db
        .query("appointments")
        .withIndex("by_app_id", (q) => q.eq("appId", appointment.id))
        .unique();
      if (!existing) {
        await ctx.db.insert("appointments", {
          appId: appointment.id,
          referenceNumber: appointment.referenceNumber,
          date: appointment.date,
          time: appointment.time,
          patientName: appointment.patient.name,
          patientPhone: appointment.patient.phone,
          patientEmail: appointment.patient.email,
          patientReason: appointment.patient.reason,
          status: appointment.status,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        });
      }
    }

    const row = await ctx.db
      .query("clinicSettings")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();
    const settingsValueToSave = {
      key: "main",
      clinicName: args.settings.clinicName,
      clinicAddress: args.settings.clinicAddress,
      announcement: args.settings.announcement,
      weeklyHoursJson: JSON.stringify(args.settings.schedule.weeklyHours),
      closedDates: args.settings.schedule.closedDates,
      slotCapacity: args.settings.schedule.slotCapacity,
      updatedAt: new Date().toISOString(),
    };
    if (row) await ctx.db.patch(row._id, settingsValueToSave);
    else await ctx.db.insert("clinicSettings", settingsValueToSave);
  },
});
