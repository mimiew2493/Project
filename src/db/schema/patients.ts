import { pgTable, varchar, decimal, date } from "drizzle-orm/pg-core";
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
});
