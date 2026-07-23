import { useState } from 'react'
import { patient } from '../data/mockData'

export default function SettingsPage(): JSX.Element {
  const [notif, setNotif] = useState(true)
  const [remind, setRemind] = useState(true)
  const Toggle = ({on,onClick}:{on:boolean;onClick:()=>void}) => (
    <div onClick={onClick} style={{width:44,height:24,borderRadius:12,cursor:'pointer',background:on?'var(--cyan)':'var(--surface)',border:`1px solid ${on?'var(--cyan)':'var(--line)'}`,position:'relative',transition:'.2s'}}>
      <div style={{width:18,height:18,borderRadius:'50%',background:'var(--paper)',position:'absolute',top:2,left:on?22:2,transition:'.2s'}}/>
    </div>
  )
  return (
    <>
      <div className="topbar"><div className="topbar-greeting">โ๏ธ เธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ</div><div className="topbar-sub">เธเธฑเธ”เธเธฒเธฃเธเนเธญเธกเธนเธฅเธชเนเธงเธเธ•เธฑเธง</div></div>
      <div className="content">
        <div className="card"><div className="eyebrow">profile</div><h3>เธเนเธญเธกเธนเธฅเธชเนเธงเธเธ•เธฑเธง</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,fontSize:13}}>
            <div><span style={{fontSize:11,color:'var(--dim)'}}>เธเธทเนเธญ</span><br/>{patient.fullName}</div>
            <div><span style={{fontSize:11,color:'var(--dim)'}}>เธญเธฒเธขเธธ</span><br/>{patient.age} เธเธต</div>
            <div><span style={{fontSize:11,color:'var(--dim)'}}>เธฃเธซเธฑเธช</span><br/><span style={{fontFamily:'"IBM Plex Mono",monospace'}}>{patient.id}</span></div>
            <div><span style={{fontSize:11,color:'var(--dim)'}}>เธงเธดเธเธดเธเธเธฑเธข</span><br/>ALS - Early Stage</div>
          </div>
        </div>
        <div className="card"><div className="eyebrow">notifications</div><h3>เธเธฒเธฃเนเธเนเธเน€เธ•เธทเธญเธ</h3>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--line)'}}>
            <div><div style={{fontSize:13,fontWeight:500}}>Feedback notifications</div><div style={{fontSize:11,color:'var(--dim)'}}>เนเธเนเธเน€เธ•เธทเธญเธเน€เธกเธทเนเธญเธซเธกเธญเธชเนเธเธเธงเธฒเธกเธเธดเธ”เน€เธซเนเธ</div></div>
            <Toggle on={notif} onClick={()=>setNotif(!notif)}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0'}}>
            <div><div style={{fontSize:13,fontWeight:500}}>Appointment reminders</div><div style={{fontSize:11,color:'var(--dim)'}}>เนเธเนเธเน€เธ•เธทเธญเธเธเนเธญเธเธเธฑเธ”เธซเธกเธฒเธข 1 เธเธฑเนเธงเนเธกเธ</div></div>
            <Toggle on={remind} onClick={()=>setRemind(!remind)}/>
          </div>
        </div>
        <button className="btn btn-stop" style={{width:'100%',marginTop:8}} onClick={()=>alert('Logout')}>เธญเธญเธเธเธฒเธเธฃเธฐเธเธ</button>
      </div>
    </>
  )
}
