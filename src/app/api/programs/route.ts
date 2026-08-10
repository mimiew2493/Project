import { db } from '@/src/db'
import { programs } from '@/src/db/schema/program'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/programs?created_by=USR000001 → รายการโปรแกรมการฝึกของนักกายภาพคนนั้น (หรือทั้งหมดถ้าไม่ระบุ)
export async function GET(req: Request) {
  try {
    const createdBy = new URL(req.url).searchParams.get('created_by')

    const rows = createdBy
      ? await db.select().from(programs).where(eq(programs.created_by, createdBy))
      : await db.select().from(programs)

    return NextResponse.json(rows, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/programs → นักกายภาพสร้างโปรแกรมการฝึกใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.programName || !body.usersId) {
      return NextResponse.json({ error: 'ต้องระบุชื่อโปรแกรมและผู้สร้าง' }, { status: 400, headers: cors })
    }

    const programId = `PRG${Date.now().toString().slice(-6)}`
    await db.insert(programs).values({
      program_id: programId,
      program_name: body.programName,
      description: body.description || null,
      repeat_count: Number(body.repeatCount) || 1,
      program_type: 'CUSTOM',
      session_per_day: Number(body.sessionPerDay) || 1,
      created_by: body.usersId,
      duration_sec: Math.round((Number(body.durationMin) || 20) * 60),
    })

    return NextResponse.json({ message: 'สร้างโปรแกรมสำเร็จ', program_id: programId }, { status: 201, headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
