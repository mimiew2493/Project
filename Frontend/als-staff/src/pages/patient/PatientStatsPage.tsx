import TreatmentHistory from '../../components/TreatmentHistory'

interface Props { patientId: string }

export default function PatientStatsPage({ patientId }: Props) {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700 }}>ผลการฝึกและประวัติการรักษา</h1>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>สรุปข้อมูลจากอุปกรณ์ IoT และคำแนะนำจากนักกายภาพระหว่างการฝึก</p>
      </div>
      <TreatmentHistory patientId={patientId} />
    </>
  )
}
