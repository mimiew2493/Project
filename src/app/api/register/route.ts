import { db } from '@/src/db'
import { users } from '@/src/db/schema/users'
import { patients } from '@/src/db/schema/patients'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // สร้าง ID อัตโนมัติ
    const timestamp = Date.now().toString().slice(-6)
    const usersId = `U${timestamp}`
    const patientId = `P${timestamp}`
    const hn = `HN-${67000 + Math.floor(Math.random() * 1000)}`

    // 1. สร้าง user (ตาม users schema)
    await db.insert(users).values({
      users_id: usersId,
      role_id: 'R001',
      username: body.phone || `user${timestamp}`,
      password: '1234',
      first_name: body.firstName,
      last_name: body.lastName,
      phone: body.phone || null,
      email: body.email || null,
      gender: body.gender || null,
      birth_date: body.birthDate || null,
      status: 'ACTIVE',
    })

    // 2. สร้าง patient (ตาม patients schema)
    await db.insert(patients).values({
      patient_id: patientId,
      users_id: usersId,
      medical_condition: body.medicalCondition || null,
      weight: body.weight || null,
      address: body.address || null,
    })

    return NextResponse.json({
      message: 'ลงทะเบียนสำเร็จ',
      patient_id: patientId,
      users_id: usersId,
      hn: hn,
    }, { status: 201, headers: cors })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: cors }
    )
  }
}