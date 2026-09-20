"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import { ROLE_LABEL, ROLE_DEFAULT_RATE, fmtMoney } from "@/lib/calc";
import { exportTablePdf } from "@/lib/pdf";

const ROLE_FILTERS = [
  { key: "all", label: "All" },
  { key: "mistri", label: "Mistri" },
  { key: "labour", label: "Labour" },
  { key: "centring", label: "Centring" },
  { key: "other", label: "Other" },
];

export default function LabourersPage() {
  const { data, add, update, remove, toast } = useApp();
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const rows = data.labourers
    .filter(l => (roleFilter === "all" ? true : (l.role || "labour") === roleFilter))
    .filter(l => l.name?.toLowerCase().includes(q.toLowerCase()) || (l.gaon || "").toLowerCase().includes(q.toLowerCase()));

  const activeCount = data.labourers.filter(l => l.active !== false).length;
  const byRole = { mistri: 0, labour: 0, centring: 0, other: 0 };
  data.labourers.forEach(l => { byRole[l.role || "labour"] = (byRole[l.role || "labour"] || 0) + 1; });

  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const role = f.get("role");
    const name = f.get("name")?.trim();
    const dup = data.labourers.find(l => l.name?.toLowerCase() === name?.toLowerCase() && l.id !== editing?.id);
    if (dup && !confirm(`A labourer named "${name}" already exists (${dup.gaon || "no village set"}). Add anyway?`)) {
      return;
    }
    const payload = {
      name,
      gaon: f.get("gaon")?.trim() || "",
      role,
      rate: Number(f.get("rate")) || ROLE_DEFAULT_RATE[role] || 500,
      active: f.get("active") === "on",
    };
    if (editing?.id) { update("labourers", editing.id, payload); toast("Updated", "ok"); }
    else { add("labourers", payload); toast("Labourer added", "ok"); }
    setEditing(null);
  }

  return (
    <div className="page-anim">
      <div className="page-head">
        <div><p className="section-title">Labourers</p><p className="section-sub">Mistri, Labour, Centring — manage everyone here</p></div>
        <div className="page-head-actions">
          <input className="search" placeholder="Search name or village…" value={q} onChange={e => setQ(e.target.value)} />
          <button className="btn btn-ghost" onClick={() => exportTablePdf(
            "vansh-construction-labourers.pdf",
            "Labourer List",
            ["Name", "Village", "Role", "Rate", "Status"],
            rows.map(l => [l.name, l.gaon || "—", ROLE_LABEL[l.role] || l.role, fmtMoney(l.rate || ROLE_DEFAULT_RATE[l.role]), l.active !== false ? "Active" : "Inactive"])
          )}>📄 PDF</button>
          <button className="btn btn-primary" onClick={() => setEditing({})}>+ New Labourer</button>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <StatCard royal label="Active Labourers" numeric={activeCount} />
        <StatCard label="Mistri" numeric={byRole.mistri || 0} />
        <StatCard label="Labour" numeric={byRole.labour || 0} />
        <StatCard label="Centring" numeric={byRole.centring || 0} />
      </div>

      <div className="flex-gap" style={{ marginBottom: 14 }}>
        {ROLE_FILTERS.map(r => (
          <button
            key={r.key}
            className={`chip ${roleFilter === r.key ? "active" : ""}`}
            style={{ cursor: "pointer", border: "none" }}
            onClick={() => setRoleFilter(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap scrollx">
          <table className="rtable">
            <thead><tr><th>Name</th><th>Village</th><th>Role</th><th>Rate</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="empty">No labourers match — try a different search or filter</td></tr>}
              {rows.map(l => (
                <tr key={l.id}>
                  <td data-label="Name">
                    <Link href={`/labourers/${l.id}`} className="link-reset">
                      <div className="name-row">
                        <span className="avatar-chip">{l.name?.slice(0, 1).toUpperCase() || "?"}</span>
                        <b style={{ textDecoration: "underline", textDecorationColor: "var(--gold)", textUnderlineOffset: 3 }}>{l.name}</b>
                      </div>
                    </Link>
                  </td>
                  <td data-label="Village">{l.gaon || "—"}</td>
                  <td data-label="Role"><span className="pill pill-role">{ROLE_LABEL[l.role] || l.role}</span></td>
                  <td data-label="Rate">{fmtMoney(l.rate || ROLE_DEFAULT_RATE[l.role])} / day</td>
                  <td data-label="Status">{l.active !== false ? <span className="pill pill-full">Active</span> : <span className="pill pill-absent">Inactive</span>}</td>
                  <td data-label="">
                    <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(l)}>Edit</button>
                      <button
                        className="btn btn-ghost btn-sm danger"
                        onClick={() => { if (confirm("Delete this labourer?")) { remove("labourers", l.id); toast("Deleted", "ok"); } }}
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
        <Modal title={editing.id ? "Edit Labourer" : "New Labourer"} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="form-grid">
            <label>Name<input required name="name" defaultValue={editing.name || ""} /></label>
            <label>Village<input name="gaon" defaultValue={editing.gaon || ""} placeholder="e.g. Wadgaon" /></label>
            <label>Role
              <select name="role" defaultValue={editing.role || "labour"}>
                <option value="mistri">Mistri (₹700)</option>
                <option value="labour">Labour (₹500)</option>
                <option value="centring">Centring (₹600)</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Daily Rate (₹)<input type="number" name="rate" defaultValue={editing.rate || ""} /></label>
            <label className="row-check"><input type="checkbox" name="active" defaultChecked={editing.active !== false} /> Active</label>
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
