"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import StatCard from "@/components/StatCard";
import BarChart from "@/components/BarChart";
import {
  todayStr, weekStartOf, weekEndOf, addDays, fmtMoney, fmtDateShort,
  commissionRate, periodCommission, periodWages, periodSlab, last6MonthsWages,
} from "@/lib/calc";
import { exportTablePdf } from "@/lib/pdf";

export default function RevenuePage() {
  const { data, setDocById, toast } = useApp();
  const [weekStart, setWeekStart] = useState(weekStartOf(todayStr()));
  const weekEnd = weekEndOf(weekStart);
  const month = todayStr().slice(0, 7);
  const rate = commissionRate(data);

  const weekCommission = periodCommission(data, weekStart, weekEnd);
  const monthCommission = periodCommission(data, month + "-01", month + "-31");
  const daysCountedMonth = data.attendance.filter(a => a.date.startsWith(month) && a.status !== "absent").length;

  const activeSites = data.sites.filter(s => s.active !== false);
  const siteRows = activeSites.map(s => {
    const wages = periodWages(data, weekStart, weekEnd, s.id);
    const slab = periodSlab(data, weekStart, weekEnd, s.id);
    const comm = periodCommission(data, weekStart, weekEnd, s.id);
    return { site: s, wages, slab, comm, billable: wages + slab + comm };
  });

  async function saveRate(e) {
    await setDocById("settings", "app", { commissionRate: Number(e.target.value) || 0 });
    toast("Commission rate updated", "ok");
  }

  function exportPdf() {
    exportTablePdf(
      `revenue-${weekStart}.pdf`,
      `Site Revenue — ${fmtDateShort(weekStart)} to ${fmtDateShort(weekEnd)}`,
      ["Site", "Wages + Slab", "Your Commission", "Total Billable"],
      siteRows.map(r => [r.site.name, fmtMoney(r.wages + r.slab), fmtMoney(r.comm), fmtMoney(r.billable)]),
      `Commission rate: ${fmtMoney(rate)} per labourer per full day`
    );
  }

  const trend = last6MonthsWages(data);

  return (
    <div className="page-anim">
      <div className="card accent" style={{ marginBottom: 16 }}>
        <p className="section-title">Commission Settings</p>
        <p className="section-sub">Your earning per labourer per full day worked (half day pays half commission)</p>
        <div className="grid cols-2">
          <label>Commission Rate (₹ / labourer / day)<input type="number" defaultValue={rate} onBlur={saveRate} /></label>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <StatCard royal label="This Week's Commission" numeric={weekCommission} prefix="₹" />
        <StatCard label="This Month's Commission" numeric={monthCommission} prefix="₹" />
        <StatCard label="Labourer-Days This Month" numeric={daysCountedMonth} />
      </div>

      <div className="card">
        <p className="section-title" style={{ fontSize: 15 }}>Total Expense — Last 6 Months</p>
        <p className="section-sub">Wages + slab + material, month by month</p>
        <BarChart data={trend.map(t => ({ label: t.label, total: t.total }))} valueFmt={v => `₹${Math.round(v / 1000)}k`} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="week-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Previous Week</button>
          <div className="chip active">{fmtDateShort(weekStart)} – {fmtDateShort(weekEnd)}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next Week →</button>
          <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={exportPdf}>📄 Export PDF</button>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Site-wise — Who Owes You What (this week)</p>
        <p className="section-sub">Wages+Slab is what you pay labourers; Commission is your earning; Total Billable is what the site owner owes you</p>
        <div className="table-wrap scrollx">
          <table className="rtable">
            <thead><tr><th>Site</th><th>Wages + Slab</th><th>Your Commission</th><th>Total Billable</th></tr></thead>
            <tbody>
              {siteRows.length === 0 && <tr><td colSpan={4} className="empty">No active sites</td></tr>}
              {siteRows.map(r => (
                <tr key={r.site.id}>
                  <td data-label="Site"><b>{r.site.name}</b></td>
                  <td data-label="Wages + Slab">{fmtMoney(r.wages + r.slab)}</td>
                  <td data-label="Your Commission"><b style={{ color: "var(--brick)" }}>{fmtMoney(r.comm)}</b></td>
                  <td data-label="Total Billable"><b>{fmtMoney(r.billable)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
