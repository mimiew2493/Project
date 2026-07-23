import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { therapySessions } from "./therapySession";

export const feedback = pgTable("feedback", {
  feedback_id: varchar("feedback_id", { length: 10 }).primaryKey().notNull(),

  session_id: varchar("session_id", { length: 10 })
    .notNull()
    .references(() => therapySessions.session_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  rating: integer("rating"),

  comment: text("comment"),

  created_at: timestamp("created_at").defaultNow().notNull(),
});
