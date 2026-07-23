import { feedbacks } from '../data/mockData'

export default function FeedbackPage(): JSX.Element {
  return (
    <>
      <div className="topbar"><div className="topbar-greeting">๐’ฌ เธเธงเธฒเธกเธเธดเธ”เน€เธซเนเธเธเธฒเธเธซเธกเธญ</div><div className="topbar-sub">เธเธณเนเธเธฐเธเธณเธเธฒเธเธเธฑเธเธเธฒเธขเธ เธฒเธเธเธณเธเธฑเธ”</div></div>
      <div className="content">
        <div className="card">
          <div className="eyebrow">all feedback</div><h3>เธเนเธญเธเธงเธฒเธกเธ—เธฑเนเธเธซเธกเธ”</h3>
          {feedbacks.map(f=>(<div key={f.id} className="feedback-item"><div className="feedback-avatar">{f.initials}</div><div><div className="feedback-from">{f.from} <span>{f.date}</span></div><div className="feedback-msg">{f.msg}</div></div></div>))}
        </div>
      </div>
    </>
  )
}
