import { db } from '@/src/db'
import { users } from '@/src/db/schema/users'
import { occupationalTherapists } from '@/src/db/schema/occupationalTherapist'
import { patients } from '@/src/db/schema/patients'
import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'

const cors = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/therapists — ดึงรายชื่อนักกายภาพ + จำนวนเคส
export async function GET() {
  try {
    const result = await db
      .select({
        ot_id: occupationalTherapists.ot_id,
        users_id: occupationalTherapists.users_id,
        license_number: occupationalTherapists.license_number,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
      })
      .from(occupationalTherapists)
      .innerJoin(users, eq(occupationalTherapists.users_id, users.users_id))

    return NextResponse.json(result, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/therapists — เพิ่มนักกายภาพใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const timestamp = Date.now().toString().slice(-6)
    const usersId = `U${timestamp}`
    const otId = `OT${timestamp}`

    // สร้าง user (role R002 = นักกิจกรรมบำบัด)
    await db.insert(users).values({
      users_id: usersId,
      role_id: 'R002',
      username: body.phone || `ot${timestamp}`,
      password: '1234',
      first_name: body.firstName,
      last_name: body.lastName,
      phone: body.phone || null,
      email: body.email || null,
      gender: body.gender || null,
      birth_date: body.birthDate || null,
      status: 'ACTIVE',
    })

    // สร้าง occupational therapist
    await db.insert(occupationalTherapists).values({
      ot_id: otId,
      users_id: usersId,
      license_number: body.licenseNumber,
    })

    return NextResponse.json({
      message: 'เพิ่มนักกายภาพสำเร็จ',
      ot_id: otId,
      users_id: usersId,
    }, { status: 201, headers: cors })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}