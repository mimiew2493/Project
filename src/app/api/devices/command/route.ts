import { db } from '@/src/db'
import { devices } from '@/src/db/schema/devices'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const COMMANDS = ['START', 'STOP']

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// POST /api/devices/command — แอปผู้ป่วยฝากคำสั่งไว้ให้อุปกรณ์ { deviceId, command: 'START' | 'STOP' }
// อุปกรณ์จะได้รับคำสั่งในคำตอบของ POST /api/devices/telemetry ครั้งถัดไป (ภายในไม่กี่วินาที)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.deviceId || !COMMANDS.includes(body.command)) {
      return NextResponse.json({ error: 'ต้องระบุ deviceId และ command (START | STOP)' }, { status: 400, headers: cors })
    }

    const updated = await db
      .update(devices)
      .set({ pending_command: body.command })
      .where(eq(devices.device_id, body.deviceId))
      .returning({ device_id: devices.device_id })
    if (updated.length === 0) {
      return NextResponse.json({ error: 'ไม่พบอุปกรณ์' }, { status: 404, headers: cors })
    }

    return NextResponse.json({ message: 'ส่งคำสั่งแล้ว' }, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
