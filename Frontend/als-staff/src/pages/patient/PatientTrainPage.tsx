import { useEffect, useRef, useState } from 'react'
import type { Device, TherapySession, PatientProgram } from '../../types'
import { ChevronLeft } from 'lucide-react'
import { API_BASE } from '../../config'
import { ProgressRing, RepDots } from './patientUi'
import { fmtDuration, sessionsOnDay } from './patientUtils'

interface Props {
  patientId: string
  onBack: () => void
  /** เรียกเมื่ออุปกรณ์ส่งผลเซตใหม่เข้ามา (หรือผู้ป่วยกดจบเซต) — session = null ถ้ายังไม่มีผลจากอุปกรณ์ */
  onFinish: (session: TherapySession | null) => void
}

const POLL_MS = 1500
const STOP_WAIT_MS = 15000

const sendCommand = (deviceId: string, command: 'START' | 'STOP') =>
  fetch(`${API_BASE}/api/devices/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, command }),
  }).catch(() => {})

const fetchSessions = (patientId: string): Promise<TherapySession[]> =>
  fetch(`${API_BASE}/api/sessions?patient_id=${patientId}`).then(r => r.json()).then(s => (Array.isArray(s) ? s : []))

export default function PatientTrainPage({ patientId, onBack, onFinish }: Props) {
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [device, setDevice] = useState<Device | null>(null)
  const [setNo, setSetNo] = useState(1)
  const [loading, setLoading] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [stopping, setStopping] = useState(false)
  const baseline = useRef<Set<string> | null>(null)
  const startedAt = useRef(Date.now())
  const finished = useRef(false)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  // เซสชันที่ยังไม่อยู่ใน baseline = ผลของเซตนี้ที่อุปกรณ์เพิ่งส่งขึ้นมา
  const findNew = (sessions: TherapySession[]) =>
    baseline.current ? sessions.find(s => !baseline.current!.has(s.session_id)) ?? null : null

  const finish = (session: TherapySession | null) => {
    if (finished.current) return
    finished.current = true
    onFinishRef.current(session)
  }

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/patient-programs?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/devices`).then(r => r.json()),
      fetchSessions(patientId),
    ])
      .then(([pp, d, s]) => {
        if (Array.isArray(pp)) setProgram(pp.find((x: PatientProgram) => x.status === 'ACTIVE') ?? null)
        const mine: Device | null = Array.isArray(d) ? d.find((x: Device) => x.holder_patient_id === patientId) ?? null : null
        setDevice(mine)
        baseline.current = new Set(s.map(x => x.session_id))
        setSetNo(sessionsOnDay(s, new Date()).length + 1)
        // สั่งให้อุปกรณ์เริ่มเซต — อุปกรณ์จะรับคำสั่งตอนส่ง telemetry ครั้งถัดไป
        if (mine) sendCommand(mine.device_id, 'START')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  useEffect(() => {
    const tick = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 1000)
    const poll = setInterval(() => {
      fetch(`${API_BASE}/api/devices`).then(r => r.json())
        .then(d => { if (Array.isArray(d)) setDevice(d.find((x: Device) => x.holder_patient_id === patientId) ?? null) })
        .catch(() => {})
      fetchSessions(patientId).then(s => {
        const fresh = baseline.current ? s.find(x => !baseline.current!.has(x.session_id)) : undefined
        if (fresh && !finished.current) { finished.current = true; onFinishRef.current(fresh) }
      }).catch(() => {})
    }, POLL_MS)
    return () => { clearInterval(tick); clearInterval(poll) }
  }, [patientId])

  // สั่งหยุด แล้วรอให้อุปกรณ์ส่งผลเซตเข้ามา (polling ด้านบนจะพาไปหน้าสรุปเอง) — ถ้าเงียบเกิน STOP_WAIT_MS ค่อยไปต่อโดยไม่มีผล
  const endSet = () => {
    if (stopping) return
    setStopping(true)
    if (device) sendCommand(device.device_id, 'STOP')
    setTimeout(() => {
      fetchSessions(patientId).then(s => finish(findNew(s))).catch(() => finish(null))
    }, device ? STOP_WAIT_MS : 0)
  }

  const goBack = () => {
    if (device) sendCommand(device.device_id, 'STOP')
    onBack()
  }

  const target = program?.repeat_count ?? 0
  const totalSets = program?.session_per_day ?? 0
  const connected = device?.connection_status === 'CONNECTED'
  const running = connected && device?.live_status === 'RUNNING'
  const liveReps = running && typeof device?.live_reps === 'number' ? device.live_reps : null
  const reps = liveReps ?? 0
  const remaining = Math.max(0, target - reps)
  const hint = !device ? 'ยังไม่มีอุปกรณ์ที่ผูกกับคุณ กรุณาติดต่อนักกายภาพ'
    : !connected ? 'เปิดเครื่องอุปกรณ์และรอให้เชื่อมต่อ WiFi'
    : stopping ? 'กำลังรอผลจากอุปกรณ์...'
    : liveReps == null ? 'กำลังสั่งให้อุปกรณ์เริ่มเซต...'
    : remaining > 0 ? `อีก ${remaining} ครั้งจะครบเซตนี้` : 'ครบเป้าหมายเซตนี้แล้ว'

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-5 pb-7 pt-5">
      <div className="flex items-center gap-3">
        <button onClick={goBack} aria-label="กลับหน้าหลัก" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ECE8F3] bg-white">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col">
          <span className="text-[18px] font-bold">กำลังฝึก · เซต {setNo}{totalSets ? `/${totalSets}` : ''}</span>
          <span className="text-[13px] text-[#625E70]">{loading ? 'กำลังโหลด...' : program?.program_name ?? 'ยังไม่มีโปรแกรมฝึก'}</span>
        </div>
      </div>

      <div className={`flex items-center gap-2 self-start rounded-full px-3.5 py-[7px] text-[13px] font-medium ${connected ? 'bg-[#E4F5EC] text-[#145C38]' : 'bg-[#F1EDF6] text-[#625E70]'}`}>
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-[#1F9D5C]' : 'bg-[#9A95A8]'}`} />
        {device
          ? `${device.device_name || device.device_id} ${connected ? 'เชื่อมต่อแล้ว · รับค่าสด' : 'ยังไม่เชื่อมต่อ'}`
          : 'ยังไม่มีอุปกรณ์ที่ผูกกับคุณ'}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-[20px] bg-white px-5 pb-[22px] pt-6 shadow-[0_1px_3px_rgba(31,29,43,0.06)]">
        <ProgressRing size={200} stroke={14} pct={target ? reps / target : 0}>
          <span className="text-[68px] font-bold leading-none">{liveReps ?? '–'}</span>
          <span className="mt-1.5 text-[15px] text-[#625E70]">จาก {target} ครั้ง</span>
        </ProgressRing>
        <RepDots done={reps} target={target} />
        <span className="text-center text-[14px] text-[#625E70]">{hint}</span>
      </div>

      {connected && (device.voltage != null || device.current_a != null || device.battery_level != null) && (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3">
            <span className="text-[12px] text-[#625E70]">แบตเตอรี่</span>
            <span className="text-[18px] font-bold">{device.battery_level != null ? `${device.battery_level}%` : '–'}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3">
            <span className="text-[12px] text-[#625E70]">แรงดัน</span>
            <span className="text-[18px] font-bold">{device.voltage != null ? `${device.voltage.toFixed(1)} V` : '–'}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3">
            <span className="text-[12px] text-[#625E70]">กระแส</span>
            <span className="text-[18px] font-bold">{device.current_a != null ? `${device.current_a.toFixed(2)} A` : '–'}</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 text-[13px] text-[#625E70]">
        <div className="mb-1 text-[14px] font-semibold text-[#1F1D2B]">วิธีฝึก</div>
        เลื่อนช้าๆ ให้สุดระยะ แล้วดึงกลับ นับเป็น 1 ครั้ง
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-0.5 rounded-2xl bg-white px-4 py-3.5">
          <span className="text-[12px] text-[#625E70]">เวลาที่ใช้</span>
          <span className="text-[22px] font-bold tabular-nums">{fmtDuration(elapsed)}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-2xl bg-white px-4 py-3.5">
          <span className="text-[12px] text-[#625E70]">เป้าหมายเวลา</span>
          <span className="text-[22px] font-bold">{program ? `${Math.round(program.duration_sec / 60)} นาที` : '–'}</span>
        </div>
      </div>

      <div className="flex-1" />

      <button onClick={endSet} disabled={stopping} className="h-[52px] rounded-[14px] border-[1.5px] border-[#C4501A] bg-white text-[16px] font-semibold text-[#A8430F] disabled:opacity-60">
        {stopping ? 'กำลังบันทึกผล...' : 'จบเซตนี้'}
      </button>
      <span className="text-center text-[13px] text-[#625E70]">หยุดได้ทุกเมื่อถ้ารู้สึกเหนื่อย ระบบจะบันทึกจำนวนที่ทำได้ไว้</span>
    </div>
  )
}
