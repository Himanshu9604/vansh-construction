"use client";
import { useRef, useState } from "react";
import { useApp } from "@/lib/AppContext";
import StatCard from "@/components/StatCard";

const COLLECTIONS = ["sites", "labourers", "attendance", "slabEntries", "materials", "payments", "advances"];

export default function BackupPage() {
  const { data, add, toast, firebaseReady } = useApp();
  const [restoring, setRestoring] = useState(false);
  const fileRef = useRef(null);

  const totalRecords = COLLECTIONS.reduce((s, c) => s + (data[c]?.length || 0), 0);

  function downloadBackup() {
    const payload = { exportedAt: new Date().toISOString(), app: "Vansh Construction", data: {} };
    COLLECTIONS.forEach(c => { payload.data[c] = data[c] || []; });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vansh-construction-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Backup downloaded", "ok");
  }

  async function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("This will ADD every record from the backup file into your current data (it won't delete anything existing). Continue?")) {
      e.target.value = "";
      return;
    }
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = parsed.data || parsed;
      let count = 0;
      for (const col of COLLECTIONS) {
        const rows = incoming[col];
        if (!Array.isArray(rows)) continue;
        for (const row of rows) {
          const { id, ...rest } = row;
          await add(col, rest);
          count++;
        }
      }
      toast(`Restored ${count} records from backup`, "ok");
    } catch (err) {
      toast("Could not read that file — is it a valid backup JSON?", "err");
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  }

  return (
    <div className="page-anim">
      <p className="section-title">Backup & Data Safety</p>
      <p className="section-sub">Your data auto-saves to the cloud as you work — this page is for extra peace of mind: a downloadable copy you keep for yourself.</p>

      {!firebaseReady && (
        <div className="banner-warn" style={{ margin: "0 0 16px" }}>
          Firebase isn&apos;t connected yet, so nothing is being saved right now — set up your .env.local first.
        </div>
      )}

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <StatCard royal label="Total Records Stored" numeric={totalRecords} />
        <StatCard label="Sites" numeric={data.sites?.length || 0} />
        <StatCard label="Labourers" numeric={data.labourers?.length || 0} />
      </div>

      <div className="card accent">
        <p className="section-title" style={{ fontSize: 15 }}>⬇ Download a Full Backup</p>
        <p className="section-sub">Saves every site, labourer, attendance record, payment, advance and material entry into one JSON file on your device.</p>
        <button className="btn btn-gold" onClick={downloadBackup}>Download Backup (JSON)</button>
      </div>

      <div className="card">
        <p className="section-title" style={{ fontSize: 15 }}>⬆ Restore From a Backup File</p>
        <p className="section-sub">
          Choose a previously downloaded backup file. Records are <b>added</b> to what you already have —
          this won&apos;t delete or overwrite anything, so avoid restoring the same file twice or you&apos;ll get duplicates.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={handleRestoreFile}
          disabled={restoring}
          style={{ maxWidth: 360 }}
        />
        {restoring && <p className="muted" style={{ marginTop: 10 }}>Restoring… please don&apos;t close this tab.</p>}
      </div>
    </div>
  );
}
