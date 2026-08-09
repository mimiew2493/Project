import { useEffect, useState } from 'react'
import type { Device } from '../../types'
import SearchBar from '../../components/SearchBar'

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'ใช้งานได้', MAINTENANCE: 'ส่งซ่อม' }
const STATUS_PILL: Record<string, string> = { ACTIVE: 'pill-green', MAINTENANCE: 'pill-amber' }

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'holding', label: 'มีผู้ถือครอง' },
  { key: 'available', label: 'พร้อมจ่าย' },
  { key: 'MAINTENANCE', label: 'ส่งซ่อม' },
] as const

interface FormData { deviceName: string; serialNumber: string; status: string }
const emptyForm: FormData = { deviceName: '', serialNumber: '', status: 'ACTIVE' }

const Field = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div className="field"><label className="field-label">{label} {req && <span className="req">*</span>}</label>{children}</div>
)

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { dateStyle: 'medium' })

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Device | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = () => {
    fetch('http://localhost:3000/api/devices')
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setDevices(d); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const openAddForm = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const startEdit = (d: Device) => {
    setEditing(d)
    setForm({ deviceName: d.device_name, serialNumber: d.serial_number, status: d.status })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm) }

  const ch = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const save = async () => {
    if (!form.deviceName || !form.serialNumber) { alert('กรุณากรอกชื่ออุปกรณ์และหมายเลขซีเรียล'); return }
    setSaving(true)
    const res = editing
      ? await fetch('http://localhost:3000/api/devices', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: editing.device_id, ...form }),
        }).catch(() => null)
      : await fetch('http://localhost:3000/api/devices', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        }).catch(() => null)
    if (res?.ok) { showToast(editing ? 'แก้ไขอุปกรณ์สำเร็จ!' : 'เพิ่มอุปกรณ์สำเร็จ!'); closeForm(); load() }
    else alert('เกิดข้อผิดพลาด')
    setSaving(false)
  }

  const removeDevice = async (d: Device) => {
    if (!confirm(`ยืนยันลบอุปกรณ์ ${d.device_id} (${d.device_name})? การลบไม่สามารถย้อนกลับได้`)) return
    const res = await fetch(`http://localhost:3000/api/devices?device_id=${d.device_id}`, { method: 'DELETE' }).catch(() => null)
    if (res?.ok) { showToast('ลบอุปกรณ์สำเร็จ'); load() }
    else alert('ลบไม่สำเร็จ — อาจมีข้อมูลการใช้งานของอุปกรณ์นี้อยู่ในระบบ')
  }

  const filtered = devices
    .filter(d => {
      if (filter === 'all') return true
      if (filter === 'holding') return !!d.holder_name
      if (filter === 'available') return d.status === 'ACTIVE' && !d.holder_name
      return d.status === filter
    })
    .filter(d => (d.device_id + d.device_name + d.serial_number + (d.holder_name ?? '')).toLowerCase().includes(search.toLowerCase()))

  const total = devices.length
  const available = devices.filter(d => d.status === 'ACTIVE' && !d.holder_name).length
  const maintenance = devices.filter(d => d.status === 'MAINTENANCE').length

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  return (
    <>
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="h-sec">
        <div><h1 className="page-title">คลังอุปกรณ์ IoT</h1><p className="page-sub">อุปกรณ์เป็นทรัพย์สินของศูนย์ที่ต้องยืม–คืน–ซ่อม ต้องรู้ว่าเครื่องไหนอยู่กับใคร</p></div>
        <button className="btn btn-sm" onClick={() => (showForm ? closeForm() : openAddForm())}>{showForm ? '✕ ปิดฟอร์ม' : '+ เพิ่มอุปกรณ์'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ borderColor: 'var(--blue)' }}>
          <div className="h-sec"><span className="h-sec-title">{editing ? `แก้ไขอุปกรณ์ · ${editing.device_id}` : 'เพิ่มอุปกรณ์ใหม่'}</span></div>
          <div className="grid2">
            <Field label="ชื่ออุปกรณ์" req><input className="inp" name="deviceName" value={form.deviceName} onChange={ch} placeholder="เช่น IMU Sensor Kit" /></Field>
            <Field label="หมายเลขซีเรียล" req><input className="inp mono" name="serialNumber" value={form.serialNumber} onChange={ch} placeholder="SN-XXXXXXXX" /></Field>
            <Field label="สถานะ">
              <select className="inp" name="status" value={form.status} onChange={ch}>
                <option value="ACTIVE">ใช้งานได้</option>
                <option value="MAINTENANCE">ส่งซ่อม</option>
              </select>
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={closeForm}>ยกเลิก</button>
            <button className="btn btn-sm" onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </div>
      )}

      <div className="grid3">
        <div className="card"><div className="eyebrow">ทั้งหมด</div><div className="big">{total}<span className="big-unit">เครื่อง</span></div></div>
        <div className="card" style={{ background: 'var(--blue-t)', borderColor: '#d5e2f7' }}><div className="eyebrow" style={{ color: 'var(--blue)' }}>พร้อมจ่าย</div><div className="big" style={{ color: 'var(--blue)' }}>{available}<span className="big-unit">เครื่อง</span></div></div>
        <div className="card" style={{ background: 'var(--amber-t)', borderColor: '#f0dfc0' }}><div className="eyebrow" style={{ color: 'var(--amber)' }}>ส่งซ่อม</div><div className="big" style={{ color: 'var(--amber)' }}>{maintenance}<span className="big-unit">เครื่อง</span></div></div>
      </div>

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="ค้นหารหัสอุปกรณ์, ชื่อผู้ถือครอง..." />
        <div className="filter-pills">
          {FILTERS.map(f => <button key={f.key} className={`filter-pill ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>)}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => alert('Export Excel...')}>↓ Export</button>
      </div>

      <div className="card-0">
        <table className="data-table">
          <thead><tr><th>รหัสอุปกรณ์</th><th>ชื่ออุปกรณ์</th><th>ผู้ถือครอง</th><th>วันที่จ่าย</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>ไม่พบข้อมูล</td></tr>
              : filtered.map(d => (
                  <tr key={d.device_id}>
                    <td className="mono"><b>{d.device_id}</b></td>
                    <td>{d.device_name}</td>
                    <td>{d.holder_name || '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>{d.issued_date ? fmtDate(d.issued_date) : '—'}</td>
                    <td><span className={`pill ${STATUS_PILL[d.status] ?? ''}`}>{STATUS_LABEL[d.status] ?? d.status}</span></td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(d)}>แก้ไข</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeDevice(d)}>ลบ</button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </>
  )
}
