import { db } from '@/src/db'
import { patients } from '@/src/db/schema/patients'
import { users } from '@/src/db/schema/users'
import { eq, asc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/patients             → ผู้ป่วยที่ยังลงทะเบียนไม่ครบ (คิวรับผู้ป่วย)
// GET /api/patients?status=ALL  → ผู้ป่วยทั้งหมด
export async function GET(req: Request) {
  try {
    const status = new URL(req.url).searchParams.get('status')

    const query = db
      .select({
        patient_id: patients.patient_id,
        users_id: patients.users_id,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
        medical_condition: patients.medical_condition,
        weight: patients.weight,
        register_date: patients.register_date,
        address: patients.address,
        affected_side: patients.affected_side,
        affected_areas: patients.affected_areas,
        registration_step: patients.registration_step,
        status: patients.status,
      })
      .from(patients)
      .leftJoin(users, eq(patients.users_id, users.users_id))

    const rows =
      status === 'ALL'
        ? await query.orderBy(asc(patients.register_date))
        : await query.where(eq(patients.status, 'IN_PROGRESS')).orderBy(asc(patients.register_date))

    return NextResponse.json(rows, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// DELETE /api/patients?patient_id=PAT000001 → ลบผู้ป่วย (ลบ users ต้นทาง cascade ไปที่ patients/appointments)
export async function DELETE(req: Request) {
  try {
    const patientId = new URL(req.url).searchParams.get('patient_id')
    if (!patientId) {
      return NextResponse.json({ error: 'ต้องระบุ patient_id' }, { status: 400, headers: cors })
    }

    const [patient] = await db
      .select({ users_id: patients.users_id })
      .from(patients)
      .where(eq(patients.patient_id, patientId))
    if (!patient) {
      return NextResponse.json({ error: 'ไม่พบผู้ป่วย' }, { status: 404, headers: cors })
    }

    await db.delete(users).where(eq(users.users_id, patient.users_id))

    return NextResponse.json({ message: 'ลบผู้ป่วยสำเร็จ' }, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
