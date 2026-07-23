import { db } from "@/src/db";
import { users } from "@/src/db/schema/users";
import { patients } from "@/src/db/schema/patients";
import { occupationalTherapists } from "@/src/db/schema/occupationalTherapist";
import { medicalRecordsStaff } from "@/src/db/schema/medicalRecordsStaff";

import { generateId } from "@/src/utils/generate-id";
import { validateUser } from "@/src/utils/validate-user";

import { ID_PREFIX, SEQUENCE } from "@/src/constants/id-config";

export async function createUser(data: any) {
  // Validate request data
  validateUser(data);

  return await db.transaction(async (tx) => {
    // ==========================
    // Generate User ID
    // ==========================
    const userId = await generateId(ID_PREFIX.USER, SEQUENCE.USER);

    // ==========================
    // Create User
    // ==========================
    await tx.insert(users).values({
      users_id: userId,

      role_id: data.role_id,

      username: data.username,

      password: data.password,

      first_name: data.first_name,

      last_name: data.last_name,

      phone: data.phone,

      email: data.email,

      gender: data.gender,

      birth_date: data.birth_date,
    });

    // ==========================
    // Patient
    // ==========================
    if (data.role_id === "R001") {
      const patientId = await generateId(ID_PREFIX.PATIENT, SEQUENCE.PATIENT);

      await tx.insert(patients).values({
        patient_id: patientId,

        users_id: userId,

        medical_condition: data.medical_condition,

        weight: data.weight,

        address: data.address,
      });
    }

    // ==========================
    // Occupational Therapist
    // ==========================
    if (data.role_id === "R002") {
      const otId = await generateId(ID_PREFIX.OT, SEQUENCE.OT);

      await tx.insert(occupationalTherapists).values({
        ot_id: otId,

        users_id: userId,

        license_number: data.license_number,
      });
    }

    // ==========================
    // Medical Records Staff
    // ==========================
    if (data.role_id === "R003") {
      const mrsId = await generateId(
        ID_PREFIX.MEDICAL_RECORDS,
        SEQUENCE.MEDICAL_RECORDS,
      );

      await tx.insert(medicalRecordsStaff).values({
        medical_records_staff_id: mrsId,

        users_id: userId,
      });
    }

    return {
      users_id: userId,
      role_id: data.role_id,
    };
  });
}
