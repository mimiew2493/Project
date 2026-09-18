import { useEffect, useState } from 'react'
import type { Program, DiseaseStage, AuthUser } from '../../types'
import TopHeader from '../../components/dashboard/TopHeader'
import { ClipboardListIcon } from '../../components/Icon'
import { Activity, Zap, TrendingUp, type LucideIcon } from 'lucide-react'
import { API_BASE } from '../../config'

const STAGE_ICON: Record<DiseaseStage, LucideIcon> = { FLACCID: Activity, SPASTIC: Zap, RECOVERY: TrendingUp }
const STAGE_TILE: Record<DiseaseStage, string> = {
  FLACCID: 'bg-gradient-to-br from-[#ff8fa3] to-[#f0596c]',
  SPASTIC: 'bg-gradient-to-br from-[#ffc978] to-[#e69a3e]',
  RECOVERY: 'bg-gradient-to-br from-dash-green to-[#3fae7d]',
}

interface Props { user: AuthUser; usersId: string; roleId: string }

export const STAGE_LABEL: Record<DiseaseStage, string> = {
  FLACCID: 'ระยะแรก',
  SPASTIC: 'ระยะเกร็ง',
  RECOVERY: 'ระยะฟื้นตัว',
}

export const STAGE_PILL: Record<DiseaseStage, string> = {
  FLACCID: 'pill-rose',
  SPASTIC: 'pill-amber',
  RECOVERY: 'pill-green',
}

const STAGE_FILTERS: { key: DiseaseStage | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'ทุกระยะ' },
  { key: 'FLACCID', label: STAGE_LABEL.FLACCID },
  { key: 'SPASTIC', label: STAGE_LABEL.SPASTIC },
  { key: 'RECOVERY', label: STAGE_LABEL.RECOVERY },
]

const emptyForm = { programName: '', description: '', targetStage: '' as DiseaseStage | '', repeatCount: '3', sessionPerDay: '1', durationMin: '20', isSystem: false }

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="field"><label className="field-label">{label}</label>{children}</div>
)

export default function ProgramLibraryPage({ user, usersId, roleId }: Props) {
  const canCreate = roleId === 'R002'
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState<DiseaseStage | 'ALL'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch(`${API_BASE}/api/programs?created_by=${usersId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPrograms(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [usersId])

  const ch = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  const openCreateForm = () => { setEditingId(null); setForm(emptyForm); setShowForm(true) }
  const startEdit = (p: Program) => {
    setEditingId(p.program_id)
    setForm({
      programName: p.program_name, description: p.description ?? '',
      targetStage: (p.target_stage ?? '') as DiseaseStage | '',
      repeatCount: String(p.repeat_count), sessionPerDay: String(p.session_per_day),
      durationMin: String(Math.round(p.duration_sec / 60)), isSystem: p.program_type === 'SYSTEM',
    })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  const saveProgram = async () => {
    if (!form.programName) { alert('กรุณาระบุชื่อโปรแกรม'); return }
    if (!form.targetStage) { alert('กรุณาเลือกระยะอาการของโปรแกรม'); return }
    setSaving(true)
    const res = editingId
      ? await fetch(`${API_BASE}/api/programs`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programId: editingId, usersId, programName: form.programName, description: form.description,
            targetStage: form.targetStage, repeatCount: form.repeatCount, sessionPerDay: form.sessionPerDay,
            durationMin: form.durationMin,
          }),
        }).catch(() => null)
      : await fetch(`${API_BASE}/api/programs`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usersId, programName: form.programName, description: form.description,
            targetStage: form.targetStage || undefined,
            repeatCount: form.repeatCount, sessionPerDay: form.sessionPerDay, durationMin: form.durationMin,
            programType: form.isSystem ? 'SYSTEM' : 'CUSTOM',
          }),
        }).catch(() => null)
    if (res?.ok) { closeForm(); load() }
    else { const data = await res?.json().catch(() => null); alert(data?.error ?? (editingId ? 'แก้ไขโปรแกรมไม่สำเร็จ' : 'สร้างโปรแกรมไม่สำเร็จ')) }
    setSaving(false)
  }

  const toggleStatus = async (p: Program) => {
    setBusyId(p.program_id)
    const nextStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const res = await fetch(`${API_BASE}/api/programs`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId: p.program_id, usersId, status: nextStatus }),
    }).catch(() => null)
    if (res?.ok) load()
    else alert('แก้ไขไม่สำเร็จ')
    setBusyId(null)
  }

  const removeProgram = async (p: Program) => {
    if (!confirm(`ยืนยันลบโปรแกรม "${p.program_name}"? การลบไม่สามารถย้อนกลับได้`)) return
    setBusyId(p.program_id)
    const res = await fetch(`${API_BASE}/api/programs?program_id=${p.program_id}&users_id=${usersId}`, { method: 'DELETE' }).catch(() => null)
    if (res?.ok) load()
    else { const data = await res?.json().catch(() => null); alert(data?.error ?? 'ลบไม่สำเร็จ') }
    setBusyId(null)
  }

  const filtered = programs.filter(p => stageFilter === 'ALL' || p.target_stage === stageFilter)

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  return (
    <>
      <TopHeader
        title="คลังโปรแกรมฝึก"
        breadcrumb={['หน้าแรก', 'คลังโปรแกรมฝึก']}
        user={user}
        action={canCreate ? { label: showForm ? 'ยกเลิก' : 'สร้างโปรแกรมใหม่', onClick: () => (showForm ? closeForm() : openCreateForm()) } : undefined}
      />
      <p className="page-sub" style={{ marginTop: -10 }}>โปรแกรมของคุณและโปรแกรมกลาง จัดกลุ่มตามระยะอาการของโรคเพื่อเลือกให้เหมาะกับผู้ป่วยแต่ละคน</p>

      {!canCreate && (
        <div className="note" style={{ marginBottom: 14 }}>การสร้าง แก้ไข และลบโปรแกรมเป็นสิทธิของนักกิจกรรมบำบัดเท่านั้น — หน้านี้แสดงเพื่อดูโปรแกรมที่มีอยู่สำหรับใช้ตอนลงทะเบียนผู้ป่วย</div>
      )}

      {canCreate && showForm && (
        <div className="card" style={{ borderColor: 'var(--blue)' }}>
          <div className="h-sec"><span className="h-sec-title">{editingId ? `แก้ไขโปรแกรม · ${editingId}` : 'สร้างโปรแกรมใหม่'}</span></div>
          <div className="field"><label className="field-label">ชื่อโปรแกรม</label>
            <input className="inp" name="programName" value={form.programName} onChange={ch} placeholder="เช่น โปรแกรมฟื้นฟูแขนระยะแรก" />
          </div>
          <div className="field"><label className="field-label">รายละเอียด</label>
            <textarea className="inp" name="description" rows={2} value={form.description} onChange={ch} />
          </div>
          <div className="grid2">
            <Field label="ระยะอาการที่เหมาะสม">
              <select className="inp" name="targetStage" value={form.targetStage} onChange={ch}>
                <option value="">-- เลือกระยะ --</option>
                <option value="FLACCID">{STAGE_LABEL.FLACCID}</option>
                <option value="SPASTIC">{STAGE_LABEL.SPASTIC}</option>
                <option value="RECOVERY">{STAGE_LABEL.RECOVERY}</option>
              </select>
            </Field>
            {!editingId && (
              <Field label="ขอบเขตการใช้งาน">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, height: 38 }}>
                  <input type="checkbox" checked={form.isSystem} onChange={e => setForm(p => ({ ...p, isSystem: e.target.checked }))} />
                  โปรแกรมกลาง — ใช้ได้กับนักกายภาพทุกคน
                </label>
              </Field>
            )}
          </div>
          <div className="grid3">
            <Field label="ครั้ง/เซต"><input className="inp" name="repeatCount" type="number" min="1" value={form.repeatCount} onChange={ch} /></Field>
            <Field label="เซต/วัน"><input className="inp" name="sessionPerDay" type="number" min="1" value={form.sessionPerDay} onChange={ch} /></Field>
            <Field label="นาที/ครั้ง"><input className="inp" name="durationMin" type="number" min="1" value={form.durationMin} onChange={ch} /></Field>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>ยกเลิก</button>
            <button className="btn btn-sm" onClick={saveProgram} disabled={saving}>{saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'สร้างโปรแกรม'}</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {STAGE_FILTERS.map(f => (
          <button key={f.key} className={`filter-pill ${stageFilter === f.key ? 'active' : ''}`} onClick={() => setStageFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      <div className="result-count">พบ {filtered.length} โปรแกรม</div>

      {filtered.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon"><ClipboardListIcon size={48} /></div>
          <div className="empty-title">ยังไม่มีโปรแกรมในหมวดนี้</div>
          <div className="empty-sub">กด "+ สร้างโปรแกรมใหม่" ด้านบนเพื่อเริ่มสร้างโปรแกรมสำหรับระยะอาการนี้</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => {
            const StageIcon = p.target_stage ? STAGE_ICON[p.target_stage] : ClipboardListIcon
            const tileBg = p.target_stage ? STAGE_TILE[p.target_stage] : 'bg-gradient-to-br from-dash-primary to-dash-cyan'
            return (
              <div key={p.program_id} className="card" style={{ marginBottom: 0 }}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${tileBg}`}>
                    <StageIcon size={20} />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {p.program_type === 'SYSTEM' && <span className="pill">โปรแกรมกลาง</span>}
                    {p.status === 'INACTIVE' && <span className="pill pill-rose">ปิดใช้งาน</span>}
                  </div>
                </div>
                <div className="mt-3 text-[13.5px] font-bold text-dash-text">{p.program_name}</div>
                <div className="mt-1">
                  {p.target_stage ? (
                    <span className={`pill ${STAGE_PILL[p.target_stage]}`}>{STAGE_LABEL[p.target_stage]}</span>
                  ) : (
                    <span className="pill pill-blue">ทุกระยะ</span>
                  )}
                </div>
                <div className="patient-meta mt-2">
                  {p.repeat_count} ครั้ง/เซต · {p.session_per_day} เซต/วัน · {Math.round(p.duration_sec / 60)} นาที/ครั้ง
                </div>
                {p.description && <div className="patient-meta mt-1">{p.description}</div>}
                {p.created_by === usersId && (
                  <div className="patient-actions mt-3" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" disabled={busyId === p.program_id} onClick={() => startEdit(p)}>แก้ไข</button>
                    <button className="btn btn-ghost btn-sm" disabled={busyId === p.program_id} onClick={() => toggleStatus(p)}>
                      {p.status === 'ACTIVE' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </button>
                    <button className="btn btn-ghost btn-sm" disabled={busyId === p.program_id} onClick={() => removeProgram(p)}>ลบ</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
