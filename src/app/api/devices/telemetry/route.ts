import { db } from '@/src/db'
import { devices } from '@/src/db/schema/devices'
import { appointments } from '@/src/db/schema/appointments'
import { patientPrograms } from '@/src/db/schema/patientProgram'
import { programs } from '@/src/db/schema/program'
import { therapySessions } from '@/src/db/schema/therapySession'
import { movementData } from '@/src/db/schema/movementData'
import { eq, and, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

const num = (v: unknown) => (v === undefined || v === null || v === '' || isNaN(Number(v)) ? undefined : Number(v))

/**
 * POST /api/devices/telemetry — อุปกรณ์ (ESP32) ส่งสถานะมาเป็นระยะ
 * body: {
 *   deviceId,                       // ต้องมีในคลังอุปกรณ์
 *   state: 'IDLE' | 'RUNNING' | 'DONE',
 *   reps?,                          // จำนวนครั้งสดระหว่างเซต (state = RUNNING)
 *   batteryLevel?, voltage?, current?, imuOk?,
 *   totalReps?, durationSec?, distanceCm?   // ผลของเซตที่เพิ่งจบ (state = DONE)
 * }
 * ตอบกลับ: { command: 'START' | 'STOP' | null, patientId, targetReps, durationSec, sessionId? }
 * คำสั่งที่แอปผู้ป่วยฝากไว้ (POST /api/devices/command) จะถูกส่งให้อุปกรณ์ครั้งเดียวแล้วล้างทิ้ง
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const deviceId: string | undefined = body.deviceId
    const state: string = body.state ?? 'IDLE'
    if (!deviceId || !['IDLE', 'RUNNING', 'DONE'].includes(state)) {
      return NextResponse.json({ error: 'ต้องระบุ deviceId และ state (IDLE | RUNNING | DONE)' }, { status: 400, headers: cors })
    }

    // ผู้ป่วยที่ถือครองอุปกรณ์นี้อยู่ = นัด SCHEDULED ล่าสุดที่ผูกอุปกรณ์นี้ (ใช้กติกาเดียวกับ GET /api/devices)
    const [holder] = await db
      .select({ patient_id: appointments.patient_id })
      .from(appointments)
      .where(and(eq(appointments.device_id, deviceId), eq(appointments.status, 'SCHEDULED')))
      .orderBy(desc(appointments.appointment_date))
      .limit(1)

    const [activeProgram] = holder
      ? await db
          .select({
            patient_program_id: patientPrograms.patient_program_id,
            repeat_count: programs.repeat_count,
            duration_sec: programs.duration_sec,
          })
          .from(patientPrograms)
          .innerJoin(programs, eq(patientPrograms.program_id, programs.program_id))
          .where(and(eq(patientPrograms.patient_id, holder.patient_id), eq(patientPrograms.status, 'ACTIVE')))
          .orderBy(desc(patientPrograms.assigned_date))
          .limit(1)
      : []

    const result = await db.transaction(async (tx) => {
      const [device] = await tx
        .select({ pending_command: devices.pending_command })
        .from(devices)
        .where(eq(devices.device_id, deviceId))
        .for('update')
      if (!device) return null

      const patch: Record<string, unknown> = {
        connection_status: 'CONNECTED',
        last_seen_at: new Date(),
        live_status: state === 'RUNNING' ? 'RUNNING' : 'IDLE',
        live_reps: state === 'RUNNING' ? num(body.reps) ?? 0 : null,
        pending_command: null,
      }
      const battery = num(body.batteryLevel)
      if (battery !== undefined) patch.battery_level = Math.max(0, Math.min(100, Math.round(battery)))
      if (num(body.voltage) !== undefined) patch.voltage = num(body.voltage)!.toFixed(2)
      if (num(body.current) !== undefined) patch.current_a = num(body.current)!.toFixed(2)
      if (typeof body.imuOk === 'boolean') patch.imu_status = body.imuOk ? 'OK' : 'ERROR'
      await tx.update(devices).set(patch).where(eq(devices.device_id, deviceId))

      // จบเซต → บันทึกผลการฝึกจริงให้ผู้ป่วยที่ถือครองอุปกรณ์
      let sessionId: string | null = null
      if (state === 'DONE' && activeProgram) {
        const now = new Date()
        const totalReps = Math.max(0, Math.round(num(body.totalReps) ?? 0))
        sessionId = `TS${Date.now().toString().slice(-6)}`
        await tx.insert(therapySessions).values({
          session_id: sessionId,
          patient_program_id: activeProgram.patient_program_id,
          session_date: now,
          duration_sec: Math.max(0, Math.round(num(body.durationSec) ?? 0)),
          total_reps: totalReps,
          status: 'COMPLETED',
        })
        await tx.insert(movementData).values({
          movement_id: `MV${Date.now().toString().slice(-6)}`,
          session_id: sessionId,
          device_id: deviceId,
          movement_count: totalReps,
          movement_distance: num(body.distanceCm) !== undefined ? num(body.distanceCm)!.toFixed(2) : null,
          recorded_at: now,
        })
      }

      return { command: device.pending_command, sessionId }
    })

    if (!result) {
      return NextResponse.json({ error: `ไม่พบอุปกรณ์ ${deviceId} ในคลังอุปกรณ์` }, { status: 404, headers: cors })
    }

    return NextResponse.json({
      command: result.command,
      patientId: holder?.patient_id ?? null,
      targetReps: activeProgram?.repeat_count ?? 0,
      durationSec: activeProgram?.duration_sec ?? 0,
      sessionId: result.sessionId,
    }, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}
