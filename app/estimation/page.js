"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/AppContext";
import Modal from "@/components/Modal";
import { fmtMoney, fmtMoneyPdf, todayStr } from "@/lib/calc";
import { exportSummaryPdf } from "@/lib/pdf";

const BLANK_FORM = {
  siteName: "",
  ownerName: "",
  plotArea: "",
  constructionArea: "",
  constructionRate: 1800,
  compoundLength: "",
  compoundRate: 250,
  plasterArea: "",
  plasterRate: 60,
  additionalCosts: "",
  marginPercent: 12,
  note: "",
};

function computeEstimate(f) {
  const constructionCost = (Number(f.constructionArea) || 0) * (Number(f.constructionRate) || 0);
  const compoundCost = (Number(f.compoundLength) || 0) * (Number(f.compoundRate) || 0);
  const plasterCost = (Number(f.plasterArea) || 0) * (Number(f.plasterRate) || 0);
  const additional = Number(f.additionalCosts) || 0;
  const subtotal = constructionCost + compoundCost + plasterCost + additional;
  const profit = (subtotal * (Number(f.marginPercent) || 0)) / 100;
  const grandTotal = subtotal + profit;
  return { constructionCost, compoundCost, plasterCost, additional, subtotal, profit, grandTotal };
}

export default function EstimationPage() {
  const { data, add, remove, toast } = useApp();
  const [form, setForm] = useState(BLANK_FORM);
  const [viewing, setViewing] = useState(null);

  const calc = useMemo(() => computeEstimate(form), [form]);

  function change(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function saveEstimate(e) {
    e.preventDefault();
    if (!form.siteName.trim()) { toast("Site name is required", "err"); return; }
    add("estimates", { ...form, date: todayStr(), ...calc });
    toast("Estimate saved", "ok");
    setForm(BLANK_FORM);
  }

  function downloadPdf(est) {
    const c = computeEstimate(est);
    exportSummaryPdf(
      `estimate-${(est.siteName || "site").replace(/\s+/g, "-").toLowerCase()}.pdf`,
      `Construction Estimate — ${est.siteName}`,
      [
        ["Site Owner", est.ownerName || "—"],
        ["Plot Area", est.plotArea ? `${est.plotArea} sqft` : "—"],
        ["Construction Area", est.constructionArea ? `${est.constructionArea} sqft` : "—"],
        ["Estimate Date", est.date || todayStr()],
      ],
      {
        headers: ["Item", "Details", "Amount"],
        rows: [
          ["Construction", `${est.constructionArea || 0} sqft @ ${fmtMoneyPdf(est.constructionRate)}/sqft`, fmtMoneyPdf(c.constructionCost)],
          ["Compound Wall", `${est.compoundLength || 0} ft @ ${fmtMoneyPdf(est.compoundRate)}/ft`, fmtMoneyPdf(c.compoundCost)],
          ["Plastering", `${est.plasterArea || 0} sqft @ ${fmtMoneyPdf(est.plasterRate)}/sqft`, fmtMoneyPdf(c.plasterCost)],
          ["Additional Costs", est.note || "—", fmtMoneyPdf(c.additional)],
          ["Subtotal", "", fmtMoneyPdf(c.subtotal)],
          [`Margin / Profit (${est.marginPercent}%)`, "", fmtMoneyPdf(c.profit)],
          ["Grand Total", "", fmtMoneyPdf(c.grandTotal)],
        ],
      }
    );
  }

  const savedRows = data.estimates.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="page-anim">
      <p className="section-title">Site Estimation</p>
      <p className="section-sub">Work out a full construction estimate before quoting a client — save it, download it as a branded PDF, or print it on the spot</p>

      <div className="dash-grid">
        <div className="card accent">
          <p className="section-title" style={{ fontSize: 15 }}>New Estimate</p>
          <form onSubmit={saveEstimate} className="form-grid">
            <div className="grid cols-2">
              <label>Site Name<input required value={form.siteName} onChange={e => change("siteName", e.target.value)} placeholder="e.g. Patil Bungalow" /></label>
              <label>Site Owner Name<input value={form.ownerName} onChange={e => change("ownerName", e.target.value)} placeholder="e.g. Suresh Patil" /></label>
            </div>
            <div className="grid cols-2">
              <label>Plot Area (sqft)<input type="number" value={form.plotArea} onChange={e => change("plotArea", e.target.value)} /></label>
              <label>Construction Area (sqft)<input type="number" value={form.constructionArea} onChange={e => change("constructionArea", e.target.value)} /></label>
            </div>
            <label>Construction Rate (₹ / sqft)<input type="number" value={form.constructionRate} onChange={e => change("constructionRate", e.target.value)} /></label>
            <div className="grid cols-2">
              <label>Compound Wall Length (ft)<input type="number" value={form.compoundLength} onChange={e => change("compoundLength", e.target.value)} /></label>
              <label>Compound Wall Rate (₹ / ft)<input type="number" value={form.compoundRate} onChange={e => change("compoundRate", e.target.value)} /></label>
            </div>
            <div className="grid cols-2">
              <label>Plastering Area (sqft)<input type="number" value={form.plasterArea} onChange={e => change("plasterArea", e.target.value)} /></label>
              <label>Plastering Rate (₹ / sqft)<input type="number" value={form.plasterRate} onChange={e => change("plasterRate", e.target.value)} /></label>
            </div>
            <div className="grid cols-2">
              <label>Additional Costs (₹)<input type="number" value={form.additionalCosts} onChange={e => change("additionalCosts", e.target.value)} placeholder="doors, windows, plumbing…" /></label>
              <label>Your Margin / Profit (%)<input type="number" value={form.marginPercent} onChange={e => change("marginPercent", e.target.value)} /></label>
            </div>
            <label>Note (optional)<input value={form.note} onChange={e => change("note", e.target.value)} placeholder="what the additional cost covers" /></label>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(BLANK_FORM)}>Clear</button>
              <button type="submit" className="btn btn-primary">Save Estimate</button>
            </div>
          </form>
        </div>

        <div className="sidepanel">
          <div className="card wine">
            <p className="section-title" style={{ fontSize: 15 }}>Live Estimate Preview</p>
            <div className="duelist"><span>Construction</span><span className="amt" style={{ color: "var(--gold-light)" }}>{fmtMoney(calc.constructionCost)}</span></div>
            <div className="duelist"><span>Compound Wall</span><span className="amt" style={{ color: "var(--gold-light)" }}>{fmtMoney(calc.compoundCost)}</span></div>
            <div className="duelist"><span>Plastering</span><span className="amt" style={{ color: "var(--gold-light)" }}>{fmtMoney(calc.plasterCost)}</span></div>
            <div className="duelist"><span>Additional</span><span className="amt" style={{ color: "var(--gold-light)" }}>{fmtMoney(calc.additional)}</span></div>
            <div className="duelist"><span>Subtotal</span><span className="amt" style={{ color: "var(--gold-light)" }}>{fmtMoney(calc.subtotal)}</span></div>
            <div className="duelist"><span>Margin ({form.marginPercent || 0}%)</span><span className="amt" style={{ color: "var(--gold-light)" }}>{fmtMoney(calc.profit)}</span></div>
            <div className="duelist" style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 4, paddingTop: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Grand Total</span>
              <span style={{ fontWeight: 800, fontSize: 19, color: "var(--gold-light)" }}>{fmtMoney(calc.grandTotal)}</span>
            </div>
          </div>
          <button
            className="btn btn-gold"
            onClick={() => form.siteName.trim() ? downloadPdf(form) : toast("Enter a site name first", "err")}
          >📄 Download This Estimate as PDF</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 6 }}>
        <p className="section-title" style={{ fontSize: 15 }}>Saved Estimates</p>
        <div className="table-wrap scrollx">
          <table className="rtable">
            <thead><tr><th>Date</th><th>Site</th><th>Owner</th><th>Construction Area</th><th>Grand Total</th><th></th></tr></thead>
            <tbody>
              {savedRows.length === 0 && <tr><td colSpan={6} className="empty">No estimates saved yet</td></tr>}
              {savedRows.map(est => (
                <tr key={est.id}>
                  <td data-label="Date">{est.date}</td>
                  <td data-label="Site"><b>{est.siteName}</b></td>
                  <td data-label="Owner">{est.ownerName || "—"}</td>
                  <td data-label="Construction Area">{est.constructionArea ? `${est.constructionArea} sqft` : "—"}</td>
                  <td data-label="Grand Total"><b>{fmtMoney(est.grandTotal)}</b></td>
                  <td data-label="">
                    <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewing(est)}>View</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => downloadPdf(est)}>PDF</button>
                      <button
                        className="btn btn-ghost btn-sm danger"
                        onClick={() => { if (confirm("Delete this saved estimate?")) { remove("estimates", est.id); toast("Deleted", "ok"); } }}
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <Modal title={`Estimate — ${viewing.siteName}`} onClose={() => setViewing(null)} wide>
          <div className="grid cols-2" style={{ marginBottom: 14 }}>
            <div><p className="muted">Owner</p><p style={{ fontWeight: 700 }}>{viewing.ownerName || "—"}</p></div>
            <div><p className="muted">Date</p><p style={{ fontWeight: 700 }}>{viewing.date}</p></div>
            <div><p className="muted">Plot Area</p><p style={{ fontWeight: 700 }}>{viewing.plotArea ? `${viewing.plotArea} sqft` : "—"}</p></div>
            <div><p className="muted">Construction Area</p><p style={{ fontWeight: 700 }}>{viewing.constructionArea ? `${viewing.constructionArea} sqft` : "—"}</p></div>
          </div>
          <div className="duelist"><span>Construction ({viewing.constructionArea || 0} sqft @ {fmtMoney(viewing.constructionRate)})</span><span className="amt">{fmtMoney(viewing.constructionCost)}</span></div>
          <div className="duelist"><span>Compound Wall ({viewing.compoundLength || 0} ft @ {fmtMoney(viewing.compoundRate)})</span><span className="amt">{fmtMoney(viewing.compoundCost)}</span></div>
          <div className="duelist"><span>Plastering ({viewing.plasterArea || 0} sqft @ {fmtMoney(viewing.plasterRate)})</span><span className="amt">{fmtMoney(viewing.plasterCost)}</span></div>
          <div className="duelist"><span>Additional</span><span className="amt">{fmtMoney(viewing.additional)}</span></div>
          <div className="duelist"><span>Subtotal</span><span className="amt">{fmtMoney(viewing.subtotal)}</span></div>
          <div className="duelist"><span>Margin ({viewing.marginPercent}%)</span><span className="amt">{fmtMoney(viewing.profit)}</span></div>
          <div className="duelist" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <span style={{ fontWeight: 700 }}>Grand Total</span>
            <span style={{ fontWeight: 800, fontSize: 17, color: "var(--brick)" }}>{fmtMoney(viewing.grandTotal)}</span>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => window.print()}>🖨 Print</button>
            <button className="btn btn-primary" onClick={() => downloadPdf(viewing)}>📄 Download PDF</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
