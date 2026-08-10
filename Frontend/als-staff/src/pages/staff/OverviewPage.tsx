import { useEffect, useState } from 'react'
import type { Patient, Therapist, PatientAppointment, Device } from '../../types'
import { API_BASE } from '../../config'

const MONTH_LABELS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`

export default function OverviewPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/patients?status=ALL`).then(r => r.json()),
      fetch(`${API_BASE}/api/therapists`).then(r => r.json()),
      fetch(`${API_BASE}/api/appointments`).then(r => r.json()),
      fetch(`${API_BASE}/api/devices`).then(r => r.json()),
    ])
      .then(([p, t, a, d]) => {
        if (Array.isArray(p)) setPatients(p)
        if (Array.isArray(t)) setTherapists(t)
        if (Array.isArray(a)) setAppointments(a)
        if (Array.isArray(d)) setDevices(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  const now = new Date()
  const thisMonthKey = monthKey(now)
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthKey = monthKey(lastMonthDate)

  const patientMonthKey = (p: Patient) => p.register_date ? monthKey(new Date(p.register_date)) : null
  const newThisMonth = patients.filter(p => patientMonthKey(p) === thisMonthKey).length
  const newLastMonth = patients.filter(p => patientMonthKey(p) === lastMonthKey).length
  const pctChange = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : null

  const completedAppts = appointments.filter(a => a.status === 'COMPLETED').length
  const completionRate = appointments.length > 0 ? Math.round((completedAppts / appointments.length) * 100) : null

  const chartMonths = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1)
    const key = monthKey(d)
    return { label: MONTH_LABELS[d.getMonth()], count: patients.filter(p => patientMonthKey(p) === key).length }
  })
  const maxChartVal = Math.max(1, ...chartMonths.map(m => m.count))

  const assignedPatientIds = new Set(appointments.filter(a => a.ot_id).map(a => a.patient_id))
  const unassignedCount = patients.filter(p => !assignedPatientIds.has(p.patient_id)).length

  const holding = devices.filter(d => d.holder_name).length
  const available = devices.filter(d => d.status === 'ACTIVE' && !d.holder_name).length
  const maintenance = devices.filter(d => d.status === 'MAINTENANCE').length

  return (
    <>
      <div className="h-sec">
        <div><h1 className="page-title">ภาพรวมศูนย์</h1><p className="page-sub">ใช้รายงานผลต่อผู้บริหารศูนย์</p></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => alert('Export PDF...')}>↓ PDF</button>
        </div>
      </div>

      <div className="grid3">
        <div className="card"><div className="eyebrow">ผู้ป่วยในระบบ</div><div className="big">{patients.length}<span className="big-unit">คน</span></div></div>
        <div className="card">
          <div className="eyebrow">รับใหม่เดือนนี้</div>
          <div className="big">{newThisMonth}<span className="big-unit">คน</span></div>
          {pctChange !== null && (
            <div style={{ fontSize: 10.5, color: pctChange >= 0 ? 'var(--green)' : 'var(--rose)', marginTop: 3 }}>
              {pctChange >= 0 ? '▲' : '▼'} {Math.abs(pctChange)}% จากเดือนก่อน
            </div>
          )}
        </div>
        <div className="card">
          <div className="eyebrow">อัตรานัดที่เสร็จสมบูรณ์</div>
          <div className="big">{completionRate ?? '—'}<span className="big-unit">{completionRate !== null && '%'}</span></div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>{completedAppts} / {appointments.length} นัดที่บันทึกไว้</div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="card">
          <div className="h-sec"><span className="h-sec-title">จำนวนผู้ป่วยรายเดือน (ลงทะเบียนใหม่)</span></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160, paddingTop: 20 }}>
            {chartMonths.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{m.count}</span>
                <div style={{ background: 'var(--green)', borderRadius: '4px 4px 0 0', width: '100%', height: (m.count / maxChartVal) * 120 }} />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="h-sec"><span className="h-sec-title">แยกตามผู้ดูแลเคส</span></div>
            {therapists.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>ยังไม่มีนักกิจกรรมบำบัดในระบบ</div>}
            {therapists.map(t => (
              <div key={t.ot_id} className="kv"><span>กภ. {t.first_name} {t.last_name}</span><b>{t.cases ?? 0} เคส</b></div>
            ))}
            <div className="kv"><span>ยังไม่มอบหมาย</span><b style={{ color: unassignedCount > 0 ? 'var(--rose)' : 'var(--green)' }}>{unassignedCount} เคส</b></div>
            <div className="note" style={{ marginTop: 10, fontSize: 11 }}>ตัวเลข "ยังไม่มอบหมาย" คือ KPI จริงของธุรการ — ควรเป็น 0</div>
          </div>
          <div className="card">
            <div className="h-sec"><span className="h-sec-title">สถานะอุปกรณ์รวม</span></div>
            <div className="kv"><span>มีผู้ถือครอง</span><b style={{ color: 'var(--green)' }}>{holding} เครื่อง</b></div>
            <div className="kv"><span>พร้อมจ่าย</span><b style={{ color: 'var(--blue)' }}>{available} เครื่อง</b></div>
            <div className="kv"><span>ส่งซ่อม</span><b style={{ color: 'var(--amber)' }}>{maintenance} เครื่อง</b></div>
          </div>
        </div>
      </div>
    </>
  )
}
