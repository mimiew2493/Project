import {
  pgTable,
  varchar,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { occupationalTherapists } from "./occupationalTherapist";

export const programs = pgTable("programs", {
  program_id: varchar("program_id", { length: 10 }).primaryKey().notNull(),

  OT_id: varchar("OT_id", { length: 10 })
    .notNull()
    .references(() => occupationalTherapists.ot_id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),

  program_name: varchar("program_name", { length: 100 }).notNull(),

  description: text("description"),

  repeat_count: integer("repeat_count").notNull(),

  session_per_day: integer("session_per_day").notNull(),

  duration_sec: integer("duration_sec").notNull(),

  created_at: timestamp("created_at").defaultNow().notNull(),
});
