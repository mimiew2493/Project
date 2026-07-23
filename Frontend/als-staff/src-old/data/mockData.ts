import type {
  Patient, Program, Stats, WeekDay, Session,
  Feedback, Appointment, Device, Therapist, PersonalRecord
} from './types'

export const patient: Patient = {
  id: 'P-001',
  name: 'เธชเธกเธเธฒเธข',
  fullName: 'เธชเธกเธเธฒเธข เนเธเธ”เธต',
  age: 65,
  initials: 'เธชเธ',
}

export const program: Program = {
  name: 'เนเธเธฃเนเธเธฃเธก A',
  desc: 'เนเธเธฃเนเธเธฃเธกเธเธฒเธฃเธเธถเธเนเธเธเธฃเธฐเธขเธฐเนเธฃเธ - Passive ROM',
  progress: 40,
  currentDay: 8,
  totalDays: 20,
  endDate: '15 เธช.เธ.',
}

export const stats: Stats = {
  latestReps: { value: 45,    trend: 'โ‘ 12%',    up: true },
  avgSpeed:   { value: 3.8,   trend: 'โ‘ 5%',     up: true },
  adherence:  { value: '85%', trend: 'โ‘ 3%',     up: true },
  weekCount:  { value: 4,     trend: 'on track',  up: true },
}

export const weekDays: WeekDay[] = [
  { label: 'เธ',  num: 8,  status: 'โ€”',       done: false, today: false },
  { label: 'เธญ',  num: 9,  status: '45 reps', done: true,  today: false },
  { label: 'เธ',  num: 10, status: '42 reps', done: true,  today: false },
  { label: 'เธเธค', num: 11, status: '40 reps', done: true,  today: false },
  { label: 'เธจ',  num: 12, status: '45 reps', done: true,  today: false },
  { label: 'เธช',  num: 13, status: 'เธงเธฑเธเธเธตเน',   done: false, today: true },
  { label: 'เธญเธฒ', num: 14, status: 'โ€”',       done: false, today: false },
]

export const sessions: Session[] = [
  { id: 'S-001', name: 'เนเธเธฃเนเธเธฃเธก A - Set 1', date: '12 เธ.เธ. 2568 - 14:30', reps: 45, speed: 3.8, done: true },
  { id: 'S-002', name: 'เนเธเธฃเนเธเธฃเธก A - Set 1', date: '11 เธ.เธ. 2568 - 14:15', reps: 42, speed: 3.7, done: true },
  { id: 'S-003', name: 'เนเธเธฃเนเธเธฃเธก A - Set 1', date: '10 เธ.เธ. 2568 - 14:00', reps: 40, speed: 3.6, done: true },
  { id: 'S-004', name: 'เนเธเธฃเนเธเธฃเธก A - Set 1', date: '9 เธ.เธ. 2568 - 13:45',  reps: 28, speed: 3.2, done: false },
]

export const feedbacks: Feedback[] = [
  { id: 'FB-001', from: 'เธเธฒเธข เธชเธดเธ—เธเธดเนเธเธฑเธข', initials: 'เธชเธ', date: '5 เธ.เธ. - 14:30', msg: 'เธ—เธณเนเธ”เนเธ”เธตเธเธฃเธฑเธ! เธฅเธญเธเน€เธเธดเนเธกเธเธณเธเธงเธเธฃเธญเธเธเธถเนเธเธญเธตเธ 5 เธฃเธญเธ เธ—เนเธฒเธ—เธฒเธเธ”เธตเธเธถเนเธเธกเธฒเธ' },
  { id: 'FB-002', from: 'เธเธฒเธข เธชเธดเธ—เธเธดเนเธเธฑเธข', initials: 'เธชเธ', date: '3 เธ.เธ. - 10:15', msg: 'เธเธงเธฒเธกเน€เธฃเนเธงเน€เธเธดเนเธกเธเธถเนเธ 5% เธเธฒเธเธชเธฑเธเธ”เธฒเธซเนเธ—เธตเนเนเธฅเนเธง เธ”เธตเธกเธฒเธ' },
]

export const appointment: Appointment = {
  date: 'เธเธฃเธธเนเธเธเธตเน (13 เธ.เธ. 2568)',
  time: '15:00 เธ.',
  location: 'เธชเธ–เธฒเธเธฑเธเธจเธนเธเธขเนเธเธฅเธฒเธ เธเธฑเนเธ 3',
}

export const device: Device = {
  name: 'Skateboard DEV-001',
  online: true,
  battery: 85,
  firmware: 'v1.2.3',
  signal: 'โ–โ–โ–โ– Strong',
  sensors: 'IMU โ“ - Encoder โ“',
  lastSync: '2 เธเธฒเธ—เธตเธ—เธตเนเนเธฅเนเธง',
}

export const therapist: Therapist = {
  name: 'เธเธฒเธข เธชเธดเธ—เธเธดเนเธเธฑเธข',
  initials: 'เธชเธ',
  role: 'neuromuscular rehab - T-001',
}

export const records: PersonalRecord[] = [
  { label: 'Best reps (single session)', value: '52',       color: 'var(--cyan)' },
  { label: 'Highest speed',              value: '4.5 r/s',  color: 'var(--lime)' },
  { label: 'Longest session',            value: '25 min',   color: 'var(--amber)' },
  { label: 'Current streak',             value: '6 days',   color: 'var(--violet)' },
]
