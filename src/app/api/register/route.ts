import { db } from '@/src/db'
import { users } from '@/src/db/schema/users'
import { patients } from '@/src/db/schema/patients'
import { appointments } from '@/src/db/schema/appointments'
import { generateId } from '@/src/utils/generate-id'
import { ID_PREFIX, SEQUENCE } from '@/src/constants/id-config'
import { DEFAULT_PASSWORD, hashPassword } from '@/src/utils/password'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/register?patient_id=PAT000001 → โหลดข้อมูลที่บันทึกไว้ เพื่อ "ดำเนินการต่อ" จากคิว
export async function GET(req: Request) {
  try {
    const patientId = new URL(req.url).searchParams.get('patient_id')
    if (!patientId) {
      return NextResponse.json({ error: 'ต้องระบุ patient_id' }, { status: 400, headers: cors })
    }

    const [patient] = await db.select().from(patients).where(eq(patients.patient_id, patientId))
    if (!patient) {
      return NextResponse.json({ error: 'ไม่พบผู้ป่วย' }, { status: 404, headers: cors })
    }
    const [user] = await db.select().from(users).where(eq(users.users_id, patient.users_id))
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.patient_id, patientId))
      .orderBy(appointments.appointment_date)

    return NextResponse.json({ ...user, ...patient, appointment: appointment ?? null }, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/register → ขั้นที่ 1 (รับเรื่อง+ลงทะเบียน): สร้างผู้ป่วยใหม่เข้าคิว
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'ต้องระบุชื่อและนามสกุล' }, { status: 400, headers: cors })
    }

    const passwordHash = await hashPassword(DEFAULT_PASSWORD)

    const result = await db.transaction(async (tx) => {
      const usersId = await generateId(ID_PREFIX.USER, SEQUENCE.USER)
      const patientId = await generateId(ID_PREFIX.PATIENT, SEQUENCE.PATIENT)

      await tx.insert(users).values({
        users_id: usersId,
        role_id: 'R001',
        username: body.phone || usersId,
        password: passwordHash,
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone || null,
        status: 'ACTIVE',
      })

      await tx.insert(patients).values({
        patient_id: patientId,
        users_id: usersId,
        registration_step: 1,
        status: 'IN_PROGRESS',
      })

      return { usersId, patientId }
    })

    return NextResponse.json(
      { message: 'รับเรื่องสำเร็จ', patient_id: result.patientId, users_id: result.usersId },
      { status: 201, headers: cors }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// PATCH /api/register → ขั้นที่ 1-3: บันทึกข้อมูลเพิ่มเติม / นัดหมาย / ปิดการลงทะเบียน
export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (!body.patientId || !body.usersId) {
      return NextResponse.json({ error: 'ต้องระบุ patientId และ usersId' }, { status: 400, headers: cors })
    }

    const result = await db.transaction(async (tx) => {
      const userPatch: Record<string, unknown> = {}
      if (body.firstName !== undefined) userPatch.first_name = body.firstName
      if (body.lastName !== undefined) userPatch.last_name = body.lastName
      if (body.birthDate) userPatch.birth_date = body.birthDate
      if (body.gender !== undefined) userPatch.gender = body.gender || null
      if (body.phone !== undefined) userPatch.phone = body.phone || null
      if (body.email !== undefined) userPatch.email = body.email || null
      if (body.newPassword) userPatch.password = await hashPassword(body.newPassword)
      if (Object.keys(userPatch).length > 0) {
        await tx.update(users).set(userPatch).where(eq(users.users_id, body.usersId))
      }

      const patientPatch: Record<string, unknown> = {}
      if (body.medicalCondition !== undefined) patientPatch.medical_condition = body.medicalCondition || null
      if (body.weight !== undefined) patientPatch.weight = body.weight || null
      if (body.address !== undefined) patientPatch.address = body.address || null
      if (body.affectedSide !== undefined) patientPatch.affected_side = body.affectedSide || null
      if (body.affectedAreas !== undefined) patientPatch.affected_areas = body.affectedAreas || null
      if (body.step) {
        patientPatch.registration_step = Number(body.step)
        patientPatch.status = Number(body.step) >= 3 ? 'COMPLETED' : 'IN_PROGRESS'
      }
      if (Object.keys(patientPatch).length > 0) {
        await tx.update(patients).set(patientPatch).where(eq(patients.patient_id, body.patientId))
      }

      let appointmentId: string | null = body.appointmentId || null
      if (appointmentId) {
        // นัดมีอยู่แล้ว — แก้ไขเฉพาะฟิลด์ที่ส่งมา (เช่น มอบหมายอุปกรณ์ทีหลังโดยไม่ต้องส่งวันที่นัดซ้ำ)
        const apptPatch: Record<string, unknown> = {}
        if (body.otId !== undefined) apptPatch.ot_id = body.otId || null
        if (body.deviceId !== undefined) apptPatch.device_id = body.deviceId || null
        if (body.appointmentDate) apptPatch.appointment_date = new Date(body.appointmentDate)
        if (body.durationMin !== undefined) apptPatch.duration_min = Number(body.durationMin) || 60
        if (body.treatedSide !== undefined) apptPatch.treated_side = body.treatedSide || null
        if (body.appointmentNote !== undefined) apptPatch.note = body.appointmentNote || null
        if (Object.keys(apptPatch).length > 0) {
          await tx.update(appointments).set(apptPatch).where(eq(appointments.appointment_id, appointmentId))
        }
      } else if (body.appointmentDate) {
        const apptFields = {
          ot_id: body.otId || null,
          device_id: body.deviceId || null,
          appointment_date: new Date(body.appointmentDate),
          duration_min: Number(body.durationMin) || 60,
          treated_side: body.treatedSide || null,
          note: body.appointmentNote || null,
        }
        appointmentId = await generateId(ID_PREFIX.APPOINTMENT, SEQUENCE.APPOINTMENT)
        await tx.insert(appointments).values({
          appointment_id: appointmentId,
          patient_id: body.patientId,
          status: 'SCHEDULED',
          ...apptFields,
        })
      }

      return { appointmentId }
    })

    return NextResponse.json(
      { message: 'บันทึกสำเร็จ', patient_id: body.patientId, users_id: body.usersId, appointment_id: result.appointmentId },
      { headers: cors }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
