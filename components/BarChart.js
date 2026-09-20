"use client";

// Simple, dependency-free bar chart. data: [{ label, total }]
export default function BarChart({ data, valueFmt = (v) => v, height = 160 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.total), 1);
  const barW = 100 / data.length;

  return (
    <div className="barchart-wrap">
      <svg viewBox={`0 0 ${data.length * 60} ${height + 30}`} style={{ width: "100%", minWidth: data.length * 50, height: height + 30 }}>
        {data.map((d, i) => {
          const h = (d.total / max) * height;
          const x = i * 60 + 10;
          return (
            <g key={i} className="barchart-bar">
              <rect
                x={x} y={height - h + 10} width={40} height={Math.max(h, 2)} rx={6}
                fill="url(#barGradient)"
              />
              <text x={x + 20} y={height + 26} textAnchor="middle" fontSize="11" fill="var(--ink-soft)">{d.label}</text>
              <text x={x + 20} y={height - h + 2} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">
                {valueFmt(d.total)}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#7A1830" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
