import { Wifi, WifiOff, BatteryFull, BatteryLow, BatteryWarning, Gauge, Compass } from 'lucide-react'
import type { Device } from '../../types'

const okBadge = 'bg-[#eafaf2] text-[#3fae7d]'
const warnBadge = 'bg-[#fff5e9] text-[#e69a3e]'
const errBadge = 'bg-[#ffeff1] text-[#f0596c]'

function StatusPill({ ok, warn, children }: { ok: boolean; warn?: boolean; children: React.ReactNode }) {
  const cls = ok ? okBadge : warn ? warnBadge : errBadge
  return <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${cls}`}>{children}</span>
}

export default function DeviceStatusCard({ device }: { device: Device }) {
  const connected = device.connection_status === 'CONNECTED'
  const battery = device.battery_level
  const imuOk = device.imu_status === 'OK'
  const imuWarn = device.imu_status === 'WARNING'
  const encOk = device.encoder_status === 'OK'
  const encWarn = device.encoder_status === 'WARNING'

  const BatteryIcon = battery == null ? BatteryWarning : battery < 20 ? BatteryLow : BatteryFull

  return (
    <div className="rounded-2xl border border-[#cfe4e0] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12.5px] font-bold text-dash-text">{device.device_name}</div>
          <div className="text-[10.5px] text-dash-text-soft">{device.device_id}</div>
        </div>
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${connected ? okBadge : errBadge}`}>
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-dash-bg p-2.5">
          <BatteryIcon size={15} className={`mx-auto ${battery == null ? 'text-dash-text-soft' : battery < 20 ? 'text-[#f0596c]' : 'text-[#3fae7d]'}`} />
          <div className="mt-1 text-[11px] font-semibold text-dash-text">{battery != null ? `${battery}%` : '—'}</div>
          <div className="text-[9.5px] text-dash-text-soft">แบตเตอรี่</div>
        </div>
        <div className="rounded-xl bg-dash-bg p-2.5">
          <Compass size={15} className={`mx-auto ${imuOk ? 'text-[#3fae7d]' : imuWarn ? 'text-[#e69a3e]' : 'text-[#f0596c]'}`} />
          <div className="mt-1"><StatusPill ok={imuOk} warn={imuWarn}>{device.imu_status ?? 'UNKNOWN'}</StatusPill></div>
          <div className="mt-1 text-[9.5px] text-dash-text-soft">IMU</div>
        </div>
        <div className="rounded-xl bg-dash-bg p-2.5">
          <Gauge size={15} className={`mx-auto ${encOk ? 'text-[#3fae7d]' : encWarn ? 'text-[#e69a3e]' : 'text-[#f0596c]'}`} />
          <div className="mt-1"><StatusPill ok={encOk} warn={encWarn}>{device.encoder_status ?? 'UNKNOWN'}</StatusPill></div>
          <div className="mt-1 text-[9.5px] text-dash-text-soft">Encoder</div>
        </div>
      </div>

      {device.holder_name && (
        <div className="mt-3 truncate text-[11px] text-dash-text-soft">ผู้ถือครอง: <span className="font-medium text-dash-text">{device.holder_name}</span></div>
      )}
    </div>
  )
}
