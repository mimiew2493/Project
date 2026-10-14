import { pgTable, varchar, date } from "drizzle-orm/pg-core";
import { users } from "./users";

// ข้อมูลประจำตัวเท่านั้น — ข้อมูลการรักษาอยู่ใน treatment_cases (หนึ่งแถวต่อหนึ่งคอร์ส)
export const patients = pgTable("patients", {
  patient_id: varchar("patient_id", { length: 10 }).primaryKey().notNull(),

  users_id: varchar("users_id", { length: 10 })
    .notNull()
    .unique()
    .references(() => users.users_id, { onDelete: "cascade", onUpdate: "cascade" }),

  register_date: date("register_date").defaultNow(),

  // บ้านเลขที่ หมู่ ถนน — แขวง/ตำบล อำเภอ/เขต จังหวัด แยกช่อง
  address: varchar("address", { length: 255 }),
  subdistrict: varchar("subdistrict", { length: 100 }),
  district: varchar("district", { length: 100 }),
  province: varchar("province", { length: 100 }),
});
