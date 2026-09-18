import {
  pgTable,
  varchar,
  integer,
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

  // เทเลเมทรีของอุปกรณ์ skateboard rehab — รายงานจากตัวอุปกรณ์ผ่านไฟร์มแวร์ (ยังไม่มี ingestion จริง จึงมีค่า default ไว้ก่อน)
  connection_status: varchar("connection_status", { length: 20 })
    .notNull()
    .default("DISCONNECTED"), // CONNECTED | DISCONNECTED

  battery_level: integer("battery_level"), // 0-100, null = ไม่ทราบ/ยังไม่เคยเชื่อมต่อ

  imu_status: varchar("imu_status", { length: 20 })
    .notNull()
    .default("UNKNOWN"), // OK | WARNING | ERROR | UNKNOWN

  encoder_status: varchar("encoder_status", { length: 20 })
    .notNull()
    .default("UNKNOWN"), // OK | WARNING | ERROR | UNKNOWN

  last_seen_at: timestamp("last_seen_at"),

  created_at: timestamp("created_at")
    .defaultNow()
    .notNull(),
});