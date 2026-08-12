import { db } from '@/src/db'
import { patientPrograms } from '@/src/db/schema/patientProgram'
import { programs } from '@/src/db/schema/program'
import { eq, and, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/patient-programs?patient_id=PAT000001 → โปรแกรมที่มอบหมายให้ผู้ป่วยคนนี้ (ล่าสุดก่อน)
export async function GET(req: Request) {
  try {
    const patientId = new URL(req.url).searchParams.get('patient_id')
    if (!patientId) {
      return NextResponse.json({ error: 'ต้องระบุ patient_id' }, { status: 400, headers: cors })
    }

    const rows = await db
      .select({
        patient_program_id: patientPrograms.patient_program_id,
        patient_id: patientPrograms.patient_id,
        program_id: programs.program_id,
        program_name: programs.program_name,
        description: programs.description,
        repeat_count: programs.repeat_count,
        target_stage: programs.target_stage,
        session_per_day: programs.session_per_day,
        duration_sec: programs.duration_sec,
        assigned_date: patientPrograms.assigned_date,
        status: patientPrograms.status,
      })
      .from(patientPrograms)
      .innerJoin(programs, eq(patientPrograms.program_id, programs.program_id))
      .where(eq(patientPrograms.patient_id, patientId))
      .orderBy(desc(patientPrograms.assigned_date))

    return NextResponse.json(rows, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/patient-programs → นักกายภาพกำหนดโปรแกรมการฝึกให้ผู้ป่วย (ยกเลิกโปรแกรมเดิมที่ ACTIVE อยู่)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.patientId || !body.programId || !body.otId) {
      return NextResponse.json({ error: 'ต้องระบุ patientId, programId และ otId' }, { status: 400, headers: cors })
    }

    const result = await db.transaction(async (tx) => {
      // ปิดโปรแกรมเดิมที่ยัง ACTIVE อยู่ของผู้ป่วยคนนี้
      await tx
        .update(patientPrograms)
        .set({ status: 'INACTIVE', end_date: new Date().toISOString().slice(0, 10) })
        .where(and(eq(patientPrograms.patient_id, body.patientId), eq(patientPrograms.status, 'ACTIVE')))

      const patientProgramId = `PP${Date.now().toString().slice(-6)}`
      await tx.insert(patientPrograms).values({
        patient_program_id: patientProgramId,
        patient_id: body.patientId,
        program_id: body.programId,
        assigned_by: body.otId,
        status: 'ACTIVE',
      })

      return { patientProgramId }
    })

    return NextResponse.json({ message: 'กำหนดโปรแกรมให้ผู้ป่วยสำเร็จ', patient_program_id: result.patientProgramId }, { status: 201, headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
