import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'

const Field = ({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) => <label className="field"><span>{label}{required && <b>*</b>}</span>{children}</label>
export default function RegisterPage() {
  return <>
    <PageHeader eyebrow="ผู้ป่วย · ลงทะเบียนใหม่" title="ลงทะเบียนผู้ป่วยใหม่" />
    <Stepper current={2}/>
    <div className="register-grid">
      <section className="panel form-panel">
        <h2>ข้อมูลส่วนตัว</h2>
        <div className="form-grid">
          <Field label="ชื่อ" required><input placeholder="ระบุชื่อ"/></Field>
          <Field label="นามสกุล" required><input placeholder="ระบุนามสกุล"/></Field>
          <Field label="วัน/เดือน/ปีเกิด" required><input type="date"/></Field>
          <Field label="เพศ" required><select><option>เลือก...</option><option>ชาย</option><option>หญิง</option><option>ไม่ระบุ</option></select></Field>
          <Field label="ที่อยู่ปัจจุบัน" required><textarea placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด"/></Field>
          <Field label="เบอร์ติดต่อ" required><input placeholder="08X-XXX-XXXX"/></Field>
          <Field label="ผู้ดูแล / ผู้ประสาน" required><input placeholder="ชื่อ–นามสกุล"/></Field>
        </div>
      </section>
      <aside className="register-side">
        <section className="panel"><h2>มอบหมายผู้ดูแลเคส</h2><Field label="นักกายภาพบำบัด" required><select><option>กภ. วิน รักษา — ดูแล 4 เคส</option></select></Field><Field label="บันทึกเพิ่มเติม"><input placeholder="ข้อความหมายเหตุ"/></Field></section>
        <section className="panel"><h2>จับคู่อุปกรณ์</h2><Field label="เลือกอุปกรณ์" required><select><option>DEV-0155 — พร้อมใช้งาน</option></select></Field><div className="device-status"><span>สถานะอุปกรณ์</span><b>พร้อมใช้งาน</b></div><div className="device-status"><span>ส่งรหัสผ่านทาง</span><b>SMS</b></div></section>
        <div className="privacy">PDPA — ข้อมูลสุขภาพเป็นข้อมูลส่วนบุคคล โปรดตรวจสอบความถูกต้องและใช้เท่าที่จำเป็น</div>
        <div className="action-row"><button className="btn">ยกเลิก</button><button className="btn primary">บันทึกและส่งต่อ</button></div>
      </aside>
    </div>
  </>
}
