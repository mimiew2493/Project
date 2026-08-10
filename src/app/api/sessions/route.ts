import { db } from '@/src/db'
import { therapySessions } from '@/src/db/schema/therapySession'
import { patientPrograms } from '@/src/db/schema/patientProgram'
import { programs } from '@/src/db/schema/program'
import { movementData } from '@/src/db/schema/movementData'
import { eq, and, desc, sum } from 'drizzle-orm'
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
export async function GET(req: Request) {
  try {
    const patientId = new URL(req.url).searchParams.get('patient_id')
    if (!patientId) {
      return NextResponse.json({ error: 'ต้องระบุ patient_id' }, { status: 400, headers: cors })
    }

    const rows = await db
      .select({
        session_id: therapySessions.session_id,
        session_date: therapySessions.session_date,
        duration_sec: therapySessions.duration_sec,
        total_reps: therapySessions.total_reps,
        status: therapySessions.status,
        program_id: programs.program_id,
        program_name: programs.program_name,
        movement_count: sum(movementData.movement_count),
      })
      .from(therapySessions)
      .innerJoin(patientPrograms, eq(therapySessions.patient_program_id, patientPrograms.patient_program_id))
      .innerJoin(programs, eq(patientPrograms.program_id, programs.program_id))
      .leftJoin(movementData, eq(movementData.session_id, therapySessions.session_id))
      .where(eq(patientPrograms.patient_id, patientId))
      .groupBy(therapySessions.session_id, programs.program_id)
      .orderBy(desc(therapySessions.session_date))

    return NextResponse.json(rows, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/sessions → นักกายภาพบันทึกผลการฝึกจริงให้ผู้ป่วย (สร้าง program/patient_program อัตโนมัติถ้ายังไม่มี)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.patientId || !body.otId || !body.usersId || !body.durationMin || body.totalReps === undefined) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ ต้องระบุ patientId, otId, usersId, durationMin, totalReps' }, { status: 400, headers: cors })
    }

    const durationSec = Math.round(Number(body.durationMin) * 60)

    const result = await db.transaction(async (tx) => {
      // ใช้โปรแกรมที่นักกายภาพกำหนด (ACTIVE) ให้ผู้ป่วยคนนี้ไว้แล้วก่อน ถ้ามี
      let [activePp] = await tx
        .select({ patient_program_id: patientPrograms.patient_program_id })
        .from(patientPrograms)
        .where(and(eq(patientPrograms.patient_id, body.patientId), eq(patientPrograms.status, 'ACTIVE')))
        .orderBy(desc(patientPrograms.assigned_date))
      let patientProgramId = activePp?.patient_program_id

      if (!patientProgramId) {
        // ยังไม่เคยกำหนดโปรแกรมให้ผู้ป่วยคนนี้ — หา/สร้างโปรแกรมฝึกทั่วไปของนักกายภาพคนนี้แทน
        let [program] = await tx
          .select({ program_id: programs.program_id })
          .from(programs)
          .where(eq(programs.created_by, body.usersId))
        let programId = program?.program_id
        if (!programId) {
          programId = `PRG${Date.now().toString().slice(-6)}`
          await tx.insert(programs).values({
            program_id: programId,
            program_name: 'โปรแกรมฝึกทั่วไป',
            repeat_count: 1,
            program_type: 'CUSTOM',
            session_per_day: 1,
            created_by: body.usersId,
            duration_sec: durationSec,
          })
        }

        patientProgramId = `PP${Date.now().toString().slice(-6)}`
        await tx.insert(patientPrograms).values({
          patient_program_id: patientProgramId,
          patient_id: body.patientId,
          program_id: programId,
          assigned_by: body.otId,
        })
      }

      const sessionId = `TS${Date.now().toString().slice(-6)}`
      await tx.insert(therapySessions).values({
        session_id: sessionId,
        patient_program_id: patientProgramId,
        session_date: body.sessionDate ? new Date(body.sessionDate) : new Date(),
        duration_sec: durationSec,
        total_reps: Number(body.totalReps),
        status: 'COMPLETED',
      })

      return { sessionId }
    })

    return NextResponse.json({ message: 'บันทึกผลการฝึกสำเร็จ', session_id: result.sessionId }, { status: 201, headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
