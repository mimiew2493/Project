import PageHeader from '../components/PageHeader'
import { devices } from '../data/mockData'
export default function DevicesPage() { return <>
  <PageHeader title="คลังอุปกรณ์ IoT" subtitle="ติดตามจำนวนอุปกรณ์ สถานะการเชื่อมต่อ และการจับคู่กับผู้ป่วย" action={<button className="btn primary">+ เพิ่มอุปกรณ์</button>}/>
  <div className="stats-row"><div className="stat"><span>ทั้งหมด</span><strong>12</strong><small>เครื่อง</small></div><div className="stat blue"><span>พร้อมใช้งาน</span><strong>3</strong><small>เครื่อง</small></div><div className="stat red"><span>ผิดปกติ / ส่งซ่อม</span><strong>2</strong><small>เครื่อง</small></div></div>
  <section className="panel table-panel"><table><thead><tr><th>รหัสอุปกรณ์</th><th>ผู้ถือครอง</th><th>วันที่ล่าสุด</th><th>แบตเตอรี่</th><th>สถานะ</th><th></th></tr></thead><tbody>{devices.map(d => <tr key={d.id}><td><strong>{d.id}</strong></td><td>{d.user}</td><td>{d.lastSeen}</td><td>{d.battery}</td><td><span className={`status ${d.tone}`}>{d.status}</span></td><td><button className="btn tiny">จัดการ</button></td></tr>)}</tbody></table></section>
</> }
