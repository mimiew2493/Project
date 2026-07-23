import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import { patients } from '../data/mockData'

export default function PatientsPage({ onRegister }: { onRegister: () => void }) {
  return <>
    <PageHeader title="คิวรับผู้ป่วยเข้าระบบ" subtitle="ตรวจสอบสถานะการรับเรื่องและดำเนินการลงทะเบียนผู้ป่วยใหม่" action={<button className="btn primary" onClick={onRegister}>+ รับผู้ป่วยใหม่</button>} />
    <div className="patient-list">
      {patients.map((p, index) => <article className="patient-card" key={p.hn}>
        <div className="patient-top">
          <div className="patient-identity"><div className="initial">{index + 1}</div><div><h3>{p.name}</h3><p>{p.hn} · {p.phone} · รับเรื่องเมื่อ {p.created}</p></div></div>
          <div className="patient-actions"><span className="progress-pill">ขั้นที่ {p.step}/{p.total}</span><button className="btn small primary" onClick={onRegister}>ดำเนินการต่อ</button></div>
        </div>
        <Stepper current={p.step}/>
      </article>)}
    </div>
    <div className="notice"><strong>คำแนะนำ:</strong> คิวที่มีสถานะค้างควรได้รับการตรวจสอบข้อมูลและดำเนินการต่อให้ครบตามขั้นตอน</div>
  </>
}
