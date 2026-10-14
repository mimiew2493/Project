// พัฒนาการการฝึกของผู้ป่วย — ใช้ร่วมกันในหน้าเคสของนักกายภาพ (แท็บพัฒนาการ) และหน้าประวัติผู้ป่วยของเวชระเบียน
import { useEffect, useState, type ReactNode } from "react";
import type { Patient, TherapySession } from "../types";
import { list, startOfDay, addDays, dayDiff, sameDay, dayMonth } from "../lib/clinic";
import { Stat } from "./ui";

export type Side = "LEFT" | "RIGHT";
export const SIDE_LABEL: Record<Side, string> = { LEFT: "ข้างซ้าย", RIGHT: "ข้างขวา" };
export const SIDE_COLOR: Record<Side, string> = { RIGHT: "#007AFF", LEFT: "#00A5FF" };

/** หนึ่งเซตที่ฝึก — รวมจากกระดานในนัด (therapy_sessions) และเครื่องฝึกที่ผู้ป่วยกดเอง (skateboard_sessions) */
export interface RepSet {
  id: string;
  side: Side;
  reps: number;
  at: string;
}

/** เซตทั้งหมดของผู้ป่วย เรียงเก่า → ใหม่ (เซต 0 ครั้งไม่นับ) */
export function useRepSets(
  patientId: string | undefined,
  sessions: TherapySession[],
  fallbackSide: Side,
): RepSet[] {
  const [skate, setSkate] = useState<
    { id: number; session_count: number; side?: Side | null; created_at: string }[]
  >([]);
  useEffect(() => {
    if (!patientId) return;
    list<{ id: number; session_count: number; side?: Side | null; created_at: string }>(
      `/api/skateboard-sessions?patient_id=${encodeURIComponent(patientId)}`,
    )
      .then(setSkate)
      .catch(() => setSkate([]));
  }, [patientId, sessions.length]);
  const asSide = (s?: string | null): Side =>
    s === "LEFT" || s === "RIGHT" ? s : fallbackSide;
  const board: RepSet[] = sessions.map((s) => ({
    id: s.session_id,
    side: asSide(s.side),
    reps: s.total_reps,
    at: s.session_date,
  }));
  // เซตเดียวกันถูกบันทึกทั้งสองตาราง → ข้ามแถว skateboard ที่ตรงกับเซตในนัด (ข้างเดียวกัน ครั้งเท่ากัน ห่างกันไม่เกิน 2 นาที)
  const used = new Set<string>();
  const isDup = (x: RepSet) => {
    const t = new Date(x.at).getTime();
    const m = board.find(
      (b) =>
        !used.has(b.id) &&
        b.side === x.side &&
        b.reps === x.reps &&
        Math.abs(new Date(b.at).getTime() - t) <= 120_000,
    );
    if (m) used.add(m.id);
    return !!m;
  };
  return [
    ...board,
    ...skate
      .map((s) => ({
        id: `SK${s.id}`,
        side: asSide(s.side),
        reps: s.session_count ?? 0,
        at: s.created_at,
      }))
      .filter((x) => !isDup(x)),
  ]
    .filter((x) => x.reps > 0)
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** กราฟแท่งจัดกลุ่ม: แต่ละกลุ่มมีแท่งข้างซ้าย/ขวาคู่กัน (ข้างเดียว → แท่งเดียว) พร้อมตัวเลขบนแท่ง */
export function GroupedBars({
  sides,
  groups,
}: {
  sides: Side[];
  groups: { k: string; l: string; v: Partial<Record<Side, number>> }[];
}) {
  const max = Math.max(
    1,
    ...groups.flatMap((g) => sides.map((sd) => g.v[sd] ?? 0)),
  );
  const cols = {
    gridTemplateColumns: `repeat(${groups.length}, minmax(${sides.length > 1 ? 64 : 44}px,1fr))`,
  };

  return (
    <div className="flex flex-col gap-2">
      {sides.length > 1 && (
        <div className="flex justify-end gap-3">
          {sides.map((sd) => (
            <span
              key={sd}
              className="flex items-center gap-1.5 text-[12px] text-rx-muted"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: SIDE_COLOR[sd] }}
              />
              {SIDE_LABEL[sd]}
            </span>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <div
          className="grid h-[190px] items-end gap-2 border-b border-rx-soft"
          style={cols}
        >
          {groups.map((g) => (
            <div
              key={g.k}
              className="flex h-full items-end justify-center gap-1"
            >
              {sides.map((sd) => {
                const v = g.v[sd];
                return (
                  <div
                    key={sd}
                    className="flex max-w-[30px] flex-1 flex-col items-center justify-end gap-0.5"
                  >
                    <span className="text-[11px] text-rx-muted">{v ?? ""}</span>
                    <div
                      className="w-full"
                      style={{
                        height: v ? Math.max(3, Math.round((v / max) * 160)) : 0,
                        background: SIDE_COLOR[sd],
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div
          className="grid gap-2 pt-1.5 text-center text-[11px] text-rx-muted"
          style={cols}
        >
          {groups.map((g) => (
            <span key={g.k} className="truncate">
              {g.l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// วันที่แบบ "YYYY-MM-DD" (เวลาท้องถิ่น) ใช้กับช่องเลือกวันที่
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => new Date(`${s}T00:00:00`);

/** พัฒนาการการฝึก: เวลาเฉลี่ยต่อครั้ง + กราฟแท่งคู่ซ้าย/ขวาของแต่ละครั้งที่มาฝึก เลือกช่วงวันที่ได้ (ใช้ทั้งหน้านักกายภาพและเวชระเบียน) */
export default function TrainingProgress({
  patient,
  sessions,
  stats,
}: {
  patient: Patient | null;
  sessions: TherapySession[];
  /** การ์ดตัวเลขเพิ่มเติมที่วางแถวเดียวกับ "เวลาเฉลี่ยต่อครั้ง" */
  stats?: ReactNode;
}) {
  // ช่วงวันที่เลือก (null = ยังไม่เลือก → ใช้ตั้งแต่วันแรกที่ฝึกถึงวันนี้)
  const [range, setRange] = useState<{ from: string; to: string } | null>(
    null,
  );
  const allSets = useRepSets(
    patient?.patient_id,
    sessions,
    patient?.affected_side === "ข้างซ้าย" ? "LEFT" : "RIGHT",
  );
  const reps = sessions.reduce((a, s) => a + s.total_reps, 0);
  const secPerRep = reps
    ? Math.round(sessions.reduce((a, s) => a + s.duration_sec, 0) / reps)
    : null;

  // ขอบเขตของตัวเลือก: วันแรกที่มีผลการฝึก → วันนี้
  const today = startOfDay(new Date());
  const first = allSets.length ? startOfDay(new Date(allSets[0].at)) : today;
  const span = Math.max(0, dayDiff(today, first));
  const minIso = isoDay(first);
  const maxIso = isoDay(today);
  const clampIso = (s: string) => (s < minIso ? minIso : s > maxIso ? maxIso : s);
  const from = clampIso(range?.from ?? minIso);
  const to = clampIso(range?.to ?? maxIso);
  const fromIdx = dayDiff(fromIso(from), first);
  const toIdx = dayDiff(fromIso(to), first);
  const setFrom = (s: string) =>
    s && setRange({ from: s > to ? to : s, to });
  const setTo = (s: string) => s && setRange({ from, to: s < from ? from : s });

  // ภาพรวมแต่ละครั้งที่มาฝึกในช่วงที่เลือก: จำนวนครั้งรวมของแต่ละข้างในวันนั้น
  const inRange = allSets.filter((x) => {
    const d = isoDay(new Date(x.at));
    return d >= from && d <= to;
  });
  const sides = (["LEFT", "RIGHT"] as Side[]).filter((sd) =>
    inRange.some((x) => x.side === sd),
  );
  const groups = [
    ...new Set(inRange.map((x) => new Date(x.at).toDateString())),
  ].map((k) => {
    const d = new Date(k);
    const day = inRange.filter((x) => sameDay(new Date(x.at), d));
    return {
      k,
      l: dayMonth(d),
      v: Object.fromEntries(
        sides
          .map((sd) => [
            sd,
            day.filter((x) => x.side === sd).reduce((n, x) => n + x.reps, 0),
          ])
          .filter(([, v]) => v),
      ) as Partial<Record<Side, number>>,
    };
  });
  const pct = (i: number) => (span ? (i / span) * 100 : 0);
  const dateCls =
    "h-9 rounded-md border border-rx-line bg-white px-2.5 text-[13px]";

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {stats}
        <Stat
          label="เวลาเฉลี่ยต่อครั้ง"
          value={secPerRep != null ? `${secPerRep} วิ` : "–"}
        />
      </div>
      <div className="flex flex-col gap-3 rx-card px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold">
              จำนวนครั้งที่ทำได้ · แต่ละครั้งที่มาฝึก
            </span>
            <span className="text-[12px] text-rx-muted">
              มาฝึก {groups.length} ครั้งในช่วงนี้
            </span>
          </div>
          {/* ตัวเลือกช่วงวันที่ (between): พิมพ์/เลือกวันที่ หรือลากหัวทั้งสองข้าง */}
          {allSets.length > 0 && (
            <div className="flex w-full max-w-[320px] flex-col gap-2">
              <span className="text-[12px] text-rx-muted">ช่วงวันที่</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  aria-label="ตั้งแต่วันที่"
                  className={`${dateCls} min-w-0 flex-1`}
                  min={minIso}
                  max={to}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
                <input
                  type="date"
                  aria-label="ถึงวันที่"
                  className={`${dateCls} min-w-0 flex-1`}
                  min={from}
                  max={maxIso}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="relative mx-[11px] h-[22px]">
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-rx-soft" />
                <div
                  className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-rx-ink"
                  style={{
                    left: `${pct(fromIdx)}%`,
                    right: `${100 - pct(toIdx)}%`,
                  }}
                />
                <input
                  type="range"
                  aria-label="ตั้งแต่วันที่"
                  className="rx-range"
                  // หัวซ้ายชนขวาสุด → ยกขึ้นบน ไม่งั้นหัวขวาบังจนลากกลับไม่ได้
                  style={{ zIndex: fromIdx >= span ? 2 : 1 }}
                  min={0}
                  max={span}
                  value={fromIdx}
                  onChange={(e) =>
                    setFrom(isoDay(addDays(first, Number(e.target.value))))
                  }
                />
                <input
                  type="range"
                  aria-label="ถึงวันที่"
                  className="rx-range"
                  min={0}
                  max={span}
                  value={toIdx}
                  onChange={(e) =>
                    setTo(isoDay(addDays(first, Number(e.target.value))))
                  }
                />
              </div>
            </div>
          )}
        </div>
        {groups.length ? (
          <GroupedBars sides={sides} groups={groups} />
        ) : (
          <span className="py-6 text-center text-[13px] text-rx-muted">
            {allSets.length ? "ไม่มีผลการฝึกในช่วงนี้" : "ยังไม่มีผลการฝึก"}
          </span>
        )}
      </div>
    </>
  );
}
