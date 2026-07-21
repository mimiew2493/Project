import { pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { patientPrograms } from "./patientProgram";

export const therapySessions = pgTable("therapy_sessions", {
  session_id: varchar("session_id", { length: 10 }).primaryKey().notNull(),

  patient_program_id: varchar("patient_program_id", { length: 10 })
    .notNull()
    .references(() => patientPrograms.patient_program_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  session_date: timestamp("session_date").defaultNow().notNull(),

  duration_sec: integer("duration_sec").notNull(),

  total_reps: integer("total_reps").notNull(),

  status: varchar("status", { length: 20 }).default("COMPLETED"),
});
