"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";

export default function Header({ onMenuClick, dark, onToggleDark }) {
  const [clock, setClock] = useState("");
  const { data } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
        " · " +
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const query = q.trim().toLowerCase();
  const labResults = query ? data.labourers.filter(l => l.name?.toLowerCase().includes(query)).slice(0, 5) : [];
  const siteResults = query ? data.sites.filter(s => s.name?.toLowerCase().includes(query) || (s.gaon || "").toLowerCase().includes(query)).slice(0, 5) : [];
  const hasResults = labResults.length > 0 || siteResults.length > 0;

  function goTo(href) {
    setQ(""); setOpen(false);
    router.push(href);
  }

  return (
    <header className="topbar">
      <button className="hamburger" onClick={onMenuClick} aria-label="Menu">☰</button>
      <div className="topbar-title">Vansh Construction</div>

      <div className="gsearch-wrap" ref={boxRef}>
        <span className="gsearch-icon">🔍</span>
        <input
          className="gsearch-input"
          placeholder="Search labourer or site…"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && query && (
          <div className="gsearch-results">
            {!hasResults && <div className="gsearch-item">No matches for &ldquo;{q}&rdquo;</div>}
            {labResults.map(l => (
              <a key={l.id} className="gsearch-item" href="#" onClick={e => { e.preventDefault(); goTo(`/labourers/${l.id}`); }}>
                <span className="gsearch-tag">Labourer</span> {l.name}
              </a>
            ))}
            {siteResults.map(s => (
              <a key={s.id} className="gsearch-item" href="#" onClick={e => { e.preventDefault(); goTo(`/sites/${s.id}`); }}>
                <span className="gsearch-tag">Site</span> {s.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <span className="clock">{clock}</span>
        <button className="theme-toggle" onClick={onToggleDark} title="Toggle theme" aria-label="Toggle theme">
          {dark ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}
