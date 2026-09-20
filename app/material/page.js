"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import Modal from "@/components/Modal";
import { fmtMoney, todayStr } from "@/lib/calc";
import { exportTablePdf } from "@/lib/pdf";

const DEFAULT_RATIO = { cement: 0.4, sand: 1.2, gitti: 1.0, steel: 3.5 }; // per sqft thumb rule

export default function MaterialPage() {
  const { data, add, remove, toast } = useApp();
  const [siteId, setSiteId] = useState("");
  const [sqft, setSqft] = useState("");
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [editing, setEditing] = useState(null);
  const [filterSite, setFilterSite] = useState("");
  const [filterType, setFilterType] = useState("");

  const effSqft = Number(sqft) || Number(data.sites.find(s => s.id === siteId)?.plotSqft) || 0;
  const est = {
    cement: (effSqft * ratio.cement).toFixed(1),
    sand: (effSqft * ratio.sand).toFixed(1),
    gitti: (effSqft * ratio.gitti).toFixed(1),
    steel: (effSqft * ratio.steel).toFixed(1),
  };

  const filteredMaterials = data.materials
    .filter(m => !filterSite || m.siteId === filterSite)
    .filter(m => !filterType || m.type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalCost = filteredMaterials.reduce((s, m) => s + (Number(m.cost) || 0), 0);

  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      date: f.get("date"),
      siteId: f.get("siteId"),
      type: f.get("type"),
      qty: Number(f.get("qty")) || 0,
      cost: Number(f.get("cost")) || 0,
      note: f.get("note") || "",
    };
    add("materials", payload);
    toast("Material entry added", "ok");
    setEditing(null);
  }

  return (
    <div className="page-anim">
      <p className="section-title">Material Estimator</p>
      <p className="section-sub">Estimate cement, sand, gravel and steel from the plot&apos;s square footage (thumb-rule estimate — adjust ratios based on your own experience)</p>

      <div className="card accent">
        <div className="grid cols-2">
          <select value={siteId} onChange={e => setSiteId(e.target.value)}>
            <option value="">— Select a site (or enter sq.ft manually) —</option>
            {data.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" placeholder="Plot sq.ft" value={sqft} onChange={e => setSqft(e.target.value)} />
        </div>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 700 }}>Adjust ratios (per sq.ft) ▾</summary>
          <div className="grid cols-4" style={{ marginTop: 10 }}>
            <label>Cement (bags)<input type="number" step="0.01" value={ratio.cement} onChange={e => setRatio(r => ({ ...r, cement: Number(e.target.value) }))} /></label>
            <label>Sand (cft)<input type="number" step="0.01" value={ratio.sand} onChange={e => setRatio(r => ({ ...r, sand: Number(e.target.value) }))} /></label>
            <label>Gravel (cft)<input type="number" step="0.01" value={ratio.gitti} onChange={e => setRatio(r => ({ ...r, gitti: Number(e.target.value) }))} /></label>
            <label>Steel (kg)<input type="number" step="0.01" value={ratio.steel} onChange={e => setRatio(r => ({ ...r, steel: Number(e.target.value) }))} /></label>
          </div>
        </details>

        {effSqft > 0 ? (
          <div className="grid cols-4 stagger" style={{ marginTop: 16 }}>
            <div className="stat"><div className="lbl">Cement</div><div className="val">{est.cement} bags</div></div>
            <div className="stat"><div className="lbl">Sand</div><div className="val">{est.sand} cft</div></div>
            <div className="stat"><div className="lbl">Gravel</div><div className="val">{est.gitti} cft</div></div>
            <div className="stat"><div className="lbl">Steel</div><div className="val">{est.steel} kg</div></div>
          </div>
        ) : <p className="empty" style={{ padding: "20px 0" }}>Enter sq.ft to see the estimate</p>}
      </div>

      <div className="page-head" style={{ marginTop: 22 }}>
        <div><p className="section-title">Material Purchases (Actual Expense)</p><p className="section-sub">Log the actual cost of every material purchase here — it feeds straight into the revenue dashboard · Filtered total: <b>{fmtMoney(totalCost)}</b></p></div>
        <div className="page-head-actions">
          <button className="btn btn-ghost" onClick={() => exportTablePdf(
            "vansh-construction-materials.pdf",
            "Material Purchases",
            ["Date", "Site", "Type", "Qty", "Cost"],
            filteredMaterials.map(m => [m.date, data.sites.find(s => s.id === m.siteId)?.name || "—", m.type, m.qty, fmtMoney(m.cost)]),
            `Total: ${fmtMoney(totalCost)}`
          )}>📄 PDF</button>
          <button className="btn btn-primary" onClick={() => setEditing({})}>+ Add Entry</button>
        </div>
      </div>

      <div className="flex-gap" style={{ marginBottom: 14 }}>
        <select value={filterSite} onChange={e => setFilterSite(e.target.value)} className="search" style={{ minWidth: 160 }}>
          <option value="">All sites</option>
          {data.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="search" style={{ minWidth: 140 }}>
          <option value="">All types</option>
          <option value="cement">Cement</option>
          <option value="sand">Sand</option>
          <option value="gitti">Gravel</option>
          <option value="steel">Steel</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap scrollx">
          <table className="rtable">
            <thead><tr><th>Date</th><th>Site</th><th>Type</th><th>Qty</th><th>Cost</th><th></th></tr></thead>
            <tbody>
              {filteredMaterials.length === 0 && <tr><td colSpan={6} className="empty">No material entries match this filter</td></tr>}
              {filteredMaterials.map(m => (
                <tr key={m.id}>
                  <td data-label="Date">{m.date}</td>
                  <td data-label="Site">{data.sites.find(s => s.id === m.siteId)?.name || "—"}</td>
                  <td data-label="Type" style={{ textTransform: "capitalize" }}>{m.type}</td>
                  <td data-label="Qty">{m.qty}</td>
                  <td data-label="Cost">{fmtMoney(m.cost)}</td>
                  <td data-label="">
                    <button
                      className="btn btn-ghost btn-sm danger"
                      onClick={() => { if (confirm("Delete this material entry?")) { remove("materials", m.id); toast("Deleted", "ok"); } }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <Modal title="Add Material Purchase" onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="form-grid">
            <label>Date<input required type="date" name="date" defaultValue={todayStr()} /></label>
            <label>Site<select name="siteId">{data.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Type
              <select name="type">
                <option value="cement">Cement</option>
                <option value="sand">Sand</option>
                <option value="gitti">Gravel</option>
                <option value="steel">Steel</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Quantity<input type="number" name="qty" step="0.01" /></label>
            <label>Cost (₹)<input required type="number" name="cost" /></label>
            <label>Note<input name="note" placeholder="optional" /></label>
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
