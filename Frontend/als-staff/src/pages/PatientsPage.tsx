import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'

export default function PatientsPage({ onRegister }: { onRegister: () => void }) {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ padding: 40 }}>กำลังโหลด...</p>

  return <>
    <PageHeader
      title="รายชื่อผู้ป่วยในระบบ"
      subtitle="ตรวจสอบรายชื่อผู้ป่วย"
      action={<button className="btn primary" onClick={onRegister}>+ รับผู้ป่วยใหม่</button>}
    />
    <div className="patient-list">
      {patients.length === 0 && <p style={{ padding: 20, color: '#888' }}>ยังไม่มีผู้ป่วยในระบบ</p>}
      {patients.map((p, index) => (
        <article className="patient-card" key={p.patient_id}>
          <div className="patient-top">
            <div className="patient-identity">
              <div className="initial">{index + 1}</div>
              <div>
                <h3>{p.patient_id}</h3>
                <p>อาการ: {p.medical_condition || '—'} · น้ำหนัก: {p.weight || '—'} kg · ลงทะเบียน: {p.register_date}</p>
              </div>
            </div>
            <div className="patient-actions">
              <button className="btn small primary" onClick={onRegister}>ดำเนินการต่อ</button>
            </div>
          </div>
          <Stepper current={2}/>
        </article>
      ))}
    </div>
  </>
}