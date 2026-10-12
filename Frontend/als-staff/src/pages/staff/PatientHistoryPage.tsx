import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import type { AppointmentRequest } from "../../types";
import { PatientHeader, VisitCard } from "../../components/VisitHistory";
import TrainingProgress from "../../components/TrainingProgress";
import { useCase, pastVisits } from "../../lib/useCase";
import { BackLink, Loading, Stat } from "../../components/ui";
import { list, ptName } from "../../lib/clinic";

interface Props {
  patientId: string;
  onBack: () => void;
  backLabel?: string;
}

const PAGE = 10;

export default function PatientHistoryPage({
  patientId,
  onBack,
  backLabel = "กลับไปคิวผู้ป่วย",
}: Props) {
  const { patient, appts, sessions, programs, amendments, loading } =
    useCase(patientId);
  const [show, setShow] = useState(PAGE);
  // คำขอนัดที่นักกายภาพส่งมาทั้งหมด (ที่รอลงนัดแสดงเป็นแถบด้านบน · ทุกรายการแสดงในประวัติแต่ละครั้ง)
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  useEffect(() => {
    list<AppointmentRequest>(
      `/api/appointment-requests?status=ALL&patient_id=${patientId}`,
    ).then(setRequests);
  }, [patientId]);

  if (loading) return <Loading />;
  if (!patient)
    return (
      <>
        <BackLink onClick={onBack}>{backLabel}</BackLink>
        <Loading text="ไม่พบข้อมูลผู้ป่วย" />
      </>
    );

  const visits = pastVisits(appts);
  const came = visits.filter((v) => v.status === "COMPLETED");
  const shown = visits.slice(0, show);
  const caretaker = patient.caretaker_name
    ? `ผู้ดูแล ${patient.caretaker_name}${patient.caretaker_phone ? ` ${patient.caretaker_phone}` : ""}`
    : "";

  return (
    <>
      <BackLink onClick={onBack}>{backLabel}</BackLink>
      <PatientHeader
        patient={patient}
        programs={programs}
        extra={[caretaker]}
        showPt
      />
      {requests.filter((r) => r.status === "PENDING").map((r) => (
        <div
          key={r.request_id}
          className="flex flex-wrap items-center gap-3.5 rounded-lg border border-[#F2D7AE] bg-[#FFF8EC] px-5 py-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E08A1E] text-white">
            <CalendarClock size={20} />
          </div>
          <div className="flex flex-[1_1_300px] flex-col gap-0.5">
            <span className="text-[13px] text-[#8C420A]">
              {ptName(r.therapist_name)} ขอให้นัดครั้งถัดไป
            </span>
            <span className="text-[16px] font-semibold text-[#5C2E07]">
              {r.note ? `หมายเหตุ: ${r.note}` : "ไม่มีหมายเหตุ"}
            </span>
          </div>
          <span className="text-[12px] text-[#8C420A]">
            ลงนัดได้ที่หน้าตารางนัด
          </span>
        </div>
      ))}
      {/* พัฒนาการการฝึก — แบบเดียวกับแท็บพัฒนาการของนักกายภาพ · การ์ดมารักษาทั้งหมดอยู่แถวเดียวกับเวลาเฉลี่ยต่อครั้ง */}
      <TrainingProgress
        patient={patient}
        sessions={sessions}
        stats={<Stat label="มารักษาทั้งหมด" value={`${came.length} ครั้ง`} />}
      />
      <span className="text-[16px] font-semibold">ประวัติการรักษา</span>
      {shown.length === 0 && (
        <div className="rx-card px-5 py-6 text-[14px] text-rx-muted">
          ยังไม่มีประวัติการมารักษา
        </div>
      )}
      {shown.map((a) => (
        <VisitCard
          key={a.appointment_id}
          a={a}
          sessions={sessions}
          patient={patient}
          variant="staff"
          amendments={amendments}
          requests={requests}
          appts={appts}
        />
      ))}
      <div className="flex flex-col items-center gap-2.5 py-1">
        <span className="text-[13px] text-rx-muted">
          แสดง {shown.length} จาก {visits.length} ครั้ง
        </span>
        {visits.length > shown.length && (
          <button
            type="button"
            onClick={() => setShow(visits.length)}
            className="h-11 rounded-lg border border-rx-accent bg-white px-8 text-[14px] font-semibold text-rx-accent"
          >
            ดูทั้งหมด
          </button>
        )}
      </div>
      <span className="text-[12px] text-rx-muted">
        เวชระเบียนเห็นข้อมูลการสอบถามเพิ่มจากผู้ป่วย นัดที่นักกายภาพขอพร้อมหมายเหตุ
        และวันนัดที่ลงให้ · ผลการกายภาพ ผลการประเมินอาการ และแผนการรักษา เปิดดูได้เฉพาะนักกายภาพ
      </span>
    </>
  );
}
