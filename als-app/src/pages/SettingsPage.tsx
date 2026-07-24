import { useState } from 'react'
import { patient } from '../data/mockData'

interface ToggleProps { on: boolean; onClick: () => void }
function Toggle({ on, onClick }: ToggleProps): JSX.Element {
  return (
    <div onClick={onClick} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: on ? 'var(--cyan)' : 'var(--surface)', border: `1px solid ${on ? 'var(--cyan)' : 'var(--line)'}`, position: 'relative', transition: '.2s' }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--paper)', position: 'absolute', top: 2, left: on ? 22 : 2, transition: '.2s' }} />
    </div>
  )
}

export default function SettingsPage(): JSX.Element {
  const [notif, setNotif] = useState(true)
  const [remind, setRemind] = useState(true)
  return (
    <>
      <div className="topbar"><div className="topbar-greeting">⚙️ การตั้งค่า</div><div className="topbar-sub">จัดการข้อมูลส่วนตัวและการตั้งค่า</div></div>
      <div className="content">
        <div className="card"><div className="eyebrow">profile</div><h3>ข้อมูลส่วนตัว</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
            <div><span style={{ fontSize: 11, color: 'var(--dim)' }}>ชื่อ</span><br />{patient.fullName}</div>
            <div><span style={{ fontSize: 11, color: 'var(--dim)' }}>อายุ</span><br />{patient.age} ปี</div>
            <div><span style={{ fontSize: 11, color: 'var(--dim)' }}>รหัสผู้ป่วย</span><br /><span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{patient.id}</span></div>
            <div><span style={{ fontSize: 11, color: 'var(--dim)' }}>การวินิจฉัย</span><br />ALS - Early Stage</div>
          </div>
        </div>
        <div className="card"><div className="eyebrow">notifications</div><h3>การแจ้งเตือน</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>Feedback notifications</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>แจ้งเตือนเมื่อหมอส่งความคิดเห็น</div></div>
            <Toggle on={notif} onClick={() => setNotif(!notif)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>Appointment reminders</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>แจ้งเตือนก่อนนัดหมาย 1 ชั่วโมง</div></div>
            <Toggle on={remind} onClick={() => setRemind(!remind)} />
          </div>
        </div>
        <button className="btn btn-stop" style={{ width: '100%', marginTop: 8 }} onClick={() => alert('Logout')}>ออกจากระบบ</button>
      </div>
    </>
  )
}
