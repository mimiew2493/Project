import { CheckIcon } from './Icon'

const LABELS = ['รับเรื่อง + ลงทะเบียน', 'โปรแกรมฝึก + จับคู่อุปกรณ์', 'นัดตรวจเช็คอุปกรณ์']

export default function Stepper({ current }: { current: number }) {
  return (
    <div className="stepper">
      {LABELS.map((label, i) => {
        const n = i + 1
        const cls = n < current ? 'step step-done' : n === current ? 'step step-active' : 'step'
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div className={cls}>
              <span className="step-num">{n < current ? <CheckIcon size={12} /> : n}</span>
              {label}
            </div>
            {i < LABELS.length - 1 && <div className="stepline" />}
          </div>
        )
      })}
    </div>
  )
}
