import { useState, useEffect, useRef } from 'react'

export default function ExercisePage(): JSX.Element {
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [reps, setReps] = useState<number>(0)
  const [speed, setSpeed] = useState<number>(0)
  const [elapsed, setElapsed] = useState<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const TARGET = 20

  useEffect(() => {
    if (!isRunning) return
    timerRef.current = setInterval(() => {
      setElapsed((p) => p + 1)
      if (Math.random() > 0.4) setReps((p) => p + 1)
      setSpeed(+(2.5 + Math.random() * 2).toFixed(1))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning])

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const finish = () => { setIsRunning(false); if(timerRef.current) clearInterval(timerRef.current); alert(`Done! Reps:${reps} Speed:${speed}`) }
  const reset = () => { setIsRunning(false); if(timerRef.current) clearInterval(timerRef.current); setReps(0); setSpeed(0); setElapsed(0) }

  return (
    <>
      <div className="exercise-header">
        <div className="eyebrow">exercise session</div>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Exercise 1: Lower Arm Lift</h2>
        <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 4 }}>Set 1 of 3 - Target: {TARGET} reps</div>
      </div>
      <div className="content">
        <div className="card" style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 20px' }}>
          <div className="device-dot online"/><span style={{fontSize:13}}>Skateboard DEV-001 เน€เธเธทเนเธญเธกเธ•เนเธญเนเธฅเนเธง</span>
          <span className="badge badge-done" style={{marginLeft:'auto'}}>Connected</span>
        </div>
        <div className="metrics-grid">
          <div className="metric-box"><div className="metric-value" style={{color:'var(--cyan)'}}>{reps}</div><div className="metric-label">เธฃเธญเธ (reps)</div></div>
          <div className="metric-box"><div className="metric-value" style={{color:'var(--lime)'}}>{isRunning ? speed : 'โ€”'}</div><div className="metric-label">เธเธงเธฒเธกเน€เธฃเนเธง (r/s)</div></div>
          <div className="metric-box"><div className="metric-value" style={{color:'var(--amber)'}}>{fmt(elapsed)}</div><div className="metric-label">เน€เธงเธฅเธฒ</div></div>
        </div>
        <div className="card" style={{textAlign:'center',padding:16,background:isRunning?(speed>4?'var(--amber-dim)':'var(--lime-dim)'):'var(--panel)',borderColor:isRunning?(speed>4?'var(--amber)':'var(--lime)'):'var(--line)'}}>
          <div style={{fontSize:14}}>
            {!isRunning && reps===0 && 'เธเธ”เธเธธเนเธก "เน€เธฃเธดเนเธก" เน€เธเธทเนเธญเน€เธฃเธดเนเธกเธญเธญเธเธเธณเธฅเธฑเธเธเธฒเธข'}
            {!isRunning && reps>0 && `Session เธซเธขเธธเธ”เธเธฑเนเธงเธเธฃเธฒเธง - ${reps} reps`}
            {isRunning && speed<=4 && 'เธ—เธณเนเธ”เนเธ”เธต! โ“ เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เนเธญเน€เธเธทเนเธญเธ'}
            {isRunning && speed>4 && 'โ  เธเนเธฒเธฅเธเธเธดเธ”เธเธถเธ โ€” เธเธงเธเธเธธเธกเธเธงเธฒเธกเน€เธฃเนเธง'}
          </div>
        </div>
        <div className="control-buttons">
          {!isRunning ? <button className="btn btn-start" onClick={()=>setIsRunning(true)}>โ–ถ {reps>0?'เธ—เธณเธ•เนเธญ':'เน€เธฃเธดเนเธก'}</button>
            : <button className="btn btn-pause" onClick={()=>setIsRunning(false)}>โธ เธซเธขเธธเธ”</button>}
          <button className="btn btn-finish" onClick={finish} disabled={reps===0}>โ“ เธเธ Session</button>
          <button className="btn btn-stop" onClick={reset}>โ• เธฃเธตเน€เธเนเธ•</button>
        </div>
        <div className="card" style={{marginTop:16}}>
          <div className="eyebrow">target progress</div><h3>เธเธงเธฒเธกเธเนเธฒเธงเธซเธเนเธฒ</h3>
          <div className="progress-track" style={{height:8}}><div className="progress-fill" style={{width:`${Math.min(100,(reps/TARGET)*100)}%`}}/></div>
          <div className="progress-meta"><span>{reps} / {TARGET} reps</span><span>{Math.min(100,Math.round((reps/TARGET)*100))}%</span></div>
        </div>
      </div>
    </>
  )
}
