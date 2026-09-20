"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { todayStr, fmtMoney, dailyWageFor, ROLE_LABEL, ROLE_DEFAULT_RATE } from "@/lib/calc";

export default function AttendancePage() {
  const { data, add, update, remove, toast } = useApp();
  const [date, setDate] = useState(todayStr());
  const activeSites = data.sites.filter(s => s.active !== false);
  const [siteId, setSiteId] = useState(activeSites[0]?.id || "");
  const [slabAmount, setSlabAmount] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const activeLabs = data.labourers.filter(l => l.active !== false);
  const slabToday = data.slabEntries.find(s => s.date === date && s.siteId === siteId);

  async function setStatus(labourerId, status) {
    const existing = data.attendance.find(a => a.date === date && a.labourerId === labourerId);
    if (existing) await update("attendance", existing.id, { status, siteId });
    else await add("attendance", { date, siteId, labourerId, status });
  }

  async function markAll(status) {
    setBulkBusy(true);
    try {
      for (const l of activeLabs) {
        await setStatus(l.id, status);
      }
      toast(`All labourers marked ${status === "full" ? "Full" : status === "half" ? "Half" : "Absent"}`, "ok");
    } finally {
      setBulkBusy(false);
    }
  }

  async function clearAll() {
    if (!confirm(`Clear all attendance marks for ${date}?`)) return;
    setBulkBusy(true);
    try {
      const todays = data.attendance.filter(a => a.date === date);
      for (const a of todays) await remove("attendance", a.id);
      toast("Attendance cleared for this date", "ok");
    } finally {
      setBulkBusy(false);
    }
  }

  async function saveSlab() {
    const amt = Number(slabAmount) || 0;
    if (slabToday) await update("slabEntries", slabToday.id, { amount: amt });
    else await add("slabEntries", { date, siteId, amount: amt });
    toast("Slab entry saved", "ok");
    setSlabAmount("");
  }

  const rows = activeLabs.map(l => {
    const a = data.attendance.find(x => x.date === date && x.labourerId === l.id);
    return { lab: l, status: a?.status };
  });

  const dayTotal = rows.reduce((s, r) => s + dailyWageFor(r.lab, r.status), 0);
  const presentCount = rows.filter(r => r.status && r.status !== "absent").length;

  return (
    <div className="page-anim">
      <p className="section-title">Daily Attendance</p>
      <p className="section-sub">Select a date and site, then mark each labourer F (Full) / H (Half) / A (Absent)</p>

      <div className="card">
        <div className="grid cols-2">
          <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <label>Site {activeSites.length === 0 && <span className="danger">(add a site first)</span>}
            <select value={siteId} onChange={e => setSiteId(e.target.value)}>
              {activeSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      {activeSites.length === 0 ? (
        <div className="card empty">No active sites — please add one in the Sites tab first.</div>
      ) : (
        <>
          <div className="card">
            <p className="section-title" style={{ fontSize: 14 }}>Slab Day? (Bulk Gang Payment)</p>
            <p className="section-sub" style={{ margin: 0 }}>
              If today is a slab day, enter one lump-sum amount for the whole gang instead of individual attendance
            </p>
            <div className="grid cols-2" style={{ marginTop: 10 }}>
              <input
                type="number"
                placeholder="Total amount for the whole gang (₹)"
                value={slabAmount !== "" ? slabAmount : (slabToday?.amount ?? "")}
                onChange={e => setSlabAmount(e.target.value)}
              />
              <button className="btn btn-primary" onClick={saveSlab}>Save Slab Entry</button>
            </div>
            {slabToday && <p className="section-sub" style={{ marginTop: 10 }}>Today&apos;s slab lump-sum: <b>{fmtMoney(slabToday.amount)}</b></p>}
          </div>

          <div className="card">
            <div className="flex-between">
              <span className="muted" style={{ fontWeight: 700 }}>Quick actions — mark everyone at once:</span>
              <div className="flex-gap">
                <button className="btn btn-ghost btn-sm" disabled={bulkBusy} onClick={() => markAll("full")}>✓ All Full</button>
                <button className="btn btn-ghost btn-sm" disabled={bulkBusy} onClick={() => markAll("absent")}>✕ All Absent</button>
                <button className="btn btn-ghost btn-sm danger" disabled={bulkBusy} onClick={clearAll}>Clear Day</button>
              </div>
            </div>
          </div>

          <div className="grid cols-2" style={{ marginBottom: 16 }}>
            <div className="stat"><div className="lbl">Present Today</div><div className="val">{presentCount} / {activeLabs.length}</div></div>
            <div className="stat royal"><div className="lbl">Today&apos;s Total Wage Bill</div><div className="val">{fmtMoney(dayTotal)}</div></div>
          </div>

          <div className="card">
            <div className="table-wrap scrollx">
              <table className="rtable">
                <thead><tr><th>Labourer</th><th>Rate</th><th>Attendance</th><th>Today&apos;s Wage</th></tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={4} className="empty">Add labourers in the Labourers tab first</td></tr>}
                  {rows.map(({ lab, status }) => (
                    <tr key={lab.id}>
                      <td data-label="Labourer">
                        <div className="name-row">
                          <span className="avatar-chip">{lab.name?.slice(0, 1).toUpperCase()}</span>
                          <span><b>{lab.name}</b> <span className="pill pill-role">{ROLE_LABEL[lab.role] || lab.role}</span></span>
                        </div>
                      </td>
                      <td data-label="Rate">{fmtMoney(lab.rate || ROLE_DEFAULT_RATE[lab.role])}/day</td>
                      <td data-label="Attendance">
                        <div className="att-btns">
                          <button className={`att-btn full ${status === "full" ? "active" : ""}`} onClick={() => setStatus(lab.id, "full")}>F</button>
                          <button className={`att-btn half ${status === "half" ? "active" : ""}`} onClick={() => setStatus(lab.id, "half")}>H</button>
                          <button className={`att-btn absent ${status === "absent" ? "active" : ""}`} onClick={() => setStatus(lab.id, "absent")}>A</button>
                        </div>
                      </td>
                      <td data-label="Today's Wage">{fmtMoney(dailyWageFor(lab, status))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
