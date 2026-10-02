import { useEffect, useState } from 'react'
import type { TherapySession, PatientProgram } from '../../types'
import { Check, Info } from 'lucide-react'
import { API_BASE } from '../../config'
import { RepDots, SetSegments } from './patientUi'
import { fmtClock, fmtDuration, sessionsOnDay } from './patientUtils'

interface Props {
  patientId: string
  firstName: string
  /** เซตที่เพิ่งจบ — null = ยังไม่ได้รับผลจากอุปกรณ์ */
  session: TherapySession | null
  onHome: () => void
  onHistory: () => void
}

export default function PatientSummaryPage({ patientId, firstName, session, onHome, onHistory }: Props) {
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [sessions, setSessions] = useState<TherapySession[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/patient-programs?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/sessions?patient_id=${patientId}`).then(r => r.json()),
    ])
      .then(([pp, s]) => {
        if (Array.isArray(pp)) setProgram(pp.find((x: PatientProgram) => x.status === 'ACTIVE') ?? null)
        if (Array.isArray(s)) setSessions(s)
      })
      .catch(() => {})
  }, [patientId])

  const target = program?.repeat_count ?? 0
  const totalSets = program?.session_per_day ?? 0
  const today = sessionsOnDay(sessions, new Date())
  const setNo = session ? today.findIndex(s => s.session_id === session.session_id) + 1 || today.length : today.length
  const reachedGoal = !!session && target > 0 && session.total_reps >= target
  const avgPerRep = session && session.total_reps > 0 ? Math.round(session.duration_sec / session.total_reps) : null
  const moreSets = totalSets > 0 && today.length < totalSets

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-5 pb-7 pt-9">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#FBE7DC] text-[#C4501A]">
          <Check size={34} strokeWidth={2.4} />
        </div>
        <div className="mt-1 text-[24px] font-bold">{session ? `จบเซตที่ ${setNo} แล้ว` : 'จบการฝึกแล้ว'}</div>
        <div className="text-[15px] text-[#625E70]">
          {!session
            ? 'ยังไม่ได้รับผลจากอุปกรณ์ ผลจะแสดงในหน้าผลการฝึกเมื่ออุปกรณ์ส่งข้อมูลเข้ามา'
            : reachedGoal ? `เก่งมาก ${firstName} ครบเป้าหมายของเซตนี้` : `ทำได้ดี ${firstName} พักแล้วค่อยลองใหม่นะ`}
        </div>
      </div>

      {session && (
        <>
          <div className="flex flex-col items-center gap-3 rounded-[20px] bg-white p-5 shadow-[0_1px_3px_rgba(31,29,43,0.06)]">
            <div className="text-[13px] text-[#625E70]">จำนวนครั้งที่ทำได้</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[56px] font-bold leading-none">{session.total_reps}</span>
              <span className="text-[18px] text-[#625E70]">/ {target} ครั้ง</span>
            </div>
            <RepDots done={session.total_reps} target={target} />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3">
              <span className="text-[12px] text-[#625E70]">เวลาที่ใช้</span>
              <span className="text-[18px] font-bold">{fmtDuration(session.duration_sec)}</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3">
              <span className="text-[12px] text-[#625E70]">เฉลี่ยต่อครั้ง</span>
              <span className="text-[18px] font-bold">{avgPerRep != null ? `${avgPerRep} วิ` : '–'}</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-2xl bg-white p-3">
              <span className="text-[12px] text-[#625E70]">จบเมื่อ</span>
              <span className="text-[18px] font-bold">{fmtClock(session.session_date)}</span>
            </div>
          </div>
        </>
      )}

      {totalSets > 0 && (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4">
          <div className="flex justify-between text-[14px]">
            <span className="font-semibold">ความคืบหน้าวันนี้</span>
            <span className="text-[#625E70]">{Math.min(today.length, totalSets)}/{totalSets} เซต</span>
          </div>
          <SetSegments done={today.length} total={totalSets} />
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-2xl bg-[#EFEAF7] px-4 py-3.5 text-[#46406A]">
        <Info size={20} className="mt-0.5 shrink-0" />
        <span className="text-[13px] leading-relaxed">
          {moreSets ? `พักตามที่นักกายภาพแนะนำก่อนเริ่มเซตที่ ${today.length + 1} ` : ''}
          ถ้ารู้สึกล้ามากผิดปกติ ให้หยุดและแจ้งนักกายภาพ
        </span>
      </div>

      <div className="flex-1" />

      <button onClick={onHome} className="h-[52px] rounded-[14px] bg-[#C4501A] text-[16px] font-semibold text-white">กลับหน้าหลัก</button>
      <button onClick={onHistory} className="h-11 text-[15px] font-medium text-[#A8430F]">ดูผลการฝึกทั้งหมด</button>
    </div>
  )
}
