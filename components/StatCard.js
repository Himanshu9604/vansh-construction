"use client";
import { useEffect, useRef, useState } from "react";

/**
 * StatCard — backward compatible with <StatCard label value royal />.
 * Pass `numeric` (a plain number) + optional `prefix`/`suffix` instead of a
 * pre-formatted `value` string to get an animated count-up effect.
 */
export default function StatCard({ label, value, royal, numeric, prefix = "", suffix = "", icon }) {
  const isCountUp = typeof numeric === "number" && !Number.isNaN(numeric);
  const [display, setDisplay] = useState(isCountUp ? 0 : null);
  const raf = useRef(null);

  useEffect(() => {
    if (!isCountUp) return;
    const start = performance.now();
    const from = 0;
    const dur = 650;
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (numeric - from) * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric]);

  return (
    <div className={`stat ${royal ? "royal" : ""}`}>
      <div className="flex-between" style={{ alignItems: "flex-start" }}>
        <div className="lbl">{label}</div>
        {icon && <span style={{ fontSize: 15, opacity: 0.7 }}>{icon}</span>}
      </div>
      <div className="val">
        {isCountUp ? (
          <span className="countup">{prefix}{display.toLocaleString("en-IN")}{suffix}</span>
        ) : value}
      </div>
    </div>
  );
}
