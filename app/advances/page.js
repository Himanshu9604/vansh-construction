"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import { fmtMoney, todayStr, outstandingAdvance, totalOutstandingAdvances, ROLE_LABEL } from "@/lib/calc";

export default function AdvancesPage() {
  const { data, add, remove, toast } = useApp();
  const [editing, setEditing] = useState(null);
  const activeLabs = data.labourers.filter(l => l.active !== false);

  const totalOut = totalOutstandingAdvances(data);
  const byLabour = activeLabs
    .map(l => ({ lab: l, outstanding: outstandingAdvance(data, l.id) }))
    .filter(x => x.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    add("advances", {
      labourerId: f.get("labourerId"),
      date: f.get("date"),
      amount: Number(f.get("amount")) || 0,
      note: f.get("note") || "",
    });
    toast("Advance recorded — it will auto-deduct from that week's payment", "ok");
    setEditing(null);
  }

  const rows = data.advances.slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page-anim">
      <div className="page-head">
        <div>
          <p className="section-title">Advances (Udhar)</p>
          <p className="section-sub">Cash given to a labourer mid-week — automatically subtracted from their weekly payment</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Give Advance</button>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <StatCard royal label="Total Advances Given (All-time)" numeric={totalOut} prefix="₹" />
        <StatCard label="Labourers With Advance History" numeric={byLabour.length} />
        <StatCard label="Entries Recorded" numeric={data.advances.length} />
      </div>

      {byLabour.length > 0 && (
        <div className="card">
          <p className="section-title" style={{ fontSize: 14 }}>Advance History by Labourer (all-time total given)</p>
          <p className="section-sub">Each advance is auto-subtracted from that specific week&apos;s payment — this is just a running record, not an unpaid balance.</p>
          <div className="stagger" style={{ display: "grid", gap: 0 }}>
            {byLabour.map(({ lab, outstanding }) => (
              <div key={lab.id} className="duelist">
                <span><b>{lab.name}</b> <span className="pill pill-role">{ROLE_LABEL[lab.role] || lab.role}</span></span>
                <span className="amt">{fmtMoney(outstanding)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <p className="section-title" style={{ fontSize: 14 }}>All Advance Entries</p>
        <div className="table-wrap scrollx">
          <table className="rtable">
            <thead><tr><th>Date</th><th>Labourer</th><th>Amount</th><th>Note</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="empty">No advances given yet</td></tr>}
              {rows.map(a => {
                const lab = data.labourers.find(l => l.id === a.labourerId);
                return (
                  <tr key={a.id}>
                    <td data-label="Date">{a.date}</td>
                    <td data-label="Labourer"><b>{lab?.name || "—"}</b></td>
                    <td data-label="Amount"><b>{fmtMoney(a.amount)}</b></td>
                    <td data-label="Note">{a.note || "—"}</td>
                    <td data-label="">
                      <button
                        className="btn btn-ghost btn-sm danger"
                        onClick={() => { if (confirm("Delete this advance entry?")) { remove("advances", a.id); toast("Deleted", "ok"); } }}
                      >Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <Modal title="Give an Advance" onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="form-grid">
            <label>Labourer
              <select required name="labourerId" defaultValue="">
                <option value="" disabled>— select —</option>
                {activeLabs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label>Date<input required type="date" name="date" defaultValue={todayStr()} /></label>
            <label>Amount (₹)<input required type="number" name="amount" placeholder="e.g. 1000" /></label>
            <label>Note (optional)<input name="note" placeholder="e.g. for medicine" /></label>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
