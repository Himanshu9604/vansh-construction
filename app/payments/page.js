"use client";
import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import {
  todayStr, weekStartOf, weekEndOf, addDays, fmtMoney, fmtMoneyPdf, fmtDateShort,
  weeklyBreakdown, weeklyAdvance, periodSlab, whatsappWeekSummary, ROLE_LABEL,
} from "@/lib/calc";
import { exportTablePdf } from "@/lib/pdf";

export default function PaymentsPage() {
  const { data, add, update, toast } = useApp();
  const [weekStart, setWeekStart] = useState(weekStartOf(todayStr()));
  const weekEnd = weekEndOf(weekStart);

  const activeLabs = data.labourers.filter(l => l.active !== false);
  const rows = activeLabs.map(l => {
    const wb = weeklyBreakdown(data, l.id, weekStart);
    const advance = weeklyAdvance(data, l.id, weekStart);
    const net = wb.total - advance;
    const pay = data.payments.find(p => p.labourerId === l.id && p.weekStart === weekStart);
    return { lab: l, wb, advance, net, paid: !!(pay && pay.paid), payId: pay?.id };
  });

  const totalWages = rows.reduce((s, r) => s + r.wb.total, 0);
  const totalAdvance = rows.reduce((s, r) => s + r.advance, 0);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const totalSlab = periodSlab(data, weekStart, weekEnd);

  async function togglePaid(row) {
    const nowPaid = !row.paid;
    if (row.payId) await update("payments", row.payId, { paid: nowPaid, amount: row.net });
    else await add("payments", { labourerId: row.lab.id, weekStart, paid: nowPaid, amount: row.net });
    toast(nowPaid ? "Marked as paid" : "Marked as unpaid", "ok");
  }

  function exportPdf() {
    exportTablePdf(
      `weekly-payment-${weekStart}.pdf`,
      `Weekly Payment — ${fmtDateShort(weekStart)} to ${fmtDateShort(weekEnd)}`,
      ["Labourer", "Role", "Full", "Half", "Absent", "Gross", "Advance", "Net Payable", "Status"],
      rows.map(r => [r.lab.name, ROLE_LABEL[r.lab.role] || r.lab.role, r.wb.full, r.wb.half, r.wb.absent, fmtMoneyPdf(r.wb.total), r.advance ? fmtMoneyPdf(r.advance) : "—", fmtMoneyPdf(r.net), r.paid ? "Paid" : "Pending"]),
      `Total Net Payable: ${fmtMoneyPdf(totalNet)}${totalSlab > 0 ? ` · Plus ${fmtMoneyPdf(totalSlab)} slab/bulk payments` : ""}`
    );
  }

  function printSlip() {
    window.print();
  }

  async function copySummary() {
    const text = whatsappWeekSummary(data, weekStart);
    try {
      await navigator.clipboard.writeText(text);
      toast("Summary copied — paste it in WhatsApp", "ok");
    } catch {
      toast("Could not copy — your browser may be blocking clipboard access", "err");
    }
  }

  return (
    <div className="page-anim">
      <p className="section-title">Weekly Payment (Sunday → Sunday)</p>
      <div className="card no-print">
        <div className="week-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Previous Week</button>
          <div className="chip active">{fmtDateShort(weekStart)} – {fmtDateShort(weekEnd)}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next Week →</button>
          <button className="btn btn-gold btn-sm" style={{ marginLeft: "auto" }} onClick={copySummary}>💬 Copy WhatsApp Summary</button>
          <button className="btn btn-ghost btn-sm" onClick={printSlip}>🖨 Print Slip</button>
          <button className="btn btn-primary btn-sm" onClick={exportPdf}>📄 Export PDF</button>
        </div>
      </div>

      <div className="grid cols-3" style={{ margin: "16px 0" }}>
        <div className="stat"><div className="lbl">This Week&apos;s Wages (Attendance)</div><div className="val">{fmtMoney(totalWages)}</div></div>
        <div className="stat"><div className="lbl">Advances Deducted This Week</div><div className="val">{fmtMoney(totalAdvance)}</div></div>
        <div className="stat royal"><div className="lbl">Net Total Payable</div><div className="val">{fmtMoney(totalNet)}</div></div>
      </div>

      {totalSlab > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="section-sub" style={{ margin: 0 }}>Plus <b>{fmtMoney(totalSlab)}</b> in slab/bulk gang payments this week (tracked separately in Attendance tab).</p>
        </div>
      )}

      <div className="card">
        <div className="table-wrap scrollx">
          <table className="rtable">
            <thead><tr><th>Labourer</th><th>Attendance</th><th>Gross</th><th>Advance</th><th>Net Payable</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="empty">No labourers</td></tr>}
              {rows.map(r => (
                <tr key={r.lab.id}>
                  <td data-label="Labourer"><b>{r.lab.name}</b></td>
                  <td data-label="Attendance">{r.wb.full} full, {r.wb.half} half, {r.wb.absent} absent</td>
                  <td data-label="Gross">{fmtMoney(r.wb.total)}</td>
                  <td data-label="Advance">{r.advance > 0 ? <span className="danger">− {fmtMoney(r.advance)}</span> : "—"}</td>
                  <td data-label="Net Payable"><b>{fmtMoney(r.net)}</b></td>
                  <td data-label="Status">{r.paid ? <span className="pill pill-paid">Paid</span> : <span className="pill pill-unpaid">Pending</span>}</td>
                  <td data-label=""><button className="btn btn-ghost btn-sm" onClick={() => togglePaid(r)}>{r.paid ? "Mark Unpaid" : "Mark Paid"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
