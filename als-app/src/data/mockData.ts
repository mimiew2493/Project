import type {
  Patient, Program, Stats, WeekDay, Session,
  Feedback, Appointment, Device, Therapist, PersonalRecord
} from './types'

export const patient: Patient = {
  id: 'P-001',
  name: 'สมชาย',
  fullName: 'สมชาย ใจดี',
  age: 65,
  initials: 'สช',
}

export const program: Program = {
  name: 'โปรแกรม A',
  desc: 'โปรแกรมการฝึกแขนระยะแรก · Passive ROM',
  progress: 40,
  currentDay: 8,
  totalDays: 20,
  endDate: '15 ส.ค.',
}

export const stats: Stats = {
  latestReps: { value: 45,    trend: '↑ 12%',    up: true },
  avgSpeed:   { value: 3.8,   trend: '↑ 5%',     up: true },
  adherence:  { value: '85%', trend: '↑ 3%',     up: true },
  weekCount:  { value: 4,     trend: 'on track',  up: true },
}

export const weekDays: WeekDay[] = [
  { label: 'จ',  num: 8,  status: '—',       done: false, today: false },
  { label: 'อ',  num: 9,  status: '45 reps', done: true,  today: false },
  { label: 'พ',  num: 10, status: '42 reps', done: true,  today: false },
  { label: 'พฤ', num: 11, status: '40 reps', done: true,  today: false },
  { label: 'ศ',  num: 12, status: '45 reps', done: true,  today: false },
  { label: 'ส',  num: 13, status: 'วันนี้',   done: false, today: true },
  { label: 'อา', num: 14, status: '—',       done: false, today: false },
]

export const sessions: Session[] = [
  { id: 'S-001', name: 'โปรแกรม A · Set 1', date: '12 ก.ค. 2568 · 14:30', reps: 45, speed: 3.8, done: true },
  { id: 'S-002', name: 'โปรแกรม A · Set 1', date: '11 ก.ค. 2568 · 14:15', reps: 42, speed: 3.7, done: true },
  { id: 'S-003', name: 'โปรแกรม A · Set 1', date: '10 ก.ค. 2568 · 14:00', reps: 40, speed: 3.6, done: true },
  { id: 'S-004', name: 'โปรแกรม A · Set 1', date: '9 ก.ค. 2568 · 13:45',  reps: 28, speed: 3.2, done: false },
]

export const feedbacks: Feedback[] = [
  { id: 'FB-001', from: 'นาย สิทธิ์ชัย', initials: 'สช', date: '5 ก.ค. · 14:30', msg: 'ทำได้ดีครับ! ลองเพิ่มจำนวนรอบขึ้นอีก 5 รอบ ท่าทางดีขึ้นมาก' },
  { id: 'FB-002', from: 'นาย สิทธิ์ชัย', initials: 'สช', date: '3 ก.ค. · 10:15', msg: 'ความเร็วเพิ่มขึ้น 5% จากสัปดาห์ที่แล้ว ดีมาก' },
]

export const appointment: Appointment = {
  date: 'พรุ่งนี้ (13 ก.ค. 2568)',
  time: '15:00 น.',
  location: 'สถาบันศูนย์กลาง ชั้น 3',
}

export const device: Device = {
  name: 'Skateboard DEV-001',
  online: true,
  battery: 85,
  firmware: 'v1.2.3',
  signal: '▂▄▆█ Strong',
  sensors: 'IMU ✓ · Encoder ✓',
  lastSync: '2 นาทีที่แล้ว',
}

export const therapist: Therapist = {
  name: 'นาย สิทธิ์ชัย',
  initials: 'สช',
  role: 'neuromuscular rehab · T-001',
}

export const records: PersonalRecord[] = [
  { label: 'Best reps (single session)', value: '52',       color: 'var(--cyan)' },
  { label: 'Highest speed',              value: '4.5 r/s',  color: 'var(--lime)' },
  { label: 'Longest session',            value: '25 min',   color: 'var(--amber)' },
  { label: 'Current streak',             value: '6 days 🔥', color: 'var(--violet)' },
]
