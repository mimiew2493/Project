import { useEffect, useRef, useState } from 'react'
import type { Device, TherapySession, PatientProgram } from '../../types'
import { ChevronLeft } from 'lucide-react'
import { api, list } from '../../lib/clinic'
import { fmtDuration, sessionsOnDay } from './patientUtils'

interface Props {
  patientId: string
  onBack: () => void
  /** เรียกเมื่ออุปกรณ์ส่งผลเซตใหม่เข้ามา (หรือผู้ป่วยกดจบเซต) — session = null ถ้ายังไม่มีผลจากอุปกรณ์ */
  onFinish: (session: TherapySession | null) => void
}

const POLL_MS = 1500
const STOP_WAIT_MS = 15000

// ผู้ป่วยหยุดเซตได้ทุกเมื่อถ้าเหนื่อย (STOP) — เริ่มเซตเป็นหน้าที่ของนักกายภาพ
const sendCommand = (deviceId: string, command: 'STOP') =>
  api('/api/devices/command', { method: 'POST', body: { deviceId, command } }).catch(() => {})

const fetchSessions = (patientId: string) => list<TherapySession>(`/api/sessions?patient_id=${patientId}`)
const myDevice = (ds: Device[], patientId: string) => ds.find(d => d.holder_patient_id === patientId) ?? null

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
      list<PatientProgram>(`/api/patient-programs?patient_id=${patientId}`),
      list<Device>('/api/devices'),
      fetchSessions(patientId),
    ])
      .then(([pp, d, s]) => {
        setProgram(pp.find(x => x.status === 'ACTIVE') ?? null)
        const mine = myDevice(d, patientId)
        setDevice(mine)
        baseline.current = new Set(s.map(x => x.session_id))
        setSetNo(sessionsOnDay(s, new Date()).length + 1)
        // ผู้ป่วยไม่ต้องกดเริ่มฝึกเอง: กระดานเริ่มนับเมื่อนักกายภาพเชื่อมต่อ / เริ่มเซตถัดไป
      })
      .finally(() => setLoading(false))
  }, [patientId])

  useEffect(() => {
    const tick = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 1000)
    const poll = setInterval(() => {
      list<Device>('/api/devices').then(d => setDevice(myDevice(d, patientId)))
      fetchSessions(patientId).then(s => { const fresh = findNew(s); if (fresh) finish(fresh) })
    }, POLL_MS)
    return () => { clearInterval(tick); clearInterval(poll) }
  }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  // สั่งหยุด แล้วรอให้อุปกรณ์ส่งผลเซตเข้ามา (polling ด้านบนจะพาไปหน้าสรุปเอง) — ถ้าเงียบเกิน STOP_WAIT_MS ค่อยไปต่อโดยไม่มีผล
  const endSet = () => {
    if (stopping) return
    setStopping(true)
    if (device) sendCommand(device.device_id, 'STOP')
    setTimeout(() => {
      fetchSessions(patientId).then(s => finish(findNew(s))).catch(() => finish(null))
    }, device ? STOP_WAIT_MS : 0)
  }


  const totalSets = program?.session_per_day ?? 0
  const connected = device?.connection_status === 'CONNECTED'
  const liveReps = connected && device?.live_status === 'RUNNING' && typeof device.live_reps === 'number' ? device.live_reps : null
  const hint = !device ? 'ยังไม่ได้ผูกกระดาน กรุณาแจ้งนักกายภาพ'
    : !connected ? 'เปิดเครื่องกระดานและรอให้เชื่อมต่อ WiFi'
    : stopping ? 'กำลังรอผลจากกระดาน...'
    : liveReps == null ? 'รอนักกายภาพเริ่มเซต'
    : 'ครั้งที่ทำได้ในเซตนี้ · ทำเท่าที่ไหว ไม่มีจำนวนขั้นต่ำ'

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-5 pb-7 pt-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="กลับ" className="flex h-11 w-11 items-center justify-center rounded-xl border border-pt-line bg-white">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col">
          <span className="text-[18px] font-bold">กำลังฝึก · เซต {setNo}{totalSets ? `/${totalSets}` : ''}</span>
          <span className="text-[13px] text-pt-muted">{loading ? 'กำลังโหลด...' : program?.program_name ?? 'ยังไม่มีโปรแกรมฝึก'}</span>
        </div>
      </div>

      <div className={`flex items-center gap-2 self-start rounded-full px-3.5 py-[7px] text-[13px] font-medium ${connected ? 'bg-[#E4F5EC] text-[#145C38]' : 'bg-pt-divider text-pt-muted'}`}>
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-[#1F9D5C]' : 'bg-[#9A95A8]'}`} />
        {device ? `กระดาน ${device.device_name || device.device_id} ${connected ? 'เชื่อมต่อแล้ว · รับค่าสด' : 'ยังไม่เชื่อมต่อ'}` : 'ยังไม่ได้ผูกกระดาน'}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-[20px] bg-white px-5 pb-[22px] pt-6 shadow-[0_1px_3px_rgba(31,29,43,0.06)]">
        <span className="text-[68px] font-bold leading-none">{liveReps ?? '–'}</span>
        <span className="text-center text-[14px] text-pt-muted">{hint}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-0.5 rounded-2xl bg-white px-4 py-3.5">
          <span className="text-[12px] text-pt-muted">เวลาที่ใช้</span>
          <span className="text-[22px] font-bold tabular-nums">{fmtDuration(elapsed)}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-2xl bg-white px-4 py-3.5">
          <span className="text-[12px] text-pt-muted">เวลาฝึกตามนัด</span>
          <span className="text-[22px] font-bold">{program ? `${Math.round(program.duration_sec / 60)} นาที` : '–'}</span>
        </div>
      </div>

      <div className="flex-1" />

      <button type="button" onClick={endSet} disabled={stopping} className="h-[52px] rounded-[14px] border-[1.5px] border-pt-accent bg-white text-[16px] font-semibold text-pt-accent-ink disabled:opacity-60">
        {stopping ? 'กำลังบันทึกผล...' : 'จบเซตนี้'}
      </button>
      <span className="text-center text-[13px] text-pt-muted">หยุดได้ทุกเมื่อถ้ารู้สึกเหนื่อย ระบบจะบันทึกจำนวนที่ทำได้ไว้</span>
    </div>
  )
}
