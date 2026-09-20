"use client";
import { useMemo } from "react";
import { useApp } from "@/lib/AppContext";
import StatCard from "@/components/StatCard";
import {
  todayStr, weekStartOf, weekEndOf, addDays, fmtMoney, fmtDateShort,
  monthTotals, bySiteMonth, weeklyBreakdown, weeklyAdvance, totalOutstandingAdvances, absenteeStreaks, ROLE_LABEL,
} from "@/lib/calc";

export default function DashboardPage() {
  const { data } = useApp();
  const today = todayStr();
  const month = today.slice(0, 7);
  const wkStart = weekStartOf(today);

  const activeLabs = data.labourers.filter(l => l.active !== false);
  const present = data.attendance.filter(a => a.date === today && a.status !== "absent").length;

  const mt = useMemo(() => monthTotals(data, month), [data, month]);
  const bySite = useMemo(() => bySiteMonth(data, month), [data, month]);
  const totalAdvances = useMemo(() => totalOutstandingAdvances(data), [data]);

  const dues = useMemo(() => {
    return activeLabs
      .map(l => {
        const wb = weeklyBreakdown(data, l.id, wkStart);
        const advance = weeklyAdvance(data, l.id, wkStart);
        const pay = data.payments.find(p => p.labourerId === l.id && p.weekStart === wkStart);
        return { name: l.name, role: l.role, total: wb.total - advance, paid: !!(pay && pay.paid) };
      })
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [data, activeLabs, wkStart]);

  const totalDue = dues.filter(d => !d.paid).reduce((s, d) => s + d.total, 0);

  // Alerts: last week's dues still unpaid, and labourers absent 3+ days running
  const lastWeekStart = addDays(wkStart, -7);
  const overdueLabs = useMemo(() => {
    return activeLabs
      .map(l => {
        const wb = weeklyBreakdown(data, l.id, lastWeekStart);
        const advance = weeklyAdvance(data, l.id, lastWeekStart);
        const net = wb.total - advance;
        const pay = data.payments.find(p => p.labourerId === l.id && p.weekStart === lastWeekStart);
        return { name: l.name, net, paid: !!(pay && pay.paid) };
      })
      .filter(d => d.net > 0 && !d.paid);
  }, [data, activeLabs, lastWeekStart]);
  const streaks = useMemo(() => absenteeStreaks(data, 3), [data]);

  return (
    <div className="page-anim">
      <p className="section-title" style={{ marginBottom: 2 }}>Welcome back, Nitin</p>
      <p className="section-sub">Here&apos;s how things stand today across all your sites.</p>

      {overdueLabs.length > 0 && (
        <div className="banner-alert">
          ⚠️ <span><b>{overdueLabs.length} labourer{overdueLabs.length > 1 ? "s" : ""}</b> still unpaid from last week ({fmtDateShort(lastWeekStart)} – {fmtDateShort(weekEndOf(lastWeekStart))}), totalling <b>{fmtMoney(overdueLabs.reduce((s, d) => s + d.net, 0))}</b>. Check the Weekly Payment tab.</span>
        </div>
      )}
      {streaks.length > 0 && (
        <div className="banner-alert">
          🚩 <span>{streaks.map(s => s.lab.name).join(", ")} — absent {streaks[0].streak}+ days in a row. Might be worth a call.</span>
        </div>
      )}

      <div className="grid cols-4 stagger" style={{ marginBottom: 18 }}>
        <StatCard royal label="Today Present / Total" value={`${present} / ${activeLabs.length}`} />
        <StatCard label="This Month's Wages" numeric={mt.wages} prefix="₹" />
        <StatCard label="This Month's Material" numeric={mt.materialCost} prefix="₹" />
        <StatCard label="Total Expense (Month)" numeric={mt.total} prefix="₹" />
      </div>

      <div className="dash-grid">
        <div className="card accent">
          <p className="section-title">
            Site-wise Expense — {new Date(month + "-02").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <p className="section-sub">Wages + Slab + Material total for each site this month</p>
          <div className="table-wrap scrollx">
            <table className="rtable">
              <thead><tr><th>Site</th><th>Wages</th><th>Slab</th><th>Material</th><th>Total</th></tr></thead>
              <tbody>
                {Object.values(bySite).length === 0 && (
                  <tr><td colSpan={5} className="empty">No active sites</td></tr>
                )}
                {Object.values(bySite).map(s => {
                  const t = s.wages + s.material + s.slab;
                  return (
                    <tr key={s.id}>
                      <td data-label="Site"><b>{s.name}</b><br /><span className="muted">{s.gaon || "—"}</span></td>
                      <td data-label="Wages">{fmtMoney(s.wages)}</td>
                      <td data-label="Slab">{fmtMoney(s.slab)}</td>
                      <td data-label="Material">{fmtMoney(s.material)}</td>
                      <td data-label="Total"><b>{fmtMoney(t)}</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card sidepanel">
          <div>
            <p className="section-title">Net Due This Week</p>
            <p className="section-sub">
              Attendance minus advances, for {fmtDateShort(wkStart)} – {fmtDateShort(weekEndOf(wkStart))}
            </p>
          </div>
          <StatCard label="Pending So Far (this week)" numeric={totalDue} prefix="₹" />
          {totalAdvances > 0 && <StatCard label="Total Advances Given (all-time)" numeric={totalAdvances} prefix="₹" />}
          <div>
            {dues.length === 0 && <div className="empty">No attendance recorded for this week yet</div>}
            {dues.slice(0, 12).map((d, i) => (
              <div key={i} className="duelist">
                <span><b>{d.name}</b> <span className="pill pill-role">{ROLE_LABEL[d.role] || d.role}</span></span>
                <span className="amt">
                  {d.paid ? <span className="pill pill-paid">Paid</span> : fmtMoney(d.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
