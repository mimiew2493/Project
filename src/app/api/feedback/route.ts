import { db } from '@/src/db'
import { feedback } from '@/src/db/schema/feedback'
import { therapySessions } from '@/src/db/schema/therapySession'
import { patientPrograms } from '@/src/db/schema/patientProgram'
import { occupationalTherapists } from '@/src/db/schema/occupationalTherapist'
import { users } from '@/src/db/schema/users'
import { eq, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/feedback?patient_id=PAT000001 → คำแนะนำที่นักกายภาพให้ผู้ป่วยคนนี้ (ล่าสุดก่อน)
export async function GET(req: Request) {
  try {
    const patientId = new URL(req.url).searchParams.get('patient_id')
    if (!patientId) {
      return NextResponse.json({ error: 'ต้องระบุ patient_id' }, { status: 400, headers: cors })
    }

    const rows = await db
      .select({
        feedback_id: feedback.feedback_id,
        comment: feedback.comment,
        rating: feedback.rating,
        created_at: feedback.created_at,
        session_id: therapySessions.session_id,
        session_date: therapySessions.session_date,
        therapist_name: users.first_name,
        therapist_lastname: users.last_name,
      })
      .from(feedback)
      .innerJoin(therapySessions, eq(feedback.session_id, therapySessions.session_id))
      .innerJoin(patientPrograms, eq(therapySessions.patient_program_id, patientPrograms.patient_program_id))
      .leftJoin(occupationalTherapists, eq(patientPrograms.assigned_by, occupationalTherapists.ot_id))
      .leftJoin(users, eq(occupationalTherapists.users_id, users.users_id))
      .where(eq(patientPrograms.patient_id, patientId))
      .orderBy(desc(feedback.created_at))

    return NextResponse.json(rows, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/feedback → นักกายภาพให้คำแนะนำผูกกับเซสชันการฝึกที่ระบุ
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.sessionId || !body.comment) {
      return NextResponse.json({ error: 'ต้องระบุ sessionId และ comment' }, { status: 400, headers: cors })
    }

    const [session] = await db
      .select({ session_id: therapySessions.session_id })
      .from(therapySessions)
      .where(eq(therapySessions.session_id, body.sessionId))
    if (!session) {
      return NextResponse.json({ error: 'ไม่พบเซสชันการฝึกนี้' }, { status: 404, headers: cors })
    }

    const feedbackId = `FB${Date.now().toString().slice(-6)}`
    await db.insert(feedback).values({
      feedback_id: feedbackId,
      session_id: body.sessionId,
      comment: body.comment,
      rating: body.rating !== undefined ? Number(body.rating) : null,
    })

    return NextResponse.json({ message: 'บันทึกคำแนะนำสำเร็จ', feedback_id: feedbackId }, { status: 201, headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
