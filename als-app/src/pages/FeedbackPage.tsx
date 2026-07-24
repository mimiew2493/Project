import { feedbacks } from '../data/mockData'

export default function FeedbackPage(): JSX.Element {
  return (
    <>
      <div className="topbar"><div className="topbar-greeting">💬 ความคิดเห็นจากหมอ</div><div className="topbar-sub">คำแนะนำและ Feedback จากนักกายภาพบำบัด</div></div>
      <div className="content">
        <div className="card">
          <div className="eyebrow">all feedback</div><h3>ข้อความทั้งหมด</h3>
          {feedbacks.map((f) => (
            <div key={f.id} className="feedback-item">
              <div className="feedback-avatar">{f.initials}</div>
              <div><div className="feedback-from">{f.from} <span>{f.date}</span></div><div className="feedback-msg">{f.msg}</div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
