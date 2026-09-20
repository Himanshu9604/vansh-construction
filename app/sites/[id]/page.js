"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import StatCard from "@/components/StatCard";
import { fmtMoney, fmtDateShort, siteTotals, siteAttendanceDays } from "@/lib/calc";

export default function SiteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data } = useApp();
  const [tab, setTab] = useState("overview");

  const site = data.sites.find(s => s.id === id);
  if (!site) {
    return (
      <div className="page-anim">
        <p className="empty">Site not found — it may have been deleted.</p>
        <button className="btn btn-ghost" onClick={() => router.push("/sites")}>← Back to Sites</button>
      </div>
    );
  }

  const totals = siteTotals(data, id);
  const profit = (Number(site.contractValue) || 0) - totals.total;
  const days = siteAttendanceDays(data, id);
  const materials = data.materials.filter(m => m.siteId === id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page-anim">
      <button className="btn btn-ghost btn-sm no-print" style={{ marginBottom: 12 }} onClick={() => router.push("/sites")}>← All Sites</button>

      <div className="page-head">
        <div>
          <p className="section-title">{site.name}</p>
          <p className="section-sub">{site.gaon || "No village set"} · {site.plotSqft ? `${site.plotSqft} sqft` : "No plot area set"}</p>
        </div>
        <span className={`pill ${site.active !== false ? "pill-full" : "pill-absent"}`}>{site.active !== false ? "Active" : "Closed"}</span>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <StatCard label="Total Wages" numeric={totals.wages} prefix="₹" />
        <StatCard label="Total Slab" numeric={totals.slab} prefix="₹" />
        <StatCard label="Total Material" numeric={totals.material} prefix="₹" />
        <StatCard royal label="Total Spent" numeric={totals.total} prefix="₹" />
      </div>

      {site.contractValue > 0 && (
        <div className={`card ${profit >= 0 ? "wine" : ""}`} style={profit < 0 ? { borderColor: "rgba(194,59,59,0.3)" } : {}}>
          <p className="section-title" style={{ fontSize: 14 }}>Profit / Loss on This Site</p>
          <div className="grid cols-3" style={{ marginTop: 10 }}>
            <div>
              <p className="muted">Contract Value</p>
              <p style={{ fontWeight: 700, fontSize: 16 }}>{fmtMoney(site.contractValue)}</p>
            </div>
            <div>
              <p className="muted">Total Spent (Wages+Slab+Material)</p>
              <p style={{ fontWeight: 700, fontSize: 16 }}>{fmtMoney(totals.total)}</p>
            </div>
            <div>
              <p className="muted">{profit >= 0 ? "Estimated Profit" : "Over Budget By"}</p>
              <p style={{ fontWeight: 700, fontSize: 16, color: profit >= 0 ? "var(--ok)" : "var(--bad)" }}>{fmtMoney(Math.abs(profit))}</p>
            </div>
          </div>
        </div>
      )}

      <div className="tabbar">
        <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Attendance Days ({days.length})</button>
        <button className={tab === "materials" ? "active" : ""} onClick={() => setTab("materials")}>Materials ({materials.length})</button>
      </div>

      {tab === "overview" && (
        <div className="card">
          <div className="table-wrap scrollx">
            <table className="rtable">
              <thead><tr><th>Date</th><th>Workers Present</th><th>Wage Bill</th></tr></thead>
              <tbody>
                {days.length === 0 && <tr><td colSpan={3} className="empty">No attendance logged at this site yet</td></tr>}
                {days.map(d => (
                  <tr key={d.date}>
                    <td data-label="Date">{fmtDateShort(d.date)}</td>
                    <td data-label="Workers Present">{d.workers}</td>
                    <td data-label="Wage Bill"><b>{fmtMoney(d.wage)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "materials" && (
        <div className="card">
          <div className="table-wrap scrollx">
            <table className="rtable">
              <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Cost</th></tr></thead>
              <tbody>
                {materials.length === 0 && <tr><td colSpan={4} className="empty">No material purchases logged for this site yet</td></tr>}
                {materials.map(m => (
                  <tr key={m.id}>
                    <td data-label="Date">{m.date}</td>
                    <td data-label="Type" style={{ textTransform: "capitalize" }}>{m.type}</td>
                    <td data-label="Qty">{m.qty}</td>
                    <td data-label="Cost"><b>{fmtMoney(m.cost)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
