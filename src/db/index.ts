import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("ไม่พบ DATABASE_URL ในไฟล์ .env");
}

const client = postgres(connectionString, {
  ssl: "require",
  max: 10,
});

export const db = drizzle(client, { schema });