import { appointment, device, therapist, records } from '../data/mockData'

export default function RightPanel(): JSX.Element {
  return (
    <aside className="right-panel">
      <div className="right-section">
        <div className="eyebrow">next appointment</div>
        <h3>📅 นัดหมายครั้งถัดไป</h3>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div><span style={{ fontSize: 11, color: 'var(--dim)' }}>วันที่</span><br />{appointment.date}</div>
          <div style={{ marginTop: 8 }}><span style={{ fontSize: 11, color: 'var(--dim)' }}>เวลา</span><br /><span style={{ color: 'var(--cyan)' }}>{appointment.time}</span></div>
          <div style={{ marginTop: 8 }}><span style={{ fontSize: 11, color: 'var(--dim)' }}>สถานที่</span><br />{appointment.location}</div>
        </div>
      </div>
      <div className="right-section">
        <div className="eyebrow">iot device</div>
        <h3>🔧 สถานะอุปกรณ์</h3>
        <div className="device-status">
          <div className={`device-dot ${device.online ? 'online' : 'offline'}`} />
          <div>
            <div className="device-name">{device.name}</div>
            <div className="device-sub">เชื่อมต่อผ่าน WiFi · {device.lastSync}</div>
          </div>
        </div>
        <div className="spec-row" style={{ marginTop: 12 }}><span>แบตเตอรี่</span><span style={{ color: 'var(--lime)' }}>{device.battery}%</span></div>
        <div className="battery-bar"><div className="battery-fill" style={{ width: `${device.battery}%` }} /></div>
        <div style={{ marginTop: 16 }}>
          <div className="spec-row"><span>Firmware</span><span>{device.firmware}</span></div>
          <div className="spec-row"><span>Signal</span><span style={{ color: 'var(--lime)' }}>{device.signal}</span></div>
          <div className="spec-row"><span>Sensors</span><span style={{ color: 'var(--lime)' }}>{device.sensors}</span></div>
        </div>
      </div>
      <div className="right-section">
        <div className="eyebrow">assigned therapist</div>
        <h3>👨‍⚕️ นักกายภาพบำบัด</h3>
        <div className="therapist-card">
          <div className="therapist-avatar">{therapist.initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{therapist.name}</div>
            <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: '"IBM Plex Mono", monospace' }}>{therapist.role}</div>
          </div>
        </div>
      </div>
      <div className="right-section" style={{ background: '#101a24' }}>
        <div className="eyebrow">personal records</div>
        <h3>🏆 สถิติส่วนตัว</h3>
        <div style={{ fontSize: 12, lineHeight: 2, color: '#b9c8d4' }}>
          {records.map((r, i) => (
            <div key={i} className="spec-row"><span>{r.label}</span><span style={{ color: r.color, fontWeight: 500 }}>{r.value}</span></div>
          ))}
        </div>
      </div>
    </aside>
  )
}
