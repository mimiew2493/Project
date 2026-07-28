import { relations } from "drizzle-orm";

import { roles } from "./roles";
import { users } from "./users";
import { patients } from "./patients";
import { occupationalTherapists } from "./occupationalTherapist";
import { medicalRecordsStaff } from "./medicalRecordsStaff";
import { programs } from "./program";
import { patientPrograms } from "./patientProgram";
import { therapySessions } from "./therapySession";
import { movementData } from "./movementData";
import { devices } from "./devices";
import { feedback } from "./feedback";

/* ===========================
   Roles
=========================== */

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

/* ===========================
   Users
=========================== */

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.role_id],
  }),

  patient: one(patients),

  occupationalTherapist: one(occupationalTherapists),

  medicalRecordsStaff: one(medicalRecordsStaff),
}));

/* ===========================
   Patients
=========================== */

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.users_id],
    references: [users.users_id],
  }),

  patientPrograms: many(patientPrograms),
}));

/* ===========================
   Occupational Therapist
=========================== */

export const occupationalTherapistsRelations = relations(
  occupationalTherapists,
  ({ one, many }) => ({
    user: one(users, {
      fields: [occupationalTherapists.users_id],
      references: [users.users_id],
    }),

    programs: many(programs),

    assignedPrograms: many(patientPrograms),
  })
);

/* ===========================
   Medical Records Staff
=========================== */

export const medicalRecordsStaffRelations = relations(
  medicalRecordsStaff,
  ({ one }) => ({
    user: one(users, {
      fields: [medicalRecordsStaff.users_id],
      references: [users.users_id],
    }),
  })
);

/* ===========================
   Programs
=========================== */

export const programsRelations = relations(programs, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [programs.created_by],
    references: [users.users_id],
  }),

  patientPrograms: many(patientPrograms),
}));

/* ===========================
   Patient Programs
=========================== */

export const patientProgramsRelations = relations(
  patientPrograms,
  ({ one, many }) => ({
    patient: one(patients, {
      fields: [patientPrograms.patient_id],
      references: [patients.patient_id],
    }),

    program: one(programs, {
      fields: [patientPrograms.program_id],
      references: [programs.program_id],
    }),

    therapist: one(occupationalTherapists, {
      fields: [patientPrograms.assigned_by],
      references: [occupationalTherapists.ot_id],
    }),

    therapySessions: many(therapySessions),
  })
);

/* ===========================
   Therapy Sessions
=========================== */

export const therapySessionsRelations = relations(
  therapySessions,
  ({ one, many }) => ({
    patientProgram: one(patientPrograms, {
      fields: [therapySessions.patient_program_id],
      references: [patientPrograms.patient_program_id],
    }),

    movementData: many(movementData),

    feedback: many(feedback),
  })
);

/* ===========================
   Movement Data
=========================== */

export const movementDataRelations = relations(
  movementData,
  ({ one }) => ({
    therapySession: one(therapySessions, {
      fields: [movementData.session_id],
      references: [therapySessions.session_id],
    }),

    device: one(devices, {
      fields: [movementData.device_id],
      references: [devices.device_id],
    }),
  })
);

/* ===========================
   Devices
=========================== */

export const devicesRelations = relations(devices, ({ many }) => ({
  movementData: many(movementData),
}));

/* ===========================
   Feedback
=========================== */

export const feedbackRelations = relations(feedback, ({ one }) => ({
  therapySession: one(therapySessions, {
    fields: [feedback.session_id],
    references: [therapySessions.session_id],
  }),
}));