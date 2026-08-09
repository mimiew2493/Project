import { db } from '@/src/db'
import { therapySessions } from '@/src/db/schema/therapySession'
import { patientPrograms } from '@/src/db/schema/patientProgram'
import { programs } from '@/src/db/schema/program'
import { movementData } from '@/src/db/schema/movementData'
import { eq, desc, sum } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET',
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
