import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  appointments: defineTable({
    appId: v.string(),
    referenceNumber: v.string(),
    date: v.string(),
    time: v.string(),
    patientName: v.string(),
    patientPhone: v.string(),
    patientEmail: v.optional(v.string()),
    patientReason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("checked-in"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_app_id", ["appId"])
    .index("by_date", ["date"])
    .index("by_reference", ["referenceNumber"]),

  clinicSettings: defineTable({
    key: v.string(),
    clinicName: v.string(),
    clinicAddress: v.string(),
    announcement: v.string(),
    weeklyHoursJson: v.string(),
    closedDates: v.array(v.string()),
    slotCapacity: v.number(),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),
});
