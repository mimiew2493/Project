import { pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { occupationalTherapists } from "./occupationalTherapist";
import { devices } from "./devices";

export const appointments = pgTable("appointments", {
  appointment_id: varchar("appointment_id", { length: 10 })
    .primaryKey()
    .notNull(),

  patient_id: varchar("patient_id", { length: 10 })
    .notNull()
    .references(() => patients.patient_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  ot_id: varchar("ot_id", { length: 10 }).references(
    () => occupationalTherapists.ot_id,
    {
      onDelete: "set null",
      onUpdate: "cascade",
    }
  ),

  device_id: varchar("device_id", { length: 10 }).references(
    () => devices.device_id,
    {
      onDelete: "set null",
      onUpdate: "cascade",
    }
  ),

  appointment_date: timestamp("appointment_date").notNull(),

  duration_min: integer("duration_min").notNull().default(60),

  // ข้างที่รักษาในนัดครั้งนั้น (อาจต่างจากข้างหลักของผู้ป่วย)
  treated_side: varchar("treated_side", { length: 20 }),

  // SCHEDULED / COMPLETED / CANCELLED / NO_SHOW
  status: varchar("status", { length: 20 }).notNull().default("SCHEDULED"),

  note: varchar("note", { length: 255 }),

  created_at: timestamp("created_at").defaultNow().notNull(),
});
