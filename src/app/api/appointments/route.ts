import { db } from '@/src/db'
import { appointments } from '@/src/db/schema/appointments'
import { patients } from '@/src/db/schema/patients'
import { users } from '@/src/db/schema/users'
import { occupationalTherapists } from '@/src/db/schema/occupationalTherapist'
import { devices } from '@/src/db/schema/devices'
import { eq, asc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

const patientUser = alias(users, 'patient_user')
const otUser = alias(users, 'ot_user')

// GET /api/appointments            → นัดทั้งหมด
// GET /api/appointments?patient_id=P123456  → นัดของผู้ป่วยคนนั้น
export async function GET(req: Request) {
  try {
    const patientId = new URL(req.url).searchParams.get('patient_id')

    const query = db
      .select({
        appointment_id: appointments.appointment_id,
        patient_id: appointments.patient_id,
        patient_name: patientUser.first_name,
        patient_lastname: patientUser.last_name,
        ot_id: appointments.ot_id,
        therapist_name: otUser.first_name,
        therapist_lastname: otUser.last_name,
        device_id: appointments.device_id,
        device_status: devices.status,
        appointment_date: appointments.appointment_date,
        duration_min: appointments.duration_min,
        treated_side: appointments.treated_side,
        affected_side: patients.affected_side,
        status: appointments.status,
        note: appointments.note,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patient_id, patients.patient_id))
      .leftJoin(patientUser, eq(patients.users_id, patientUser.users_id))
      .leftJoin(occupationalTherapists, eq(appointments.ot_id, occupationalTherapists.ot_id))
      .leftJoin(otUser, eq(occupationalTherapists.users_id, otUser.users_id))
      .leftJoin(devices, eq(appointments.device_id, devices.device_id))

    const rows = patientId
      ? await query
          .where(eq(appointments.patient_id, patientId))
          .orderBy(asc(appointments.appointment_date))
      : await query.orderBy(asc(appointments.appointment_date))

    return NextResponse.json(rows, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/appointments → สร้างนัดใหม่ให้ผู้ป่วย
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.patientId || !body.appointmentDate) {
      return NextResponse.json(
        { error: 'ต้องระบุ patientId และ appointmentDate' },
        { status: 400, headers: cors }
      )
    }

    const appointmentId = `A${Date.now().toString().slice(-6)}`

    await db.insert(appointments).values({
      appointment_id: appointmentId,
      patient_id: body.patientId,
      ot_id: body.otId || null,
      device_id: body.deviceId || null,
      appointment_date: new Date(body.appointmentDate),
      duration_min: Number(body.durationMin) || 60,
      treated_side: body.treatedSide || null,
      status: body.status || 'SCHEDULED',
      note: body.note || null,
    })

    return NextResponse.json(
      { message: 'บันทึกนัดหมายสำเร็จ', appointment_id: appointmentId },
      { status: 201, headers: cors }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// PATCH /api/appointments → แก้ไข/ยกเลิกนัด
export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (!body.appointmentId) {
      return NextResponse.json(
        { error: 'ต้องระบุ appointmentId' },
        { status: 400, headers: cors }
      )
    }

    const patch: Record<string, unknown> = {}
    if (body.appointmentDate) patch.appointment_date = new Date(body.appointmentDate)
    if (body.durationMin) patch.duration_min = Number(body.durationMin)
    if (body.otId !== undefined) patch.ot_id = body.otId || null
    if (body.deviceId !== undefined) patch.device_id = body.deviceId || null
    if (body.treatedSide !== undefined) patch.treated_side = body.treatedSide || null
    if (body.status) patch.status = body.status
    if (body.note !== undefined) patch.note = body.note || null

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'ไม่มีข้อมูลที่จะแก้ไข' },
        { status: 400, headers: cors }
      )
    }

    await db
      .update(appointments)
      .set(patch)
      .where(eq(appointments.appointment_id, body.appointmentId))

    return NextResponse.json({ message: 'แก้ไขนัดหมายสำเร็จ' }, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
