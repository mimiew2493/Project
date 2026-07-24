export interface Patient {
  id: string
  name: string
  fullName: string
  age: number
  initials: string
}

export interface Program {
  name: string
  desc: string
  progress: number
  currentDay: number
  totalDays: number
  endDate: string
}

export interface StatItem {
  value: number | string
  trend: string
  up: boolean
}

export interface Stats {
  latestReps: StatItem
  avgSpeed: StatItem
  adherence: StatItem
  weekCount: StatItem
}

export interface WeekDay {
  label: string
  num: number
  status: string
  done: boolean
  today: boolean
}

export interface Session {
  id: string
  name: string
  date: string
  reps: number
  speed: number
  done: boolean
}

export interface Feedback {
  id: string
  from: string
  initials: string
  date: string
  msg: string
}

export interface Appointment {
  date: string
  time: string
  location: string
}

export interface Device {
  name: string
  online: boolean
  battery: number
  firmware: string
  signal: string
  sensors: string
  lastSync: string
}

export interface Therapist {
  name: string
  initials: string
  role: string
}

export interface PersonalRecord {
  label: string
  value: string
  color: string
}
