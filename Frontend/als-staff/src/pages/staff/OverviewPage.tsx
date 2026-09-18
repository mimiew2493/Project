import { useEffect, useMemo, useState } from 'react'
import type { Patient, Therapist, PatientAppointment, Device, DiseaseStage, AuthUser, PageKey } from '../../types'
import { Users, UserPlus2, CalendarClock, HardDrive, ClipboardList, Cpu, CalendarDays, Wifi, ShieldCheck, ChevronRight } from 'lucide-react'
import TopHeader from '../../components/dashboard/TopHeader'
import SummaryCard from '../../components/dashboard/SummaryCard'
import LineChart from '../../components/dashboard/LineChart'
import AppointmentCalendar from '../../components/dashboard/AppointmentCalendar'
import DeviceStatusCard from '../../components/dashboard/DeviceStatusCard'
import { STAGE_LABEL } from '../shared/ProgramLibraryPage'
import { API_BASE } from '../../config'

interface Props { user: AuthUser; onGoto: (p: PageKey) => void }

const MONTH_LABELS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const initialsOf = (first?: string | null, last?: string | null) => `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?'

const APPT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'ยืนยันแล้ว', PROPOSED: 'รอยืนยัน', COMPLETED: 'เสร็จสิ้น', CANCELLED: 'ยกเลิก', NO_SHOW: 'ไม่มาตามนัด',
}
const APPT_STATUS_TONE: Record<string, string> = {
  SCHEDULED: 'bg-dash-primary-light text-dash-primary', PROPOSED: 'bg-[#fff5e9] text-[#e69a3e]',
  COMPLETED: 'bg-[#eafaf2] text-[#3fae7d]', CANCELLED: 'bg-[#ffeff1] text-[#f0596c]', NO_SHOW: 'bg-[#ffeff1] text-[#f0596c]',
}
const STAGE_BAR_TONE: Record<DiseaseStage, string> = { FLACCID: 'bg-[#f0596c]', SPASTIC: 'bg-[#e69a3e]', RECOVERY: 'bg-dash-primary' }
const STAGE_TEXT_TONE: Record<DiseaseStage, string> = { FLACCID: 'text-[#f0596c]', SPASTIC: 'text-[#e69a3e]', RECOVERY: 'text-dash-primary' }
const DEVICE_STATUS_LABEL: Record<string, string> = { ACTIVE: 'พร้อมใช้งาน', MAINTENANCE: 'ส่งซ่อม' }

export default function OverviewPage({ user, onGoto }: Props) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

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

  const now = new Date()
  const thisMonthKey = monthKey(now)
  const patientMonthKey = (p: Patient) => p.register_date ? monthKey(new Date(p.register_date)) : null
  const newThisMonth = patients.filter(p => patientMonthKey(p) === thisMonthKey).length
  const newToday = patients.filter(p => p.register_date && isSameDay(new Date(p.register_date), now)).length
  const todayAppts = appointments.filter(a => isSameDay(new Date(a.appointment_date), now) && a.status !== 'CANCELLED')
  const maintenanceDevices = devices.filter(d => d.status === 'MAINTENANCE').length
  const pendingRegistrations = patients.filter(p => p.status === 'IN_PROGRESS').length
  const connectedDevices = devices.filter(d => d.connection_status === 'CONNECTED').length
  const availableDevices = devices.filter(d => d.status === 'ACTIVE' && !d.holder_name).length
  const inUseDevices = devices.filter(d => d.status === 'ACTIVE' && !!d.holder_name).length
  const fleetTotal = Math.max(1, devices.length)
  const attentionDevices = devices
    .filter(d => d.connection_status !== 'CONNECTED' || (d.battery_level != null && d.battery_level < 20) || d.imu_status === 'WARNING' || d.imu_status === 'ERROR' || d.encoder_status === 'WARNING' || d.encoder_status === 'ERROR')
    .slice(0, 4)

  const stageCounts = useMemo(() => {
    const counts: Record<DiseaseStage, number> = { FLACCID: 0, SPASTIC: 0, RECOVERY: 0 }
    for (const p of patients) if (p.current_stage) counts[p.current_stage]++
    return counts
  }, [patients])
  const stagedTotal = Math.max(1, stageCounts.FLACCID + stageCounts.SPASTIC + stageCounts.RECOVERY)

  const maxCases = Math.max(1, ...therapists.map(t => t.cases ?? 0))

  const chartMonths = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1)
    const key = monthKey(d)
    return { label: MONTH_LABELS[d.getMonth()], value: patients.filter(p => patientMonthKey(p) === key).length }
  }), [patients])

  const calendarEvents = appointments.map(a => ({
    date: a.appointment_date,
    label: `${new Date(a.appointment_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} · ${a.patient_name ?? ''} ${a.patient_lastname ?? ''} — กภ.${a.therapist_name ?? '-'}`,
    tone: a.status === 'COMPLETED' ? 'green' as const : a.status === 'CANCELLED' ? 'red' as const : a.status === 'PROPOSED' ? 'orange' as const : 'blue' as const,
  }))

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  return (
    <>
      <TopHeader
        title="ภาพรวมศูนย์"
        breadcrumb={['หน้าแรก', 'เวชระเบียน']}
        user={user}
        action={{ label: 'ลงทะเบียนผู้ป่วยใหม่', icon: <UserPlus2 size={15} />, onClick: () => onGoto('register') }}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="mono flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-dash-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-dash-primary" style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }} />
          ศูนย์เวชระเบียน · ข้อมูลอัปเดตแบบเรียลไทม์ {clock.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => onGoto('schedule')} className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12px] font-semibold text-dash-text shadow-sm ring-1 ring-[#cfe4e0] transition hover:bg-dash-bg">
            <CalendarDays size={14} className="text-dash-primary" /> ตารางนัดหมาย
          </button>
          <button onClick={() => onGoto('devices')} className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12px] font-semibold text-dash-text shadow-sm ring-1 ring-[#cfe4e0] transition hover:bg-dash-bg">
            <Cpu size={14} className="text-dash-primary" /> คลังอุปกรณ์
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard icon={Users} label="ผู้ป่วยในระบบทั้งหมด" value={patients.length} tone="blue" />
        <SummaryCard icon={UserPlus2} label="ลงทะเบียนใหม่วันนี้" value={newToday} tone="green" trend={{ value: newThisMonth, positive: true, suffix: '', label: 'คนเดือนนี้' }} />
        <SummaryCard icon={CalendarClock} label="นัดหมายวันนี้" value={todayAppts.length} tone="cyan" />
        <SummaryCard icon={ClipboardList} label="รอดำเนินการลงทะเบียน" value={pendingRegistrations} tone="orange" />
        <SummaryCard icon={HardDrive} label="อุปกรณ์ส่งซ่อม" value={maintenanceDevices} tone="red" />
        <SummaryCard icon={Wifi} label="อุปกรณ์เชื่อมต่อออนไลน์" value={connectedDevices} unit={`/ ${devices.length}`} tone="purple" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-dash-text">สถานะฝูงอุปกรณ์ IoT ทั้งระบบ</h2>
            <span className="text-[11px] text-dash-text-soft">รวม {devices.length} อุปกรณ์</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-dash-bg">
            <div className="h-full bg-dash-primary" style={{ width: `${(availableDevices / fleetTotal) * 100}%` }} title="พร้อมใช้งาน" />
            <div className="h-full bg-dash-cyan" style={{ width: `${(inUseDevices / fleetTotal) * 100}%` }} title="กำลังใช้งาน" />
            <div className="h-full bg-[#f0596c]" style={{ width: `${(maintenanceDevices / fleetTotal) * 100}%` }} title="ส่งซ่อม" />
          </div>
          <div className="mono mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-dash-text-soft">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-dash-primary" /> พร้อมใช้ ({availableDevices})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-dash-cyan" /> ใช้งานอยู่ ({inUseDevices})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f0596c]" /> ซ่อม/เช็ค ({maintenanceDevices})</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-dash-text">สัดส่วนระยะอาการผู้ป่วยในระบบ</h2>
            <span className="text-[11px] text-dash-text-soft">มีข้อมูลระยะ {stageCounts.FLACCID + stageCounts.SPASTIC + stageCounts.RECOVERY} ราย</span>
          </div>
          <div className="space-y-2.5">
            {(['FLACCID', 'SPASTIC', 'RECOVERY'] as DiseaseStage[]).map(stage => (
              <div key={stage}>
                <div className="mb-1 flex items-center justify-between text-[11.5px]">
                  <span className="font-medium text-dash-text">{STAGE_LABEL[stage]}</span>
                  <span className={`mono font-bold ${STAGE_TEXT_TONE[stage]}`}>{stageCounts[stage]} ราย</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-dash-bg">
                  <div className={`h-full rounded-full ${STAGE_BAR_TONE[stage]}`} style={{ width: `${(stageCounts[stage] / stagedTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#cfe4e0] bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-dash-primary" />
            <h2 className="text-[14px] font-bold text-dash-text">อุปกรณ์ที่ควรตรวจสอบ</h2>
          </div>
          <button onClick={() => onGoto('devices')} className="flex items-center gap-0.5 text-[11.5px] font-semibold text-dash-primary hover:underline">
            ไปที่คลังอุปกรณ์ <ChevronRight size={13} />
          </button>
        </div>
        {attentionDevices.length === 0 ? (
          <p className="text-[12px] text-dash-text-soft">ทุกอุปกรณ์เชื่อมต่อและอยู่ในเกณฑ์ปกติ</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {attentionDevices.map(d => <DeviceStatusCard key={d.device_id} device={d} />)}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-dash-text">ผู้ป่วยลงทะเบียนใหม่รายเดือน</h2>
            <button onClick={() => onGoto('queue')} className="text-[11.5px] font-semibold text-dash-primary hover:underline">ดูทะเบียนผู้ป่วยทั้งหมด →</button>
          </div>
          <LineChart data={chartMonths} color="#72D6A3" />
        </div>

        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
          <h2 className="mb-3 text-[14px] font-bold text-dash-text">นัดหมายวันนี้</h2>
          <div className="space-y-2">
            {todayAppts.length === 0 && <p className="text-[12px] text-dash-text-soft">วันนี้ยังไม่มีนัดหมาย</p>}
            {todayAppts.slice(0, 6).map(a => (
              <div key={a.appointment_id} className="rounded-xl bg-dash-bg px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold text-dash-text">{a.patient_name} {a.patient_lastname}</div>
                    <div className="mono text-[10.5px] text-dash-text-soft">{new Date(a.appointment_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} · กภ.{a.therapist_name ?? '—'}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${APPT_STATUS_TONE[a.status] ?? 'bg-dash-bg text-dash-text-soft'}`}>
                    {APPT_STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>
                {a.device_id && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-dash-text-soft">
                    <Cpu size={11} className="text-dash-primary" />
                    {a.device_id}
                    {a.device_status && <span className="font-medium">· {DEVICE_STATUS_LABEL[a.device_status] ?? a.device_status}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => onGoto('schedule')} className="mt-3 w-full rounded-xl border border-[#cfe4e0] py-2 text-[12px] font-semibold text-dash-primary hover:bg-dash-primary-light">
            ดูตารางนัดหมายรวม
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <AppointmentCalendar events={calendarEvents} />

        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
          <h2 className="mb-3 text-[14px] font-bold text-dash-text">แยกตามผู้ดูแลเคส</h2>
          <div className="space-y-2">
            {therapists.length === 0 && <p className="text-[12px] text-dash-text-soft">ยังไม่มีนักกิจกรรมบำบัดในระบบ</p>}
            {therapists.map(t => (
              <div key={t.ot_id} className="rounded-xl bg-dash-bg px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dash-primary-light text-[10.5px] font-bold text-dash-primary">
                    {initialsOf(t.first_name, t.last_name)}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-dash-text">กภ. {t.first_name} {t.last_name}</span>
                  <span className="mono shrink-0 text-[12px] font-semibold text-dash-primary">{t.cases ?? 0} เคส</span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-dash-primary" style={{ width: `${((t.cases ?? 0) / maxCases) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onGoto('therapists')} className="mt-3 w-full rounded-xl border border-[#cfe4e0] py-2 text-[12px] font-semibold text-dash-primary hover:bg-dash-primary-light">
            จัดการนักกายภาพ
          </button>
        </div>
      </div>
    </>
  )
}
