import { pgTable, varchar, decimal, date, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const patients = pgTable("patients", {
  patient_id: varchar("patient_id", { length: 10 }).primaryKey().notNull(),

  users_id: varchar("users_id", { length: 10 })
    .notNull()
    .unique()
    .references(() => users.users_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  medical_condition: varchar("medical_condition", { length: 255 }),

  weight: decimal("weight", {
    precision: 5,
    scale: 2,
  }),

  register_date: date("register_date").defaultNow(),

  address: varchar("address", { length: 255 }),

  // ผู้ดูแลหลักของผู้ป่วย (ไม่ใช่ผู้ป่วยเอง เช่น ญาติ/คนดูแล)
  caretaker_name: varchar("caretaker_name", { length: 100 }),
  caretaker_phone: varchar("caretaker_phone", { length: 20 }),

  // ข้างที่รักษา: ข้างซ้าย / ข้างขวา / ทั้งสองข้าง
  affected_side: varchar("affected_side", { length: 20 }),

  // บริเวณที่ได้รับผลกระทบ เก็บคั่นด้วย , เช่น "มือ, ข้อมือ, ไหล่"
  affected_areas: varchar("affected_areas", { length: 255 }),

  // ระยะอาการปัจจุบันของผู้ป่วย (FLACCID / SPASTIC / RECOVERY) — นักกิจกรรมบำบัดเป็นผู้ประเมินและอัปเดต
  current_stage: varchar("current_stage", { length: 20 }),

  // ขั้นตอนการลงทะเบียนที่ทำสำเร็จล่าสุด (1 รับเรื่อง+ลงทะเบียน / 2 นัดหมาย / 3 จับคู่อุปกรณ์)
  // ค่าเริ่มต้นเป็น 4 เพื่อไม่กระทบผู้ป่วยเดิมที่ลงทะเบียนครบก่อนมีขั้นตอนนี้
  registration_step: integer("registration_step").notNull().default(4),

  // IN_PROGRESS ระหว่างลงทะเบียนตามคิว / COMPLETED ลงทะเบียนครบแล้ว
  status: varchar("status", { length: 20 }).notNull().default("COMPLETED"),
});
