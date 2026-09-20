export function pad(n) { return String(n).padStart(2, "0"); }
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function weekStartOf(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return addDays(dateStr, -d.getDay()); // Sunday start
}
export function weekEndOf(weekStart) { return addDays(weekStart, 6); }
export function fmtMoney(n) { return "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN"); }
export function fmtDateShort(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export const ROLE_LABEL = { mistri: "Mistri", labour: "Labour", centring: "Centring", other: "Other" };
export const ROLE_DEFAULT_RATE = { mistri: 700, labour: 500, centring: 600, other: 500 };

export function dailyWageFor(lab, status) {
  const rate = Number(lab?.rate) || ROLE_DEFAULT_RATE[lab?.role] || 500;
  if (status === "full") return rate;
  if (status === "half") return rate / 2;
  return 0;
}

export function commissionRate(data) {
  const s = data.settings.find(x => x.id === "app");
  return (s && s.commissionRate != null) ? Number(s.commissionRate) : 100;
}
export function commissionFor(status, rate) {
  if (status === "full") return rate;
  if (status === "half") return rate / 2;
  return 0;
}

export function weeklyBreakdown(data, labourerId, weekStart) {
  const weekEnd = weekEndOf(weekStart);
  const lab = data.labourers.find(l => l.id === labourerId);
  let full = 0, half = 0, absent = 0, total = 0;
  data.attendance
    .filter(a => a.labourerId === labourerId && a.date >= weekStart && a.date <= weekEnd)
    .forEach(a => {
      if (a.status === "full") full++; else if (a.status === "half") half++; else absent++;
      if (lab) total += dailyWageFor(lab, a.status);
    });
  return { full, half, absent, total };
}

export function monthTotals(data, monthKey) {
  let wages = 0, materialCost = 0, slabCost = 0, commission = 0;
  const rate = commissionRate(data);
  data.attendance.filter(a => a.date.startsWith(monthKey)).forEach(a => {
    const lab = data.labourers.find(l => l.id === a.labourerId);
    if (lab) wages += dailyWageFor(lab, a.status);
    commission += commissionFor(a.status, rate);
  });
  data.slabEntries.filter(s => s.date.startsWith(monthKey)).forEach(s => { slabCost += Number(s.amount) || 0; });
  data.materials.filter(m => m.date.startsWith(monthKey)).forEach(m => { materialCost += Number(m.cost) || 0; });
  return { wages, materialCost, slabCost, commission, total: wages + materialCost + slabCost };
}

export function bySiteMonth(data, monthKey) {
  const map = {};
  data.sites.forEach(s => { map[s.id] = { id: s.id, name: s.name, gaon: s.gaon, wages: 0, material: 0, slab: 0 }; });
  data.attendance.filter(a => a.date.startsWith(monthKey)).forEach(a => {
    const lab = data.labourers.find(l => l.id === a.labourerId);
    if (lab && map[a.siteId]) map[a.siteId].wages += dailyWageFor(lab, a.status);
  });
  data.slabEntries.filter(s => s.date.startsWith(monthKey)).forEach(s => { if (map[s.siteId]) map[s.siteId].slab += Number(s.amount) || 0; });
  data.materials.filter(m => m.date.startsWith(monthKey)).forEach(m => { if (map[m.siteId]) map[m.siteId].material += Number(m.cost) || 0; });
  return map;
}

export function periodWages(data, from, to, siteId) {
  return data.attendance
    .filter(a => a.date >= from && a.date <= to && (!siteId || a.siteId === siteId))
    .reduce((sum, a) => { const lab = data.labourers.find(l => l.id === a.labourerId); return sum + (lab ? dailyWageFor(lab, a.status) : 0); }, 0);
}
export function periodSlab(data, from, to, siteId) {
  return data.slabEntries
    .filter(s => s.date >= from && s.date <= to && (!siteId || s.siteId === siteId))
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
}
export function periodCommission(data, from, to, siteId) {
  const rate = commissionRate(data);
  return data.attendance
    .filter(a => a.date >= from && a.date <= to && (!siteId || a.siteId === siteId))
    .reduce((sum, a) => sum + commissionFor(a.status, rate), 0);
}

export function weeklyAdvance(data, labourerId, weekStart) {
  const weekEnd = weekEndOf(weekStart);
  return (data.advances || [])
    .filter(a => a.labourerId === labourerId && a.date >= weekStart && a.date <= weekEnd)
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
}

export function outstandingAdvance(data, labourerId) {
  // Total advance ever given minus total ever settled/deducted — simple running balance.
  return (data.advances || [])
    .filter(a => a.labourerId === labourerId)
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
}

export function totalOutstandingAdvances(data) {
  return (data.advances || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
}

export function whatsappWeekSummary(data, weekStart) {
  const weekEnd = weekEndOf(weekStart);
  const activeLabs = data.labourers.filter(l => l.active !== false);
  const lines = [`*Vansh Construction — Weekly Payment*`, `${fmtDateShort(weekStart)} – ${fmtDateShort(weekEnd)}`, ""];
  let grandTotal = 0;
  activeLabs.forEach(l => {
    const wb = weeklyBreakdown(data, l.id, weekStart);
    if (wb.full + wb.half + wb.absent === 0) return;
    const adv = weeklyAdvance(data, l.id, weekStart);
    const net = wb.total - adv;
    grandTotal += net;
    lines.push(`${l.name} (${ROLE_LABEL[l.role] || l.role}): ${wb.full}F ${wb.half}H = ${fmtMoney(wb.total)}${adv ? ` − advance ${fmtMoney(adv)}` : ""} = *${fmtMoney(net)}*`);
  });
  lines.push("", `*Total Payable: ${fmtMoney(grandTotal)}*`);
  return lines.join("\n");
}

export function siteTotals(data, siteId) {
  let wages = 0, slab = 0, material = 0;
  data.attendance.filter(a => a.siteId === siteId).forEach(a => {
    const lab = data.labourers.find(l => l.id === a.labourerId);
    if (lab) wages += dailyWageFor(lab, a.status);
  });
  data.slabEntries.filter(s => s.siteId === siteId).forEach(s => { slab += Number(s.amount) || 0; });
  data.materials.filter(m => m.siteId === siteId).forEach(m => { material += Number(m.cost) || 0; });
  return { wages, slab, material, total: wages + slab + material };
}

export function siteAttendanceDays(data, siteId) {
  const map = {};
  data.attendance.filter(a => a.siteId === siteId).forEach(a => {
    if (!map[a.date]) map[a.date] = { date: a.date, workers: 0, wage: 0 };
    const lab = data.labourers.find(l => l.id === a.labourerId);
    if (lab && a.status !== "absent") map[a.date].workers += 1;
    if (lab) map[a.date].wage += dailyWageFor(lab, a.status);
  });
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}

export function labourerWeeksList(data, labourerId) {
  const weeks = new Set();
  data.attendance.filter(a => a.labourerId === labourerId).forEach(a => weeks.add(weekStartOf(a.date)));
  (data.advances || []).filter(a => a.labourerId === labourerId).forEach(a => weeks.add(weekStartOf(a.date)));
  return Array.from(weeks).sort((a, b) => b.localeCompare(a));
}

export function labourerAllTimeEarnings(data, labourerId) {
  const lab = data.labourers.find(l => l.id === labourerId);
  if (!lab) return 0;
  return data.attendance.filter(a => a.labourerId === labourerId).reduce((sum, a) => sum + dailyWageFor(lab, a.status), 0);
}

export function monthAttendanceMap(data, labourerId, monthKey) {
  const map = {};
  data.attendance.filter(a => a.labourerId === labourerId && a.date.startsWith(monthKey)).forEach(a => { map[a.date] = a.status; });
  return map;
}

export function last6MonthsWages(data) {
  const out = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const mt = monthTotals(data, key);
    out.push({ key, label: d.toLocaleDateString("en-IN", { month: "short" }), total: mt.total, wages: mt.wages });
  }
  return out;
}

export function absenteeStreaks(data, minStreak = 3) {
  // Labourers absent (or unmarked) for the last `minStreak`+ working days recorded.
  const activeLabs = data.labourers.filter(l => l.active !== false);
  const dates = Array.from(new Set(data.attendance.map(a => a.date))).sort().reverse().slice(0, 10);
  const flagged = [];
  activeLabs.forEach(l => {
    let streak = 0;
    for (const d of dates) {
      const a = data.attendance.find(x => x.labourerId === l.id && x.date === d);
      if (a && a.status === "absent") streak++;
      else break;
    }
    if (streak >= minStreak) flagged.push({ lab: l, streak });
  });
  return flagged;
}

export function dailyTotalsForMonth(data, monthKey) {
  const map = {};
  data.attendance.filter(a => a.date.startsWith(monthKey)).forEach(a => {
    const lab = data.labourers.find(l => l.id === a.labourerId);
    if (!lab) return;
    if (!map[a.date]) map[a.date] = { wage: 0, workers: 0 };
    map[a.date].wage += dailyWageFor(lab, a.status);
    if (a.status !== "absent") map[a.date].workers += 1;
  });
  data.slabEntries.filter(s => s.date.startsWith(monthKey)).forEach(s => {
    if (!map[s.date]) map[s.date] = { wage: 0, workers: 0 };
    map[s.date].wage += Number(s.amount) || 0;
  });
  return map;
}

