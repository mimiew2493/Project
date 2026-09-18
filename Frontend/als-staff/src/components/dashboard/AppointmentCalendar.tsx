import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CalendarEvent { date: string | Date; label: string; tone?: 'blue' | 'green' | 'orange' | 'red' }

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const TONE_DOT: Record<string, string> = { blue: 'bg-dash-primary', green: 'bg-dash-green', orange: 'bg-dash-orange', red: 'bg-dash-red' }

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export default function AppointmentCalendar({ events, onSelectDate }: { events: CalendarEvent[]; onSelectDate?: (d: Date) => void }) {
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<Date | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const d = typeof e.date === 'string' ? new Date(e.date) : e.date
      const key = ymd(d)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [events])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cells = Array.from({ length: startOffset + daysInMonth }, (_, i) => {
    if (i < startOffset) return null
    return i - startOffset + 1
  })

  const selectDay = (day: number) => {
    const d = new Date(year, month, day)
    setSelected(d)
    onSelectDate?.(d)
  }

  return (
    <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-bold text-dash-text">{MONTHS_TH[month]} {year + 543}</span>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg text-dash-text-soft hover:bg-dash-bg"><ChevronLeft size={15} /></button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg text-dash-text-soft hover:bg-dash-bg"><ChevronRight size={15} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-medium text-dash-text-soft">
        {WEEKDAYS.map(w => <div key={w} className="py-1">{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const d = new Date(year, month, day)
          const key = ymd(d)
          const dayEvents = byDay.get(key) ?? []
          const isToday = ymd(today) === key
          const isSelected = selected && ymd(selected) === key

          return (
            <button
              key={i}
              onClick={() => selectDay(day)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-[11.5px] transition ${
                isSelected ? 'bg-dash-primary text-white font-semibold'
                : isToday ? 'bg-dash-primary-light font-semibold text-dash-primary'
                : 'text-dash-text hover:bg-dash-bg'
              }`}
            >
              {day}
              {dayEvents.length > 0 && (
                <span className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <span key={idx} className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : TONE_DOT[e.tone ?? 'blue']}`} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selected && (byDay.get(ymd(selected))?.length ?? 0) > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-[#cfe4e0] pt-3">
          {byDay.get(ymd(selected))!.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-[11.5px] text-dash-text">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[e.tone ?? 'blue']}`} />
              {e.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
