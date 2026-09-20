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
      <div className="sidebar-foot">विश्वासाने बांधलेलं · Built on trust, brick by brick</div>    </aside>
  );
}

import React, { useId } from "react";

export function LogoMark({ size = 44 }) {
  const uid = useId();

  const gold = `gold-${uid}`;
  const dark = `dark-${uid}`;
  const shadow = `shadow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Vansh Construction"
    >
      <defs>
        {/* Rich Metallic Gold */}
        <linearGradient
          id={gold}
          x1="15%"
          y1="0%"
          x2="85%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#8F681B" />
          <stop offset="18%" stopColor="#F9E59A" />
          <stop offset="38%" stopColor="#D4AF37" />
          <stop offset="55%" stopColor="#FFF0A6" />
          <stop offset="75%" stopColor="#C39525" />
          <stop offset="100%" stopColor="#7A5410" />
        </linearGradient>

        {/* Premium Burgundy / Black */}
        <linearGradient
          id={dark}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#050505" />
          <stop offset="50%" stopColor="#16090D" />
          <stop offset="100%" stopColor="#3B0B19" />
        </linearGradient>

        {/* Depth */}
        <filter
          id={shadow}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="2.5"
            floodColor="#000000"
            floodOpacity="0.75"
          />
        </filter>
      </defs>

      {/* =========================
          OUTER CREST
      ========================== */}

      <path
        d="
          M50 3
          L91 15
          L91 58
          C91 76 74 90 50 97
          C26 90 9 76 9 58
          L9 15
          Z
        "
        fill={`url(#${dark})`}
        stroke={`url(#${gold})`}
        strokeWidth="2.2"
        filter={`url(#${shadow})`}
      />

      {/* Inner Crest Border */}
      <path
        d="
          M50 8
          L85 19
          L85 57
          C85 72 70 84 50 91
          C30 84 15 72 15 57
          L15 19
          Z
        "
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="0.8"
        opacity="0.85"
      />

      {/* =========================
          ARCHITECTURAL ROOF
      ========================== */}

      <path
        d="M26 37 L50 18 L74 37"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="2.8"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Roof Inner Line */}
      <path
        d="M32 37 L50 23 L68 37"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="0.9"
        opacity="0.7"
      />

      {/* Small Roof Peak */}
      <path
        d="M47 21 L50 17 L53 21"
        fill={`url(#${gold})`}
      />

      {/* =========================
          VC MONOGRAM
      ========================== */}

      {/* V */}
      <path
        d="
          M28 40
          L38 62
          L46 46
        "
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* C */}
      <path
        d="
          M69 43
          C66 40 62 39 59 40
          C53 41 50 46 50 52
          C50 58 54 63 60 64
          C64 64 67 62 70 59
        "
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="4"
        strokeLinecap="square"
      />

      {/* =========================
          ARCHITECTURAL BASE
      ========================== */}

      <line
        x1="26"
        y1="68"
        x2="74"
        y2="68"
        stroke={`url(#${gold})`}
        strokeWidth="1.4"
      />

      <line
        x1="33"
        y1="71.5"
        x2="67"
        y2="71.5"
        stroke={`url(#${gold})`}
        strokeWidth="0.7"
        opacity="0.65"
      />

      {/* =========================
          BRAND NAME
      ========================== */}

      <text
        x="50"
        y="78"
        textAnchor="middle"
        fill={`url(#${gold})`}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="5.3"
        fontWeight="700"
        letterSpacing="2.1"
      >
        VANSH
      </text>

      <text
        x="50"
        y="84"
        textAnchor="middle"
        fill="#D4AF37"
        fontFamily="Arial, sans-serif"
        fontSize="2.8"
        fontWeight="600"
        letterSpacing="1.5"
        opacity="0.85"
      >
        CONSTRUCTION
      </text>

      {/* =========================
          GOLD ORNAMENT
      ========================== */}

      <circle
        cx="50"
        cy="12"
        r="1.5"
        fill={`url(#${gold})`}
      />

      <circle
        cx="50"
        cy="88"
        r="1"
        fill={`url(#${gold})`}
      />
    </svg>
  );
}
