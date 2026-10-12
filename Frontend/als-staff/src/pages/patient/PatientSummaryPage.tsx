import { useEffect, useState } from 'react'
import type { Device, TherapySession, PatientProgram } from '../../types'
import { Check } from 'lucide-react'
import { api, list } from '../../lib/clinic'
import { SetSegments } from './patientUi'
import { fmtClock, fmtDuration, sessionsOnDay } from './patientUtils'

interface Props {
  patientId: string
  firstName: string
  /** เซตที่เพิ่งจบ — null = ยังไม่ได้รับผลจากอุปกรณ์ */
  session: TherapySession | null
  onHome: () => void
  onHistory: () => void
  /** ผู้ป่วยกดเริ่มเซตถัดไปเอง → กลับไปหน้าระหว่างฝึก */
  onNextSet: () => void
}

export default function PatientSummaryPage({ patientId, firstName, session, onHome, onHistory, onNextSet }: Props) {
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [fatigue, setFatigue] = useState<number | null>(session?.fatigue_level ?? null)
  const [saveError, setSaveError] = useState('')
  // กระดานยังผูกกับนัดของผู้ป่วย (นักกายภาพยังไม่บันทึกผลจบการฝึก) → เริ่มเซตถัดไปได้
  const [device, setDevice] = useState<Device | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    list<PatientProgram>(`/api/patient-programs?patient_id=${patientId}`).then(pp => setProgram(pp.find(x => x.status === 'ACTIVE') ?? null))
    list<TherapySession>(`/api/sessions?patient_id=${patientId}`).then(setSessions)
    list<Device>('/api/devices').then(ds => setDevice(ds.find(d => d.holder_patient_id === patientId) ?? null))
  }, [patientId])

  const rate = (level: number) => {
    if (!session) return
    const prev = fatigue
    setFatigue(level); setSaveError('')
    api('/api/sessions', { method: 'PATCH', body: { sessionId: session.session_id, fatigueLevel: level } })
      .catch(() => { setFatigue(prev); setSaveError('บันทึกความเหนื่อยไม่สำเร็จ ลองอีกครั้ง') })
  }

  const startNext = () => {
    if (!device || starting) return
    setStarting(true)
    api('/api/devices/command', { method: 'POST', body: { deviceId: device.device_id, command: 'START' } })
      .then(() => onNextSet())
      .catch(() => { setStarting(false); setSaveError('เริ่มเซตไม่สำเร็จ ลองอีกครั้ง') })
  }

  const totalSets = program?.session_per_day ?? 0
  const today = sessionsOnDay(sessions, new Date())
  const setNo = session ? today.findIndex(s => s.session_id === session.session_id) + 1 || today.length : today.length
  const avgPerRep = session && session.total_reps > 0 ? Math.round(session.duration_sec / session.total_reps) : null

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-5 pb-7 pt-9">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-pt-tint text-pt-accent">
          <Check size={34} strokeWidth={2.4} />
        </div>
        <div className="mt-1 text-[24px] font-bold">{session ? `จบเซตที่ ${setNo} แล้ว` : 'จบการฝึกแล้ว'}</div>
        <div className="text-[15px] text-pt-muted">
          {session ? `เก่งมาก ${firstName} ระบบบันทึกผลเซตนี้แล้ว` : 'ยังไม่ได้รับผลจากกระดาน ผลจะแสดงในหน้าผลการฝึกเมื่อกระดานส่งข้อมูลเข้ามา'}
        </div>
      </div>

      {session && (
        <>
          <div className="flex flex-col items-center gap-3 rounded-[20px] bg-white p-5 shadow-[0_1px_3px_rgba(31,29,43,0.06)]">
            <div className="text-[13px] text-pt-muted">จำนวนครั้งที่ทำได้</div>
            <span className="text-[56px] font-bold leading-none">{session.total_reps}</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3"><span className="text-[12px] text-pt-muted">เวลาที่ใช้</span><span className="text-[18px] font-bold">{fmtDuration(session.duration_sec)}</span></div>
            <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3"><span className="text-[12px] text-pt-muted">เฉลี่ยต่อครั้ง</span><span className="text-[18px] font-bold">{avgPerRep != null ? `${avgPerRep} วิ` : '–'}</span></div>
            <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3"><span className="text-[12px] text-pt-muted">จบเมื่อ</span><span className="text-[18px] font-bold">{fmtClock(session.session_date)}</span></div>
          </div>
        </>
      )}

      {totalSets > 0 && (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4">
          <div className="flex justify-between text-[14px]">
            <span className="font-semibold">ความคืบหน้าวันนี้</span>
            <span className="text-pt-muted">{Math.min(today.length, totalSets)}/{totalSets} เซต</span>
          </div>
          <SetSegments done={today.length} total={totalSets} />
        </div>
      )}

      {session && (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-white px-4 py-3.5">
          <span className="text-[14px] font-semibold">เซตนี้เหนื่อยแค่ไหน</span>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                aria-pressed={fatigue === n}
                onClick={() => rate(n)}
                className={`h-11 rounded-xl text-[16px] font-semibold ${fatigue === n ? 'border-none bg-pt-accent text-white' : 'border border-[#E4E0EC] bg-white text-pt-ink'}`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[12px] text-pt-muted"><span>ไม่เหนื่อย</span><span>เหนื่อยมาก</span></div>
          {saveError && <span className="text-[12px] text-[#A32D2D]">{saveError}</span>}
        </div>
      )}

      <div className="flex-1" />
      {device && (totalSets === 0 || today.length < totalSets) && (
        <button type="button" onClick={startNext} disabled={starting} className="h-[52px] rounded-[14px] bg-pt-accent text-[16px] font-semibold text-white disabled:opacity-60">
          {starting ? 'กำลังเริ่มเซต...' : `เริ่มเซตถัดไป${totalSets ? ` (เซต ${today.length + 1}/${totalSets})` : ''}`}
        </button>
      )}
      <button type="button" onClick={onHome} className={`h-[52px] rounded-[14px] text-[16px] font-semibold ${device && (totalSets === 0 || today.length < totalSets) ? 'border-[1.5px] border-pt-accent bg-white text-pt-accent-ink' : 'bg-pt-accent text-white'}`}>กลับหน้าหลัก</button>
      <button type="button" onClick={onHistory} className="h-11 text-[15px] font-medium text-pt-accent-ink">ดูผลการฝึกทั้งหมด</button>
    </div>
  )
}
