import PageHeader from '../components/PageHeader'
import { schedule } from '../data/mockData'
const days = ['จ. 20','อ. 21','พ. 22','พฤ. 23','ศ. 24']
const times = ['09:00','10:30','13:30','15:00']
export default function SchedulePage() { return <>
  <PageHeader title="ตารางนัดรวมของศูนย์" subtitle="ดูตารางนัดหมายทุกบริการในภาพรวม" action={<div className="inline-actions"><button className="btn">สัปดาห์นี้</button><button className="btn primary">+ เพิ่มนัด</button></div>}/>
  <section className="panel calendar-panel"><div className="calendar-grid"><div></div>{days.map(d=><div className="day-head" key={d}>{d}</div>)}{times.flatMap(time => [<div className="time-label" key={time}>{time}</div>, ...days.map(day => { const event = schedule.find(s=>s.day===day&&s.time===time); return <div className="calendar-cell" key={day+time}>{event && <div className={`event ${event.tone}`}><strong>{event.title}</strong><span>{event.therapist}</span></div>}</div>})])}</div></section>
</> }
