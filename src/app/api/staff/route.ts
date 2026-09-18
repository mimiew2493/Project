import { db } from '@/src/db'
import { users } from '@/src/db/schema/users'
import { medicalRecordsStaff } from '@/src/db/schema/medicalRecordsStaff'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { DEFAULT_PASSWORD, hashPassword } from '@/src/utils/password'
import { pgErrorCode } from '@/src/utils/db-error'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/staff — ดึงรายชื่อเจ้าหน้าที่เวชระเบียน
export async function GET() {
  try {
    const result = await db
      .select({
        staff_id: medicalRecordsStaff.medical_records_staff_id,
        users_id: medicalRecordsStaff.users_id,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
        email: users.email,
      })
      .from(medicalRecordsStaff)
      .innerJoin(users, eq(medicalRecordsStaff.users_id, users.users_id))

    return NextResponse.json(result, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/staff — เพิ่มเจ้าหน้าที่เวชระเบียนใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'ต้องระบุชื่อและนามสกุล' }, { status: 400, headers: cors })
    }

    const timestamp = Date.now().toString().slice(-6)
    const usersId = `U${timestamp}`
    const staffId = `MRS${timestamp}`

    if (body.phone) {
      const [existing] = await db.select({ users_id: users.users_id }).from(users).where(eq(users.username, body.phone))
      if (existing) {
        return NextResponse.json({ error: 'เบอร์โทรนี้มีผู้ใช้งานในระบบแล้ว กรุณาใช้เบอร์อื่น' }, { status: 409, headers: cors })
      }
    }

    await db.insert(users).values({
      users_id: usersId,
      role_id: 'R003',
      username: body.phone || `mrs${timestamp}`,
      password: await hashPassword(DEFAULT_PASSWORD),
      first_name: body.firstName,
      last_name: body.lastName,
      phone: body.phone || null,
      email: body.email || null,
      gender: body.gender || null,
      birth_date: body.birthDate || null,
      status: 'ACTIVE',
    })

    await db.insert(medicalRecordsStaff).values({
      medical_records_staff_id: staffId,
      users_id: usersId,
    })

    return NextResponse.json({
      message: 'เพิ่มเจ้าหน้าที่เวชระเบียนสำเร็จ',
      staff_id: staffId,
      users_id: usersId,
    }, { status: 201, headers: cors })
  } catch (error: any) {
    if (pgErrorCode(error) === '23505') {
      return NextResponse.json({ error: 'ข้อมูลนี้ซ้ำกับที่มีอยู่ในระบบแล้ว (เช่น เบอร์โทรหรืออีเมล)' }, { status: 409, headers: cors })
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// PATCH /api/staff — แก้ไขข้อมูล / รีเซ็ตรหัสผ่าน
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    if (!body.usersId) {
      return NextResponse.json({ error: 'ต้องระบุ usersId' }, { status: 400, headers: cors })
    }

    const userPatch: Record<string, unknown> = {}
    if (body.firstName !== undefined) userPatch.first_name = body.firstName
    if (body.lastName !== undefined) userPatch.last_name = body.lastName
    if (body.phone !== undefined) userPatch.phone = body.phone || null
    if (body.email !== undefined) userPatch.email = body.email || null
    if (body.gender !== undefined) userPatch.gender = body.gender || null
    if (body.newPassword) userPatch.password = await hashPassword(body.newPassword)
    if (Object.keys(userPatch).length > 0) {
      await db.update(users).set(userPatch).where(eq(users.users_id, body.usersId))
    }

    return NextResponse.json({ message: 'แก้ไขข้อมูลเจ้าหน้าที่สำเร็จ' }, { headers: cors })
  } catch (error: any) {
    if (pgErrorCode(error) === '23505') {
      return NextResponse.json({ error: 'ข้อมูลนี้ซ้ำกับที่มีอยู่ในระบบแล้ว (เช่น เบอร์โทรหรืออีเมล)' }, { status: 409, headers: cors })
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// DELETE /api/staff?staff_id=MRS000001 → ลบเจ้าหน้าที่เวชระเบียน (ลบ users ต้นทาง cascade ไปที่ medical_records_staff)
export async function DELETE(req: Request) {
  try {
    const staffId = new URL(req.url).searchParams.get('staff_id')
    if (!staffId) {
      return NextResponse.json({ error: 'ต้องระบุ staff_id' }, { status: 400, headers: cors })
    }

    const [staff] = await db
      .select({ users_id: medicalRecordsStaff.users_id })
      .from(medicalRecordsStaff)
      .where(eq(medicalRecordsStaff.medical_records_staff_id, staffId))
    if (!staff) {
      return NextResponse.json({ error: 'ไม่พบเจ้าหน้าที่' }, { status: 404, headers: cors })
    }

    await db.delete(users).where(eq(users.users_id, staff.users_id))

    return NextResponse.json({ message: 'ลบเจ้าหน้าที่สำเร็จ' }, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
