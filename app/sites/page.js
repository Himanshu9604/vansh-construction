"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import { fmtMoney } from "@/lib/calc";
import { exportTablePdf } from "@/lib/pdf";

export default function SitesPage() {
  const { data, add, update, remove, toast } = useApp();
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  const rows = data.sites.filter(s =>
    s.name?.toLowerCase().includes(q.toLowerCase()) || (s.gaon || "").toLowerCase().includes(q.toLowerCase())
  );
  const activeCount = data.sites.filter(s => s.active !== false).length;
  const totalContractValue = data.sites.reduce((s, x) => s + (Number(x.contractValue) || 0), 0);

  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      name: f.get("name")?.trim(),
      gaon: f.get("gaon")?.trim() || "",
      plotSqft: Number(f.get("plotSqft")) || 0,
      contractValue: Number(f.get("contractValue")) || 0,
      active: f.get("active") === "on",
    };
    if (editing?.id) { update("sites", editing.id, payload); toast("Site updated", "ok"); }
    else { add("sites", payload); toast("Site added", "ok"); }
    setEditing(null);
  }

  return (
    <div className="page-anim">
      <div className="page-head">
        <div><p className="section-title">Sites</p><p className="section-sub">Add every construction site here</p></div>
        <div className="page-head-actions">
          <input className="search" placeholder="Search sites…" value={q} onChange={e => setQ(e.target.value)} />
          <button className="btn btn-ghost" onClick={() => exportTablePdf(
            "vansh-construction-sites.pdf",
            "Sites Overview",
            ["Name", "Village", "Plot Sqft", "Contract Value", "Status"],
            rows.map(s => [s.name, s.gaon || "—", s.plotSqft || "—", s.contractValue ? fmtMoney(s.contractValue) : "—", s.active !== false ? "Active" : "Closed"])
          )}>📄 PDF</button>
          <button className="btn btn-primary" onClick={() => setEditing({})}>+ New Site</button>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <StatCard royal label="Active Sites" numeric={activeCount} />
        <StatCard label="Total Sites" numeric={data.sites.length} />
        <StatCard label="Total Contract Value" numeric={totalContractValue} prefix="₹" />
      </div>

      <div className="card">
        <div className="table-wrap scrollx">
          <table className="rtable">
            <thead><tr><th>Name</th><th>Village</th><th>Plot</th><th>Contract Value</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="empty">No sites added yet</td></tr>}
              {rows.map(s => (
                <tr key={s.id}>
                  <td data-label="Name"><Link href={`/sites/${s.id}`} className="link-reset"><b style={{ textDecoration: "underline", textDecorationColor: "var(--gold)", textUnderlineOffset: 3 }}>{s.name}</b></Link></td>
                  <td data-label="Village">{s.gaon || "—"}</td>
                  <td data-label="Plot">{s.plotSqft ? `${s.plotSqft} sqft` : "—"}</td>
                  <td data-label="Contract Value">{s.contractValue ? fmtMoney(s.contractValue) : "—"}</td>
                  <td data-label="Status">{s.active !== false ? <span className="pill pill-full">Active</span> : <span className="pill pill-absent">Closed</span>}</td>
                  <td data-label="">
                    <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(s)}>Edit</button>
                      <button
                        className="btn btn-ghost btn-sm danger"
                        onClick={() => { if (confirm("Delete this site? Its attendance/material history will be kept.")) { remove("sites", s.id); toast("Site deleted", "ok"); } }}
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <Modal title={editing.id ? "Edit Site" : "New Site"} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="form-grid">
            <label>Site Name<input required name="name" defaultValue={editing.name || ""} /></label>
            <label>Village<input name="gaon" defaultValue={editing.gaon || ""} placeholder="e.g. Wadgaon" /></label>
            <label>Plot Area (sqft)<input type="number" name="plotSqft" defaultValue={editing.plotSqft || ""} /></label>
            <label>Contract Value (₹)<input type="number" name="contractValue" defaultValue={editing.contractValue || ""} /></label>
            <label className="row-check"><input type="checkbox" name="active" defaultChecked={editing.active !== false} /> Site is currently active</label>
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
