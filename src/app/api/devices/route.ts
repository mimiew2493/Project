import { db } from '@/src/db'
import { devices } from '@/src/db/schema/devices'
import { appointments } from '@/src/db/schema/appointments'
import { patients } from '@/src/db/schema/patients'
import { users } from '@/src/db/schema/users'
import { eq, and, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

// GET /api/devices — คลังอุปกรณ์ + ผู้ถือครองปัจจุบัน (มาจากนัดที่ยังไม่เกิดขึ้น/SCHEDULED ล่าสุด)
export async function GET() {
  try {
    const deviceRows = await db.select().from(devices)

    const holderRows = await db
      .select({
        device_id: appointments.device_id,
        patient_id: appointments.patient_id,
        first_name: users.first_name,
        last_name: users.last_name,
        appointment_date: appointments.appointment_date,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patient_id, patients.patient_id))
      .leftJoin(users, eq(patients.users_id, users.users_id))
      .where(and(eq(appointments.status, 'SCHEDULED')))
      .orderBy(desc(appointments.appointment_date))

    const holderByDevice = new Map<string, (typeof holderRows)[number]>()
    for (const row of holderRows) {
      if (row.device_id && !holderByDevice.has(row.device_id)) holderByDevice.set(row.device_id, row)
    }

    const result = deviceRows.map(d => {
      const holder = holderByDevice.get(d.device_id)
      return {
        device_id: d.device_id,
        device_name: d.device_name,
        serial_number: d.serial_number,
        status: d.status,
        holder_patient_id: holder?.patient_id ?? null,
        holder_name: holder ? `${holder.first_name ?? ''} ${holder.last_name ?? ''}`.trim() : null,
        issued_date: holder?.appointment_date ?? null,
      }
    })

    return NextResponse.json(result, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// POST /api/devices — เพิ่มอุปกรณ์ใหม่เข้าคลัง
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.deviceName || !body.serialNumber) {
      return NextResponse.json({ error: 'ต้องระบุชื่ออุปกรณ์และหมายเลขซีเรียล' }, { status: 400, headers: cors })
    }

    const deviceId = `DEV${Date.now().toString().slice(-6)}`
    await db.insert(devices).values({
      device_id: deviceId,
      device_name: body.deviceName,
      serial_number: body.serialNumber,
      status: body.status || 'ACTIVE',
    })

    return NextResponse.json({ message: 'เพิ่มอุปกรณ์สำเร็จ', device_id: deviceId }, { status: 201, headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// PATCH /api/devices — แก้ไขข้อมูล/สถานะอุปกรณ์
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    if (!body.deviceId) {
      return NextResponse.json({ error: 'ต้องระบุ deviceId' }, { status: 400, headers: cors })
    }

    const patch: Record<string, unknown> = {}
    if (body.deviceName !== undefined) patch.device_name = body.deviceName
    if (body.serialNumber !== undefined) patch.serial_number = body.serialNumber
    if (body.status !== undefined) patch.status = body.status

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะแก้ไข' }, { status: 400, headers: cors })
    }

    await db.update(devices).set(patch).where(eq(devices.device_id, body.deviceId))

    return NextResponse.json({ message: 'แก้ไขอุปกรณ์สำเร็จ' }, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}

// DELETE /api/devices?device_id=DEV000001 — ลบอุปกรณ์ออกจากคลัง
export async function DELETE(req: Request) {
  try {
    const deviceId = new URL(req.url).searchParams.get('device_id')
    if (!deviceId) {
      return NextResponse.json({ error: 'ต้องระบุ device_id' }, { status: 400, headers: cors })
    }

    await db.delete(devices).where(eq(devices.device_id, deviceId))

    return NextResponse.json({ message: 'ลบอุปกรณ์สำเร็จ' }, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
