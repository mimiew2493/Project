-- เลิกเก็บข้อมูลผู้ดูแลของผู้ป่วย (caretaker_*) — ลบออกจากหน้าจอ API และฐานข้อมูล
-- v_patient_cases (สร้างไว้ในฐานข้อมูลโดยตรง) อ้างถึงคอลัมน์เหล่านี้ จึงสร้างใหม่โดยไม่มีข้อมูลผู้ดูแล
-- ไม่มี statement-breakpoint: apply-sql.mjs ส่งทั้งไฟล์เป็นคำสั่งเดียว Postgres รันในทรานแซกชันเดียว
DROP VIEW IF EXISTS "v_patient_cases";
CREATE VIEW "v_patient_cases" AS
SELECT p.patient_id,
       u.first_name,
       u.last_name,
       u.phone,
       p.address,
       c.case_id,
       c.status AS case_status,
       c.primary_ot_id,
       c.chief_complaint,
       c.pain_level,
       c.symptom_location,
       c.onset_duration,
       c.affected_side,
       c.start_stage,
       c.current_stage,
       c.assessment_note,
       c.assessed_at,
       c.opened_at,
       c.closed_at,
       c.close_reason,
       c.close_summary
FROM patients p
JOIN users u ON u.users_id = p.users_id
LEFT JOIN treatment_cases c ON c.patient_id = p.patient_id;
ALTER TABLE "patients"
  DROP COLUMN IF EXISTS "caretaker_name",
  DROP COLUMN IF EXISTS "caretaker_phone",
  DROP COLUMN IF EXISTS "caretaker_relation",
  DROP COLUMN IF EXISTS "caretaker_can_use_app";
