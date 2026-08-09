export const ID_PREFIX = {
  USER: "USR",
  PATIENT: "PAT",
  OT: "OT",
  MEDICAL_RECORDS: "MRS",
  PATIENT_PROGRAM: "PP",
  PROGRAM: "PRG",
  APPOINTMENT: "APT",
};
export const SEQUENCE = {
  USER: "users_id_seq",
  PATIENT: "patient_id_seq",
  OT: "ot_id_seq",
  MEDICAL_RECORDS: "medical_records_staff_id_seq",
  PROGRAM: "program_id_seq",
  PATIENT_PROGRAM: "patient_program_id_seq",
  THERAPY_SESSION: "therapy_session_id_seq",
  MOVEMENT_DATA: "movement_data_id_seq",
  DEVICE: "device_id_seq",
  FEEDBACK: "feedback_id_seq",
  APPOINTMENT: "appointment_id_seq",
} as const;
