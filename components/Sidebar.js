"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/sites", label: "Sites", icon: "🏗️" },
  { href: "/estimation", label: "Estimation", icon: "🧮" },
  { href: "/labourers", label: "Labourers", icon: "👷" },
  { href: "/attendance", label: "Attendance", icon: "🗓️" },
  { href: "/calendar", label: "Monthly Calendar", icon: "📆" },
  { href: "/payments", label: "Weekly Payment", icon: "💸" },
  { href: "/advances", label: "Advances (Udhar)", icon: "🤝" },
  { href: "/material", label: "Material", icon: "🧱" },
  { href: "/revenue", label: "Revenue", icon: "📈" },
  { href: "/backup", label: "Backup & Data", icon: "🗄️" },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand">
        <LogoMark />
        <div>
          <div className="sidebar-title">Vansh Construction</div>
          <div className="sidebar-sub">Nitin Dohate</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClose}
            className={`sidebar-link ${pathname === l.href ? "active" : ""}`}
          >
            <span className="sidebar-icon">{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <b>Vansh Construction</b>
        <br />
        <span>Designed by Shyam Yadav</span>
      </div>    </aside>
  );
}

export function LogoMark({ size = 38 }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F1D57B" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id="lgBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0C0908" />
          <stop offset="100%" stopColor="#4A0E1F" />
        </linearGradient>
      </defs>
      <polygon points="22,1 41,11.5 41,32.5 22,43 3,32.5 3,11.5" fill="url(#lgBg)" stroke="url(#lgGold)" strokeWidth="2" />
      <path
        d="M10 31 L10 19 L15 15 L15 31 M19.5 31 L19.5 13 L23.5 9 L23.5 31 M28 31 L28 21 L33 17 L33 31"
        stroke="url(#lgGold)" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <text x="22" y="40.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="url(#lgGold)" fontFamily="Inter,sans-serif" letterSpacing="1">VC</text>
    </svg>
  );
}
