import { db } from '@/src/db'
import { therapySessions } from '@/src/db/schema/therapySession'
import { patientPrograms } from '@/src/db/schema/patientProgram'
import { programs } from '@/src/db/schema/program'
import { movementData } from '@/src/db/schema/movementData'
import { appointments } from '@/src/db/schema/appointments'
import { eq, and, desc, sum, isNotNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/sessions?patient_id=PAT000001 → ประวัติการฝึกจริงของผู้ป่วย (ตาราง therapy_sessions + movement_data)
// GET /api/sessions?ot_id=OT000001       → ทุกเซสชันที่ฝึกภายใต้โปรแกรมที่นักกายภาพคนนี้มอบหมาย (สรุปผลงานของตัวเอง)
export async function GET(req: Request) {
  try {
    const patientId = new URL(req.url).searchParams.get('patient_id')
    const otId = new URL(req.url).searchParams.get('ot_id')
    if (!patientId && !otId) {
      return NextResponse.json({ error: 'ต้องระบุ patient_id หรือ ot_id' }, { status: 400, headers: cors })
    }

    const query = db
      .select({
        session_id: therapySessions.session_id,
        session_date: therapySessions.session_date,
        duration_sec: therapySessions.duration_sec,
        total_reps: therapySessions.total_reps,
        status: therapySessions.status,
        program_id: programs.program_id,
        program_name: programs.program_name,
        patient_id: patientPrograms.patient_id,
        movement_count: sum(movementData.movement_count),
      })
      .from(therapySessions)
      .innerJoin(patientPrograms, eq(therapySessions.patient_program_id, patientPrograms.patient_program_id))
      .innerJoin(programs, eq(patientPrograms.program_id, programs.program_id))
      .leftJoin(movementData, eq(movementData.session_id, therapySessions.session_id))

    const rows = await query
      .where(patientId ? eq(patientPrograms.patient_id, patientId) : eq(patientPrograms.assigned_by, otId!))
      .groupBy(therapySessions.session_id, programs.program_id, patientPrograms.patient_id)
      .orderBy(desc(therapySessions.session_date))

    return NextResponse.json(rows, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/sessions → นักกายภาพบันทึกผลการฝึกจริงให้ผู้ป่วย (ต้องมีโปรแกรมที่กำหนดให้ผู้ป่วยไว้แล้ว)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.patientId || !body.otId || !body.usersId || !body.durationMin || body.totalReps === undefined) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ ต้องระบุ patientId, otId, usersId, durationMin, totalReps' }, { status: 400, headers: cors })
    }

    const durationSec = Math.round(Number(body.durationMin) * 60)

    // ต้องมีโปรแกรมการฝึก (ACTIVE) ที่กำหนดให้ผู้ป่วยคนนี้ไว้แล้วก่อนเสมอ — เลือกได้จาก "คลังโปรแกรมฝึก"
    // (ไม่สร้างโปรแกรมทั่วไปแบบไม่ระบุระยะให้อัตโนมัติอีกต่อไป เพื่อให้ทุกโปรแกรมเชื่อมกับระยะอาการที่ชัดเจน)
    const [activePp] = await db
      .select({ patient_program_id: patientPrograms.patient_program_id })
      .from(patientPrograms)
      .where(and(eq(patientPrograms.patient_id, body.patientId), eq(patientPrograms.status, 'ACTIVE')))
      .orderBy(desc(patientPrograms.assigned_date))
    if (!activePp) {
      return NextResponse.json(
        { error: 'ยังไม่ได้กำหนดโปรแกรมการฝึกให้ผู้ป่วยคนนี้ กรุณาเลือกโปรแกรมจากคลังโปรแกรมฝึกก่อนบันทึกผล' },
        { status: 400, headers: cors }
      )
    }
    const patientProgramId = activePp.patient_program_id

    const result = await db.transaction(async (tx) => {
      const sessionId = `TS${Date.now().toString().slice(-6)}`
      const sessionDate = body.sessionDate ? new Date(body.sessionDate) : new Date()
      await tx.insert(therapySessions).values({
        session_id: sessionId,
        patient_program_id: patientProgramId,
        session_date: sessionDate,
        duration_sec: durationSec,
        total_reps: Number(body.totalReps),
        status: 'COMPLETED',
      })

      // จำลองข้อมูลที่อุปกรณ์ IoT ของผู้ป่วยส่งเข้ามาระหว่างฝึก (ยังไม่มีอุปกรณ์จริงส่งข้อมูลเข้าระบบ)
      // ใช้อุปกรณ์จากนัดหมายล่าสุดของผู้ป่วยที่มีการมอบหมายอุปกรณ์ไว้ ถ้ามี
      const [deviceAppt] = await tx
        .select({ device_id: appointments.device_id })
        .from(appointments)
        .where(and(eq(appointments.patient_id, body.patientId), isNotNull(appointments.device_id)))
        .orderBy(desc(appointments.appointment_date))
        .limit(1)

      if (deviceAppt?.device_id) {
        await tx.insert(movementData).values({
          movement_id: `MV${Date.now().toString().slice(-6)}`,
          session_id: sessionId,
          device_id: deviceAppt.device_id,
          movement_count: Number(body.totalReps),
          movement_distance: (Number(body.totalReps) * 0.35).toFixed(2),
          recorded_at: sessionDate,
        })
      }

      return { sessionId }
    })

    return NextResponse.json({ message: 'บันทึกผลการฝึกสำเร็จ', session_id: result.sessionId }, { status: 201, headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
