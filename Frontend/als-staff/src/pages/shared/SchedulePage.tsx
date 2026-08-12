import { useEffect, useMemo, useState } from 'react'
import type { PatientAppointment } from '../../types'
import SideBadge from '../../components/SideBadge'
import { ToolIcon, CheckIcon, AlertTriangleIcon, CalendarIcon, XCircleIcon } from '../../components/Icon'
import { API_BASE } from '../../config'

const TIMES = ['08', '09', '10', '11', '12', '13', '14', '15', '16']
const DAY_LABELS = ['จ', 'อ', 'พ', 'พฤ', 'ศ']

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

const startOfWeek = (base: Date) => {
  const d = new Date(base)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const toLocalYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const MONTH_DAY_LABELS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

interface Props { lockOtId?: string }

export default function SchedulePage({ lockOtId }: Props) {
  const [filterOt, setFilterOt] = useState('all')
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [allSaved, setAllSaved] = useState<PatientAppointment[]>([])

  useEffect(() => {
    fetch(`${API_BASE}/api/appointments`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllSaved(d) })
      .catch(() => {})
  }, [])

  const saved = lockOtId ? allSaved.filter(a => a.ot_id === lockOtId) : allSaved

  const weekDays = useMemo(() => {
    const monday = startOfWeek(new Date())
    monday.setDate(monday.getDate() + weekOffset * 7)
    return Array.from({ length: 5 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
  }, [weekOffset])

  const weekLabel = `${weekDays[0].getDate()} – ${weekDays[4].toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const therapistOptions = useMemo(() => {
    const map = new Map<string, string>()
    saved.forEach(a => { if (a.ot_id) map.set(a.ot_id, `กภ. ${a.therapist_name ?? ''} ${a.therapist_lastname ?? ''}`.trim()) })
    return Array.from(map.entries())
  }, [saved])

  const cellMap = useMemo(() => {
    const map = new Map<string, PatientAppointment>()
    saved.forEach(a => {
      const d = new Date(a.appointment_date)
      const dayIdx = weekDays.findIndex(wd => wd.toDateString() === d.toDateString())
      if (dayIdx === -1) return
      const hour = String(d.getHours()).padStart(2, '0')
      map.set(`${hour}-${dayIdx}`, a)
    })
    return map
  }, [saved, weekDays])

  const monthAnchor = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    d.setHours(0, 0, 0, 0)
    return d
  }, [monthOffset])

  const monthLabel = monthAnchor.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  const monthCells = useMemo(() => {
    const firstOfMonth = new Date(monthAnchor)
    const gridStart = startOfWeek(firstOfMonth)
    const nextMonth = new Date(monthAnchor)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const cells: Date[] = []
    const cur = new Date(gridStart)
    while (cur < nextMonth || cur.getDay() !== 1) {
      cells.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
      if (cells.length >= 42) break
    }
    return cells
  }, [monthAnchor])

  const apptsByDay = useMemo(() => {
    const map = new Map<string, PatientAppointment[]>()
    saved.forEach(a => {
      if (filterOt !== 'all' && a.ot_id !== filterOt) return
      const key = toLocalYMD(new Date(a.appointment_date))
      const arr = map.get(key) ?? []
      arr.push(a)
      map.set(key, arr)
    })
    return map
  }, [saved, filterOt])

  const dayList = selectedDay
    ? saved.filter(a => toLocalYMD(new Date(a.appointment_date)) === selectedDay && (filterOt === 'all' || a.ot_id === filterOt))
    : saved

  return (
    <>
      <div className="h-sec">
        <div>
          <h1 className="page-title">{lockOtId ? 'ตารางนัดตรวจเช็คอุปกรณ์ของฉัน' : 'ตารางนัดตรวจเช็คอุปกรณ์รวมของศูนย์'}</h1>
          <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {lockOtId ? 'นัดตรวจเช็คอุปกรณ์ IoT ที่มอบหมายให้คุณ (ไม่ใช่นัดตรวจอาการ)' : 'นัดตรวจเช็คอุปกรณ์ IoT ของผู้ป่วยแต่ละคน — สร้างนัดใหม่ได้จากหน้าคลังอุปกรณ์'} · <ToolIcon size={12} /> = สถานะเครื่องกายภาพ
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {viewMode === 'week' ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>← สัปดาห์ก่อน</button>
              <span style={{ padding: '6px 12px', fontWeight: 600 }}>{weekLabel}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}>สัปดาห์ถัดไป →</button>
              {weekOffset !== 0 && <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)}>สัปดาห์นี้</button>}
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setMonthOffset(m => m - 1)}>← เดือนก่อน</button>
              <span style={{ padding: '6px 12px', fontWeight: 600 }}>{monthLabel}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setMonthOffset(m => m + 1)}>เดือนถัดไป →</button>
              {monthOffset !== 0 && <button className="btn btn-ghost btn-sm" onClick={() => setMonthOffset(0)}>เดือนนี้</button>}
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button className={`filter-pill ${viewMode === 'week' ? 'active' : ''}`} onClick={() => { setViewMode('week'); setSelectedDay(null) }}>รายสัปดาห์</button>
        <button className={`filter-pill ${viewMode === 'month' ? 'active' : ''}`} onClick={() => { setViewMode('month'); setSelectedDay(null) }}>รายเดือน</button>
      </div>

      {!lockOtId && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <button className={`filter-pill ${filterOt === 'all' ? 'active' : ''}`} onClick={() => setFilterOt('all')}>ทุกนักกายภาพ</button>
          {therapistOptions.map(([id, label]) => (
            <button key={id} className={`filter-pill ${filterOt === id ? 'active' : ''}`} onClick={() => setFilterOt(id)}>{label}</button>
          ))}
        </div>
      )}

      {viewMode === 'week' && (
      <div className="card-0" style={{ overflowX: 'auto' }}>
        <div className="time-grid" style={{ gridTemplateColumns: '70px repeat(5,1fr)' }}>
          <div className="time-header" />
          {weekDays.map((d, i) => <div key={i} className="time-header">{DAY_LABELS[i]} {d.getDate()}</div>)}
          {TIMES.map(h => {
            const isLunch = h === '12'
            return (
              <>
                <div key={h + '-label'} className="time-label mono" style={isLunch ? { color: 'var(--rose)' } : {}}>
                  {h}:00{isLunch ? <><br /><small>พักเที่ยง</small></> : <><br /><small>–{String(Number(h) + 1).padStart(2, '0')}:00</small></>}
                </div>
                {[0, 1, 2, 3, 4].map(ci => {
                  if (isLunch) return <div key={ci} className="time-slot time-slot-lunch" />
                  const a = cellMap.get(h + '-' + ci)
                  if (a && (filterOt === 'all' || a.ot_id === filterOt)) {
                    const deviceOk = a.device_status ? a.device_status === 'ACTIVE' : null
                    return (
                      <div key={ci} className="time-slot">
                        <div className="appt-block" style={{ background: 'var(--blue-t)' }}>
                          <b>{a.patient_name ? `${a.patient_name} ${a.patient_lastname ?? ''}`.trim() : a.patient_id}</b><br />
                          <span style={{ color: 'var(--muted)' }}>{a.therapist_name ? `กภ. ${a.therapist_name}` : 'ยังไม่มอบหมาย'} · {a.duration_min} นาที</span>
                          {a.device_id && (
                            <div className="device-check"><ToolIcon size={11} /> {a.device_id} {deviceOk === null ? '' : deviceOk ? <CheckIcon size={11} /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><AlertTriangleIcon size={11} /> ไม่ส่งข้อมูล</span>}</div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return <div key={ci} className="time-slot time-slot-empty">+ ว่าง</div>
                })}
              </>
            )
          })}
        </div>
      </div>
      )}

      {viewMode === 'month' && (
      <div className="card-0" style={{ padding: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {MONTH_DAY_LABELS.map(l => (
            <div key={l} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--muted)', padding: '4px 0' }}>{l}</div>
          ))}
          {monthCells.map((d, i) => {
            const key = toLocalYMD(d)
            const inMonth = d.getMonth() === monthAnchor.getMonth()
            const dayAppts = apptsByDay.get(key) ?? []
            const isSelected = selectedDay === key
            const isToday = key === toLocalYMD(new Date())
            return (
              <div key={i}
                   onClick={() => setSelectedDay(isSelected ? null : key)}
                   style={{
                     minHeight: 58, borderRadius: 8, padding: '6px 6px', cursor: 'pointer',
                     background: isSelected ? 'var(--blue)' : dayAppts.length ? 'var(--blue-t)' : 'var(--paper)',
                     border: isToday ? '1.5px solid var(--blue)' : '1px solid var(--line)',
                     opacity: inMonth ? 1 : 0.4,
                   }}>
                <div style={{ fontSize: 11.5, fontWeight: isToday ? 700 : 500, color: isSelected ? '#fff' : undefined }}>{d.getDate()}</div>
                {dayAppts.length > 0 && (
                  <div style={{ fontSize: 10.5, marginTop: 4, fontWeight: 700, color: isSelected ? '#fff' : 'var(--blue)' }}>
                    {dayAppts.length} นัด
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      )}

      <div className="h-sec" style={{ marginTop: 22 }}>
        <div>
          <h2 className="page-title" style={{ fontSize: 18 }}>
            {selectedDay ? `นัดวันที่ ${new Date(selectedDay).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'นัดที่บันทึกไว้ในระบบ'}
          </h2>
          <p className="page-sub">
            {selectedDay
              ? <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', height: 'auto' }} onClick={() => setSelectedDay(null)}>← ดูทั้งหมด</button>
              : 'ดึงจากตาราง appointments — นัดของผู้ป่วยแต่ละคนพร้อมข้างที่รักษา'}
          </p>
        </div>
        <span className="pill">{dayList.length} นัด</span>
      </div>

      {dayList.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon"><CalendarIcon size={48} /></div>
          <div className="empty-title">ยังไม่มีนัดที่บันทึกไว้</div>
          <div className="empty-sub">นัดจะถูกสร้างเมื่อลงทะเบียนผู้ป่วยใหม่และเลือกวัน/เวลานัด</div>
        </div>
      ) : (
        <div className="stack">
          {dayList.map(a => (
            <div className="patient-card" key={a.appointment_id}>
              <div className="patient-top">
                <div className="patient-identity">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span className="patient-name">{a.patient_name ? `${a.patient_name} ${a.patient_lastname ?? ''}` : a.patient_id}</span>
                      <SideBadge side={a.treated_side ?? a.affected_side} />
                    </div>
                    <div className="patient-meta" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <CalendarIcon size={11} /> {fmt(a.appointment_date)} · {a.duration_min} นาที
                      {a.therapist_name ? ` · กภ. ${a.therapist_name}` : ''}
                      {a.device_id ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>· <ToolIcon size={11} /> {a.device_id}</span> : ''}
                      {a.note ? ` · ${a.note}` : ''}
                    </div>
                  </div>
                </div>
                <div className="patient-actions">
                  <span className={`pill ${a.status === 'SCHEDULED' ? 'pill-amber' : ''}`}>{a.status}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{a.appointment_id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="note" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <b>สัญลักษณ์:</b>
        <ToolIcon size={12} /><CheckIcon size={12} /> = อุปกรณ์พร้อม ·
        <ToolIcon size={12} /><AlertTriangleIcon size={12} /> = ไม่ส่งข้อมูล (ต้องตรวจ) ·
        <ToolIcon size={12} /><XCircleIcon size={12} /> = ส่งซ่อม (ต้องเปลี่ยนเครื่อง)
      </div>
    </>
  )
}
