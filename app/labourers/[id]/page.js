"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import StatCard from "@/components/StatCard";
import {
  fmtMoney, fmtDateShort, ROLE_LABEL, ROLE_DEFAULT_RATE,
  weeklyBreakdown, weeklyAdvance, labourerWeeksList, labourerAllTimeEarnings, monthAttendanceMap,
} from "@/lib/calc";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function LabourerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);

  const lab = data.labourers.find(l => l.id === id);
  if (!lab) {
    return (
      <div className="page-anim">
        <p className="empty">Labourer not found — they may have been deleted.</p>
        <button className="btn btn-ghost" onClick={() => router.push("/labourers")}>← Back to Labourers</button>
      </div>
    );
  }

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const attMap = monthAttendanceMap(data, id, monthKey);

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthKey}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, status: attMap[dateStr] });
  }

  const allTimeEarnings = labourerAllTimeEarnings(data, id);
  const weeks = labourerWeeksList(data, id).slice(0, 12);
  const advancesForLab = (data.advances || []).filter(a => a.labourerId === id).sort((a, b) => b.date.localeCompare(a.date));
  const totalAdvance = advancesForLab.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  return (
    <div className="page-anim">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => router.push("/labourers")}>← All Labourers</button>

      <div className="page-head">
        <div className="name-row">
          <span className="avatar-chip" style={{ width: 44, height: 44, fontSize: 17, borderRadius: 13 }}>{lab.name?.slice(0, 1).toUpperCase()}</span>
          <div>
            <p className="section-title" style={{ marginBottom: 3 }}>{lab.name}</p>
            <p className="section-sub" style={{ margin: 0 }}>
              <span className="pill pill-role">{ROLE_LABEL[lab.role] || lab.role}</span>{" "}
              {lab.gaon || "No village set"} · {fmtMoney(lab.rate || ROLE_DEFAULT_RATE[lab.role])}/day
            </p>
          </div>
        </div>
        <span className={`pill ${lab.active !== false ? "pill-full" : "pill-absent"}`}>{lab.active !== false ? "Active" : "Inactive"}</span>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <StatCard royal label="All-Time Earnings" numeric={allTimeEarnings} prefix="₹" />
        <StatCard label="Total Advance Given" numeric={totalAdvance} prefix="₹" />
        <StatCard label="Weeks With Records" numeric={weeks.length} />
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <p className="section-title" style={{ fontSize: 15, margin: 0 }}>Attendance Calendar — {monthLabel}</p>
          <div className="flex-gap">
            <button className="btn btn-ghost btn-sm" onClick={() => setMonthOffset(o => o - 1)}>← Prev</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0}>Next →</button>
          </div>
        </div>
        <div className="cal-grid" style={{ marginBottom: 6 }}>
          {WEEKDAYS.map((w, i) => <div key={i} className="cal-label">{w}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((c, i) => (
            <div key={i} className={c ? `cal-day ${c.status || ""}` : "cal-day pad"}>
              {c ? c.day : ""}
            </div>
          ))}
        </div>
        <div className="flex-gap" style={{ marginTop: 12, fontSize: 11 }}>
          <span className="pill pill-full">Full</span>
          <span className="pill pill-unpaid">Half</span>
          <span className="pill pill-absent">Absent</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <p className="section-title" style={{ fontSize: 15 }}>Weekly Payment History</p>
          <div className="table-wrap scrollx">
            <table className="rtable">
              <thead><tr><th>Week</th><th>Gross</th><th>Advance</th><th>Net</th><th>Status</th></tr></thead>
              <tbody>
                {weeks.length === 0 && <tr><td colSpan={5} className="empty">No attendance recorded yet</td></tr>}
                {weeks.map(w => {
                  const wb = weeklyBreakdown(data, id, w);
                  const adv = weeklyAdvance(data, id, w);
                  const pay = data.payments.find(p => p.labourerId === id && p.weekStart === w);
                  return (
                    <tr key={w}>
                      <td data-label="Week">{fmtDateShort(w)}</td>
                      <td data-label="Gross">{fmtMoney(wb.total)}</td>
                      <td data-label="Advance">{adv > 0 ? <span className="danger">− {fmtMoney(adv)}</span> : "—"}</td>
                      <td data-label="Net"><b>{fmtMoney(wb.total - adv)}</b></td>
                      <td data-label="Status">{pay?.paid ? <span className="pill pill-paid">Paid</span> : <span className="pill pill-unpaid">Pending</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card sidepanel">
          <p className="section-title" style={{ fontSize: 15, marginBottom: 0 }}>Advance History</p>
          {advancesForLab.length === 0 && <div className="empty">No advances given yet</div>}
          {advancesForLab.map(a => (
            <div key={a.id} className="duelist">
              <span><b>{a.date}</b>{a.note ? <span className="muted"> — {a.note}</span> : ""}</span>
              <span className="amt">{fmtMoney(a.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
