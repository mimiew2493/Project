export type RegistrationStatus = 'completed' | 'current' | 'pending'

export const patients = [
  { name: 'รุ่งโรจน์ ใจดี', hn: 'HN-670089', phone: '08X-XXX-2201', created: '12 ก.ค. 2569', step: 2, total: 4 },
  { name: 'ประชา คงมั่น', hn: 'HN-670090', phone: '08X-XXX-9415', created: '12 ก.ค. 2569', step: 1, total: 4 },
  { name: 'กัลยา แสงจันทร์', hn: 'HN-670091', phone: '08X-XXX-3209', created: '13 ก.ค. 2569', step: 3, total: 4 },
]

export const devices = [
  { id: 'DEV-0142', user: 'สมหมาย ใจกล้า', lastSeen: '3 มี.ค. 2569', battery: '78%', status: 'ใช้งานอยู่', tone: 'green' },
  { id: 'DEV-0143', user: 'วิภาวรรณ พันธุ์เรียน', lastSeen: '12 มี.ค. 2569', battery: '54%', status: 'ใช้งานอยู่', tone: 'green' },
  { id: 'DEV-0149', user: 'นาย สมชาย', lastSeen: '2 พ.ค. 2569', battery: '–', status: 'ไม่มีสัญญาณ 5 วัน', tone: 'red' },
  { id: 'DEV-0155', user: '–', lastSeen: '–', battery: '100%', status: 'พร้อมใช้งาน', tone: 'blue' },
  { id: 'DEV-0158', user: '–', lastSeen: '–', battery: '–', status: 'ส่งซ่อม', tone: 'orange' },
]

export const schedule = [
  { day: 'จ. 20', time: '10:30', title: 'ตรวจ', therapist: 'กภ. วิน', tone: 'green' },
  { day: 'อ. 21', time: '09:00', title: 'กายภาพ', therapist: 'กภ. โบ', tone: 'blue' },
  { day: 'พ. 22', time: '13:30', title: 'ตรวจ', therapist: 'กภ. วิน', tone: 'green' },
  { day: 'พ. 22', time: '15:00', title: 'กายภาพ', therapist: 'กภ. โบ', tone: 'orange' },
  { day: 'พฤ. 23', time: '09:00', title: 'ติดตาม', therapist: 'กภ. โบ', tone: 'orange' },
  { day: 'พฤ. 23', time: '10:30', title: 'กายภาพ', therapist: 'กภ. โบ', tone: 'blue' },
  { day: 'ศ. 24', time: '15:00', title: 'ตรวจ', therapist: 'กภ. วิน', tone: 'green' },
]
