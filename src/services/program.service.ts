import { db } from "@/src/db";

import { programs } from "@/src/db/schema/program";
import { users } from "@/src/db/schema/users";

import { eq } from "drizzle-orm";

import { generateId } from "@/src/utils/generate-id";
import { validateProgram } from "@/src/utils/validate-program";

import { ID_PREFIX, SEQUENCE } from "@/src/constants/id-config";

export async function createProgram(data: any) {
  // Validate request
  validateProgram(data);

  return await db.transaction(async (tx) => {
    // ==========================
    // Check creator
    // ==========================
    const creator = await tx
      .select()
      .from(users)
      .where(eq(users.users_id, data.created_by));

    if (creator.length === 0) {
      throw new Error("User not found.");
    }

    // ==========================
    // Check Role
    // ==========================
    const roleId = creator[0].role_id;

    if (roleId !== "R002" && roleId !== "R003") {
      throw new Error(
        "Only Occupational Therapist and Medical Records Staff can create programs.",
      );
    }

    // ==========================
    // Generate Program ID
    // ==========================
    const programId = await generateId(ID_PREFIX.PROGRAM, SEQUENCE.PROGRAM);

    // ==========================
    // Insert Program
    // ==========================
    await tx.insert(programs).values({
      program_id: programId,

      program_name: data.program_name,

      description: data.description,

      repeat_count: data.repeat_count,

      session_per_day: data.session_per_day,

      duration_sec: data.duration_sec,

      program_type: data.program_type,

      created_by: data.created_by,
    });

    return {
      program_id: programId,
    };
  });
}
