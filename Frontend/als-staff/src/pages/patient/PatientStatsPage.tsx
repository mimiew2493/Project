import TreatmentHistory from '../../components/TreatmentHistory'

interface Props { patientId: string }

export default function PatientStatsPage({ patientId }: Props) {
  return (
    <>
      <div className="mb-3.5 px-0.5">
        <h1 className="text-[15px] font-extrabold text-[#1B1E2C]">ผลการฝึกและประวัติการรักษา</h1>
        <p className="mt-[3px] text-[11px] text-[#82869C]">สรุปข้อมูลจากอุปกรณ์ IoT และคำแนะนำจากนักกายภาพระหว่างการฝึก</p>
      </div>
      <TreatmentHistory patientId={patientId} variant="patient" />
    </>
  )
}
