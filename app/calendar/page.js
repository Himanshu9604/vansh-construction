"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import StatCard from "@/components/StatCard";
import { fmtMoney, dailyTotalsForMonth } from "@/lib/calc";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { data } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const totals = dailyTotalsForMonth(data, monthKey);

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthKey}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, ...(totals[dateStr] || { wage: 0, workers: 0 }) });
  }

  const monthWage = Object.values(totals).reduce((s, t) => s + t.wage, 0);
  const activeDays = Object.keys(totals).length;
  const maxWage = Math.max(...Object.values(totals).map(t => t.wage), 1);

  function intensity(wage) {
    if (!wage) return "transparent";
    const pct = Math.min(1, wage / maxWage);
    return `color-mix(in srgb, var(--gold) ${Math.round(pct * 55 + 10)}%, var(--paper))`;
  }

  return (
    <div className="page-anim">
      <p className="section-title">Monthly Calendar</p>
      <p className="section-sub">A bird&apos;s-eye view of your wage bill across every site, day by day</p>

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <StatCard royal label="Total This Month" numeric={monthWage} prefix="₹" />
        <StatCard label="Working Days Logged" numeric={activeDays} />
        <StatCard label="Average / Working Day" numeric={activeDays ? Math.round(monthWage / activeDays) : 0} prefix="₹" />
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <p className="section-title" style={{ fontSize: 16, margin: 0 }}>{monthLabel}</p>
          <div className="flex-gap">
            <button className="btn btn-ghost btn-sm" onClick={() => setMonthOffset(o => o - 1)}>← Prev</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0}>Next →</button>
          </div>
        </div>

        <div className="cal-grid" style={{ marginBottom: 6 }}>
          {WEEKDAYS.map((w, i) => <div key={i} className="cal-label">{w.slice(0, 3)}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((c, i) => (
            <div
              key={i}
              className={c ? "cal-day" : "cal-day pad"}
              style={c && c.wage > 0 ? { background: intensity(c.wage), borderColor: "color-mix(in srgb, var(--gold) 40%, transparent)" } : {}}
              title={c && c.wage > 0 ? `${c.workers} workers · ${fmtMoney(c.wage)}` : ""}
            >
              {c ? (
                <>
                  <span>{c.day}</span>
                  {c.wage > 0 && <span style={{ fontSize: 8, fontWeight: 600, opacity: 0.8 }}>₹{Math.round(c.wage / 100) / 10}k</span>}
                </>
              ) : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
