import { CheckIcon } from './Icons'
const labels = ['รับเรื่อง', 'ลงทะเบียน', 'นัดหมาย', 'จับคู่อุปกรณ์']
export default function Stepper({ current }: { current: number }) {
  return <div className="stepper">
    {labels.map((label, i) => {
      const n = i + 1
      const state = n < current ? 'done' : n === current ? 'current' : 'pending'
      return <div className={`step ${state}`} key={label}>
        <div className="step-node">{state === 'done' ? <CheckIcon/> : n}</div>
        <span>{label}</span>
        {i < labels.length - 1 && <div className="step-line"/>}
      </div>
    })}
  </div>
}
