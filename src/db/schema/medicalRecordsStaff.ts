import { pgTable, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const medicalRecordsStaff = pgTable("medical_records_staff", {
  medical_records_staff_id: varchar("medical_records_staff_id", {
    length: 10,
  })
    .primaryKey()
    .notNull(),

  users_id: varchar("users_id", { length: 10 })
    .notNull()
    .unique()
    .references(() => users.users_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});
