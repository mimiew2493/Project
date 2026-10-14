import { Fragment } from 'react'
import type { AppointmentRequest, Patient, PatientAppointment, PatientProgram, SoapAmendment, TherapySession } from '../types'
import { activePrograms } from '../lib/useCase'
import { setsOfVisit, avg, effectiveSoap, thaiDate, slotLabel, apptSlot, hhmm, sameDay, ptName, initials, stageLabel, fullName, SOAP_FIELDS, SOAP_LABEL, type SoapField } from '../lib/clinic'
import { Avatar, Badge, Chip } from './ui'

/** หัวข้อมูลผู้ป่วย (การ์ดบนสุดของหน้าเคส/ประวัติ) */
export function PatientHeader({ patient, programs, badge, extra, showPt }: { patient: Patient; programs: PatientProgram[]; badge?: React.ReactNode; extra?: React.ReactNode[]; showPt?: boolean }) {
  const prog = activePrograms(programs).map(p => p.program_name).join(', ')
  const meta = [`HN ${patient.patient_id}`, showPt && `นักกายภาพ ${ptName(patient.primary_ot_name)}`, prog && `โปรแกรม ${prog}`, ...(extra ?? [])].filter(Boolean)
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white bg-white px-5 py-4">
      <Avatar text={initials(patient.first_name)} size={52} />
      <div className="flex flex-[1_1_260px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[20px] font-semibold">{fullName(patient.first_name, patient.last_name)}</span>
          {badge ?? <Badge label={stageLabel(patient.current_stage)} bg="#E5F1FF" fg="#0066D6" />}
        </div>
        <div className="flex flex-wrap gap-2 text-[12px] text-rx-muted">
          {meta.map((m, i) => <span key={i}>{i > 0 && <span className="mr-2">·</span>}{m}</span>)}
        </div>
      </div>
    </div>
  )
}

/** การ์ดการมารักษาแต่ละครั้ง */
export function VisitCard({ a, sessions, patient, variant, amendments = [], requests = [], appts = [] }: { a: PatientAppointment; sessions: TherapySession[]; patient: Patient; variant: 'staff' | 'therapist'; amendments?: SoapAmendment[]; /** คำขอนัดทั้งหมดของผู้ป่วย (หน้าเวชระเบียน) */ requests?: AppointmentRequest[]; /** นัดทั้งหมดของผู้ป่วย ไว้หาวันนัดที่ลงจากคำขอ */ appts?: PatientAppointment[] }) {
  // ผู้รักษาจริง = นักกายภาพที่เชื่อมต่อกระดาน · ข้อความ SOAP ใช้ฉบับปัจจุบัน (รวมบันทึกแก้ไข)
  const treater = a.treated_by_name ?? a.therapist_name
  const soap = effectiveSoap(a, amendments)
  const notes = amendments.filter(m => m.appointment_id === a.appointment_id)
  const sets = setsOfVisit(sessions, a)
  const came = a.status !== 'NO_SHOW' && a.status !== 'SCHEDULED'
  const live = a.status === 'IN_PROGRESS' || a.status === 'CHECKED_IN'
  const treaterId = a.treated_by ?? a.ot_id
  const subst = !!treaterId && !!patient.primary_ot_id && treaterId !== patient.primary_ot_id
  const fatigue = avg(sets.map(s => s.fatigue_level).filter((f): f is number => f != null))
  const day = new Date(a.appointment_date)
  const isToday = sameDay(day, new Date())

  // ข้างที่ฝึกของแต่ละเซต (ผู้ป่วยที่รักษาทั้งสองข้าง) และโปรแกรม/ข้างที่รักษาครั้งนั้น
  const sideOf = (s: TherapySession) => (s.side === 'LEFT' ? ' (ซ้าย)' : s.side === 'RIGHT' ? ' (ขวา)' : '')
  const setChips = sets.map((s, i) => <Chip key={s.session_id}>เซต {i + 1}{a.treated_side === 'ทั้งสองข้าง' ? sideOf(s) : ''}: ทำได้ {s.total_reps} ครั้ง</Chip>)
  const plan = [sets[0]?.program_name, a.treated_side].filter(Boolean).join(' · ')
  const planChip = plan ? <span className="rounded-lg bg-rx-tint px-2.5 py-[3px] text-[12px] font-semibold text-rx-accent-ink">{plan}</span> : null

  if (variant === 'therapist') {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-white bg-white px-[18px] py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[15px] font-semibold">{thaiDate(day)}</span>
            <span className="text-[13px] text-rx-muted">ผู้รักษา {ptName(treater)}</span>
            {subst && <Badge label="รักษาแทน" />}
          </div>
          {!came ? <Badge label="ไม่มาตามนัด" bg="#FCEBEB" fg="#791F1F" />
            : live ? <Badge label="กำลังรักษา · ร่าง" bg="#E3EEF9" fg="#1F5573" />
            : a.soap_saved_at ? <Badge label={`บันทึกผลแล้ว ${hhmm(new Date(a.soap_saved_at))}`} bg="#E4F5EC" fg="#145C38" />
            : <Badge label="ยังไม่บันทึกผล" />}
        </div>
        {live && <span className="text-[14px] text-rx-muted">กำลังฝึก · จะบันทึกผลเมื่อจบการฝึก</span>}
        {came && SOAP_FIELDS.some(k => soap[k]) && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-x-3 gap-y-1 text-[14px] leading-relaxed sm:grid-cols-[200px_minmax(0,1fr)]">
            {SOAP_FIELDS.map(k => (
              <Fragment key={k}>
                <span className="font-semibold text-rx-muted">{SOAP_LABEL[k]}</span>
                <span className="mb-1.5 whitespace-pre-wrap sm:mb-0">{soap[k] || '–'}</span>
              </Fragment>
            ))}
          </div>
        )}
        {came && (
          <div className="flex flex-wrap gap-1.5">
            {live && <Chip>ช่อง {slotLabel(apptSlot(a))}</Chip>}
            {live && a.device_name && <Chip>กระดาน {a.device_name}</Chip>}
            {planChip}{setChips}
            {fatigue != null && <Chip>เหนื่อย {fatigue.toFixed(fatigue % 1 ? 1 : 0)}/5</Chip>}
          </div>
        )}
        {notes.map(m => (
          <div key={m.amendment_id} className="rounded-lg bg-rx-bg px-3.5 py-2 text-[12px] leading-relaxed text-rx-muted">
            บันทึกแก้ไขเพิ่มเติม · {ptName(m.amended_by_name)} {thaiDate(new Date(m.amended_at))} {hhmm(new Date(m.amended_at))} — แก้ {SOAP_LABEL[m.field as SoapField] ?? m.field} จาก "{m.old_value || '–'}" เป็น "{m.new_value || '–'}" เหตุผล: {m.reason} ฉบับเดิมยังเก็บไว้
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-white bg-white px-[18px] py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[15px] font-semibold">{thaiDate(day)}{isToday ? ' · วันนี้' : ''}</span>
          <span className="text-[13px] text-rx-muted">ช่อง {slotLabel(apptSlot(a))}</span>
        </div>
        {came ? <Badge label={live ? 'กำลังรักษา' : 'มารักษา'} bg={live ? '#E3EEF9' : '#E4F5EC'} fg={live ? '#1F5573' : '#145C38'} /> : <Badge label="ไม่มาตามนัด" bg="#FCEBEB" fg="#791F1F" />}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-rx-tint px-3.5 py-2.5">
        <Avatar text={initials(treater)} size={36} solid />
        <div className="flex flex-col">
          <span className="text-[12px] text-rx-accent-deep">ผู้รักษาในครั้งนี้</span>
          <span className="text-[16px] font-semibold">{ptName(treater)}</span>
        </div>
        {subst && <Badge label="รักษาแทนนักกายภาพประจำเคส" bg="#FFF0D9" fg="#8C420A" />}
      </div>
      {/* เวชระเบียนเห็นเฉพาะ: ข้อมูลการสอบถามเพิ่มจากผู้ป่วย · นัดที่นักกายภาพขอและหมายเหตุ · วันนัดที่เวชระเบียนลงให้ */}
      {came && (() => {
        const asked = soap.S || a.symptoms_today
        // คำขอนัดที่นักกายภาพส่งในการมาครั้งนี้ (ส่งวันเดียวกับนัด)
        const reqs = requests.filter(r => sameDay(new Date(r.created_at), day))
        const rows: [string, string][] = []
        if (asked) rows.push([SOAP_LABEL.S, asked])
        for (const r of reqs) {
          if (r.note) rows.push(['รายเอียดการนัด', r.note])
          const booked = r.appointment_id ? appts.find(x => x.appointment_id === r.appointment_id) : undefined
          rows.push(['วันนัดที่เวชระเบียนลง',
            booked ? `${thaiDate(new Date(booked.appointment_date))} · ${slotLabel(apptSlot(booked))} น.${r.booked_at ? ` (ลงนัดเมื่อ ${thaiDate(new Date(r.booked_at))} ${hhmm(new Date(r.booked_at))} น.)` : ''}`
              : r.status === 'CANCELLED' ? 'ยกเลิกคำขอนัดแล้ว'
              : r.status === 'BOOKED' ? 'ลงนัดแล้ว'
              : 'รอเวชระเบียนลงนัด'])
        }
        return rows.length ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[14px] leading-relaxed sm:grid-cols-[220px_minmax(0,1fr)]">
            {rows.map(([k, v], i) => (
              <Fragment key={i}>
                <span className="text-rx-muted">{k}</span>
                <span className="mb-1.5 whitespace-pre-wrap sm:mb-0">{v}</span>
              </Fragment>
            ))}
          </div>
        ) : null
      })()}
    </div>
  )
}
