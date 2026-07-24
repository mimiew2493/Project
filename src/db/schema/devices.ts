import {
  pgTable,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const devices = pgTable("devices", {
  device_id: varchar("device_id", { length: 10 })
  .primaryKey()
  .notNull(),
  device_name: varchar("device_name", { length: 100 }).notNull(),

  serial_number: varchar("serial_number", { length: 100 })
    .notNull()
    .unique(),

  status: varchar("status", { length: 20 })
    .notNull()
    .default("ACTIVE"),

  created_at: timestamp("created_at")
    .defaultNow()
    .notNull(),
});