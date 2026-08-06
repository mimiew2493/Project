import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'

type Therapist = {
  ot_id: string | number
  first_name: string
  last_name: string
  license_number?: string
}

type Patient = {
  patient_id: string | number
  hn?: string
  first_name: string
  last_name: string
  phone?: string
}

const Field = ({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) => (
  <label className="field">
    <span>
      {label}
      {required && <b>*</b>}
    </span>
    {children}
  </label>
)

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    address: '',
    phone: '',
    email: '',
    caretaker: '',
    medicalCondition: '',
    weight: '',
  })

  const [saving, setSaving] = useState(false)

  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [selectedOt, setSelectedOt] = useState('')

  // ข้อมูลสำหรับค้นหาผู้ป่วย
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchingPatients, setSearchingPatients] = useState(false)
  const [showPatientResults, setShowPatientResults] = useState(false)

  const [result, setResult] = useState<{
    success: boolean
    message: string
    patientId?: string
    hn?: string
  } | null>(null)

  // ดึงรายชื่อนักกายภาพจาก Backend
  useEffect(() => {
    fetch('http://localhost:3000/api/therapists')
      .then((res) => {
        if (!res.ok) {
          throw new Error('โหลดข้อมูลนักกายภาพไม่สำเร็จ')
        }

        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTherapists(data)
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }, [])

  // ค้นหารายชื่อผู้ป่วยจาก Backend
  const handlePatientSearch = async () => {
    const keyword = patientSearch.trim()

    if (!keyword) {
      alert('กรุณากรอกชื่อ รหัสผู้ป่วย หรือ HN')
      return
    }

    setSearchingPatients(true)
    setShowPatientResults(true)
    setSearchKeyword(keyword)

    try {
      const res = await fetch('http://localhost:3000/api/patients')

      if (!res.ok) {
        throw new Error('ค้นหารายชื่อผู้ป่วยไม่สำเร็จ')
      }

      const data = await res.json()

      if (Array.isArray(data)) {
        setPatients(data)
      } else {
        setPatients([])
      }
    } catch (error) {
      console.error(error)
      setPatients([])
      alert('ไม่สามารถเชื่อมต่อ Backend ได้')
    } finally {
      setSearchingPatients(false)
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const keyword = searchKeyword.toLowerCase()

    const patientId = String(patient.patient_id ?? '').toLowerCase()
    const hn = String(patient.hn ?? '').toLowerCase()
    const firstName = String(patient.first_name ?? '').toLowerCase()
    const lastName = String(patient.last_name ?? '').toLowerCase()
    const fullName = `${firstName} ${lastName}`

    return (
      patientId.includes(keyword) ||
      hn.includes(keyword) ||
      firstName.includes(keyword) ||
      lastName.includes(keyword) ||
      fullName.includes(keyword)
    )
  })

  const handlePatientSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handlePatientSearch()
    }
  }

  const clearPatientSearch = () => {
    setPatientSearch('')
    setSearchKeyword('')
    setPatients([])
    setShowPatientResults(false)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.birthDate ||
      !form.gender ||
      !form.phone ||
      !form.address ||
      !form.caretaker
    ) {
      alert('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบ')
      return
    }

    if (!selectedOt) {
      alert('กรุณาเลือกนักกายภาพบำบัด')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          otId: selectedOt,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          message: 'ลงทะเบียนสำเร็จ',
          patientId: data.patient_id,
          hn: data.hn,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'เกิดข้อผิดพลาด',
        })
      }
    } catch {
      setResult({
        success: false,
        message: 'ไม่สามารถเชื่อมต่อ Backend ได้',
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setResult(null)

    setForm({
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: '',
      address: '',
      phone: '',
      email: '',
      caretaker: '',
      medicalCondition: '',
      weight: '',
    })

    setSelectedOt('')
  }

  if (result) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {result.success ? '✅' : '❌'}
        </div>

        <h2 style={{ marginBottom: 8 }}>{result.message}</h2>

        {result.success && (
          <div style={{ marginBottom: 20, color: '#666' }}>
            <p>
              รหัสผู้ป่วย:{' '}
              <strong
                style={{
                  color: '#0b7a5b',
                  fontSize: 18,
                }}
              >
                {result.patientId}
              </strong>
            </p>

            {result.hn && (
              <p>
                HN:{' '}
                <strong
                  style={{
                    color: '#2563eb',
                    fontSize: 18,
                  }}
                >
                  {result.hn}
                </strong>
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          className="btn primary"
          onClick={resetForm}
        >
          ลงทะเบียนคนใหม่
        </button>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="ผู้ป่วย · ลงทะเบียนใหม่"
        title="ลงทะเบียนผู้ป่วยใหม่"
      />

      <Stepper current={2} />

      {/* ส่วนค้นหารายชื่อผู้ป่วย */}
      <section
        className="panel"
        style={{
          marginBottom: 20,
        }}
      >
        <h2>ค้นหารายชื่อผู้ป่วย</h2>

        <p
          style={{
            marginTop: 0,
            marginBottom: 12,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          ตรวจสอบว่าผู้ป่วยเคยลงทะเบียนในระบบแล้วหรือไม่
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            onKeyDown={handlePatientSearchKeyDown}
            placeholder="ค้นหาชื่อ นามสกุล รหัสผู้ป่วย หรือ HN"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '11px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 14,
            }}
          />

          <button
            type="button"
            className="btn primary"
            onClick={handlePatientSearch}
            disabled={searchingPatients}
            style={{
              whiteSpace: 'nowrap',
            }}
          >
            {searchingPatients ? 'กำลังค้นหา...' : '🔍 ค้นหา'}
          </button>

          {showPatientResults && (
            <button
              type="button"
              className="btn"
              onClick={clearPatientSearch}
            >
              ล้าง
            </button>
          )}
        </div>

        {showPatientResults && !searchingPatients && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                marginBottom: 10,
                color: '#475569',
                fontSize: 14,
              }}
            >
              พบข้อมูลทั้งหมด {filteredPatients.length} รายการ
            </div>

            {filteredPatients.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                }}
              >
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.patient_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                      padding: 14,
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      background: '#f8fafc',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        {patient.first_name} {patient.last_name}
                      </strong>

                      <span
                        style={{
                          color: '#64748b',
                          fontSize: 14,
                        }}
                      >
                        รหัสผู้ป่วย: {patient.patient_id}
                        {patient.hn ? ` • HN: ${patient.hn}` : ''}
                        {patient.phone ? ` • ${patient.phone}` : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        alert(
                          `เลือกผู้ป่วย ${patient.first_name} ${patient.last_name}`,
                        )
                      }}
                    >
                      ดูข้อมูล
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 10,
                  color: '#64748b',
                }}
              >
                ไม่พบรายชื่อผู้ป่วย สามารถลงทะเบียนผู้ป่วยใหม่ด้านล่างได้
              </div>
            )}
          </div>
        )}
      </section>

      <div className="register-grid">
        <section className="panel form-panel">
          <h2>ข้อมูลส่วนตัว</h2>

          <div className="form-grid">
            <Field label="ชื่อ" required>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="ระบุชื่อ"
              />
            </Field>

            <Field label="นามสกุล" required>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="ระบุนามสกุล"
              />
            </Field>

            <Field label="วัน/เดือน/ปีเกิด" required>
              <input
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={handleChange}
              />
            </Field>

            <Field label="เพศ" required>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">เลือก...</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="ไม่ระบุ">ไม่ระบุ</option>
              </select>
            </Field>

            <Field label="ที่อยู่ปัจจุบัน" required>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด"
              />
            </Field>

            <Field label="เบอร์ติดต่อ" required>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="08X-XXX-XXXX"
              />
            </Field>

            <Field label="อีเมล">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@mail.com"
              />
            </Field>

            <Field label="น้ำหนัก (kg)">
              <input
                name="weight"
                type="number"
                step="0.01"
                value={form.weight}
                onChange={handleChange}
                placeholder="เช่น 65.50"
              />
            </Field>

            <Field label="ผู้ดูแล / ผู้ประสาน" required>
              <input
                name="caretaker"
                value={form.caretaker}
                onChange={handleChange}
                placeholder="ชื่อ–นามสกุล"
              />
            </Field>
          </div>
        </section>

        <aside className="register-side">
          <section className="panel">
            <h2>มอบหมายผู้ดูแลเคส</h2>

            <Field label="นักกายภาพบำบัด" required>
              <select
                value={selectedOt}
                onChange={(e) => setSelectedOt(e.target.value)}
              >
                <option value="">เลือกนักกายภาพ...</option>

                {therapists.map((therapist) => (
                  <option
                    key={therapist.ot_id}
                    value={therapist.ot_id}
                  >
                    กภ. {therapist.first_name}{' '}
                    {therapist.last_name}
                    {therapist.license_number
                      ? ` — ${therapist.license_number}`
                      : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="บันทึกเพิ่มเติม">
              <input
                name="medicalCondition"
                value={form.medicalCondition}
                onChange={handleChange}
                placeholder="ข้อมูลอาการหรือหมายเหตุ"
              />
            </Field>
          </section>

          <section className="panel">
            <h2>จับคู่อุปกรณ์</h2>

            <Field label="เลือกอุปกรณ์" required>
              <select defaultValue="DEV-0155">
                <option value="DEV-0155">
                  DEV-0155 — พร้อมใช้งาน
                </option>
              </select>
            </Field>

            <div className="device-status">
              <span>สถานะอุปกรณ์</span>
              <b style={{ color: '#0b7a5b' }}>
                พร้อมใช้งาน
              </b>
            </div>

            <div className="device-status">
              <span>ส่งรหัสผ่านทาง</span>
              <b style={{ color: '#2563eb' }}>SMS</b>
            </div>
          </section>

          <div className="privacy">
            PDPA — ข้อมูลสุขภาพเป็นข้อมูลส่วนบุคคล
            โปรดตรวจสอบความถูกต้องและใช้เท่าที่จำเป็น
          </div>

          <div className="action-row">
            <button
              type="button"
              className="btn"
              onClick={resetForm}
            >
              ยกเลิก
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกและส่งต่อ'}
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}