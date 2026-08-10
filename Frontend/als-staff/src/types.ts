export type PageKey =
  | 'queue' | 'register' | 'therapists' | 'devices' | 'schedule' | 'overview'
  | 'my-cases' | 'my-schedule' | 'my-profile'
  | 'patient-home' | 'patient-appointments' | 'patient-stats' | 'patient-feedback' | 'patient-profile'

export interface AuthUser {
  users_id: string; username: string; first_name: string; last_name: string
  role_id: string; role_name: string; ot_id?: string | null; patient_id?: string | null
}

export interface QueuePatient {
  id: string; ref: string; name: string; when: string
  step: 1 | 2 | 3 | 4; side: string; sideClass: 'left' | 'right' | 'both' | ''
}

export interface Therapist {
  ot_id: string; users_id?: string; license_number: string
  first_name: string; last_name: string; phone?: string; cases?: number
}

export interface Patient {
  patient_id: string; users_id: string; medical_condition?: string | null
  weight?: string | null; register_date?: string | null; address?: string | null
  affected_side?: string | null; affected_areas?: string | null
  first_name?: string | null; last_name?: string | null; phone?: string | null
  registration_step?: number; status?: string
}

export interface Device {
  device_id: string; device_name: string; serial_number: string; status: string
  holder_patient_id?: string | null; holder_name?: string | null; issued_date?: string | null
}

export interface Appointment {
  key: string; name: string; therapist: string; duration: string
  device: string; ok: boolean; bg: string
}

/** นัดหมายที่เก็บจริงในฐานข้อมูล (ตาราง appointments) */
export interface PatientAppointment {
  appointment_id: string
  patient_id: string
  patient_name?: string | null
  patient_lastname?: string | null
  ot_id?: string | null
  therapist_name?: string | null
  therapist_lastname?: string | null
  device_id?: string | null
  device_status?: string | null
  appointment_date: string
  duration_min: number
  treated_side?: string | null
  affected_side?: string | null
  status: string
  note?: string | null
}

/** ประวัติการฝึกจริง (ตาราง therapy_sessions) */
export interface TherapySession {
  session_id: string
  session_date: string
  duration_sec: number
  total_reps: number
  status: string
  program_id: string
  program_name: string
  movement_count: string | null
}

/** โปรแกรมการฝึก (ตาราง programs) */
export interface Program {
  program_id: string
  program_name: string
  description?: string | null
  repeat_count: number
  program_type: string
  session_per_day: number
  duration_sec: number
  created_by?: string | null
  status: string
}

/** โปรแกรมที่มอบหมายให้ผู้ป่วยแล้ว (ตาราง patient_programs join programs) */
export interface PatientProgram {
  patient_program_id: string
  patient_id: string
  program_id: string
  program_name: string
  description?: string | null
  repeat_count: number
  session_per_day: number
  duration_sec: number
  assigned_date: string
  status: string
}

/** คำแนะนำจากนักกายภาพ (ตาราง feedback) */
export interface SessionFeedback {
  feedback_id: string
  comment: string | null
  rating: number | null
  created_at: string
  session_id: string
  session_date: string
  therapist_name?: string | null
  therapist_lastname?: string | null
}
