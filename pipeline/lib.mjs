// Shared helpers for the Cascade data pipeline. Node 22+, no dependencies.

const UA = 'CascadeAlmanac/1.0 (+https://cascade-simulator.pages.dev)';

export async function get(url, { tries = 3, as = 'text' } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return as === 'json' ? await res.json() : await res.text();
    } catch (e) {
      last = e;
      await new Promise(r => setTimeout(r, 1500 * 2 ** i));
    }
  }
  throw last;
}

export function parseCsv(text) {
  return text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim()).map(l => l.split(','));
}

const MONTHS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ONS monthly timeseries: "2026 AUG" -> "2026-08-01"
export function onsMonth(label) {
  const [y, m] = label.trim().split(/\s+/);
  return `${y}-${MONTHS[m.toUpperCase()]}-01`;
}

// "31 Aug 2026" or "28/09/2026" -> ISO date
export function dmy(s) {
  s = s.trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2}) (\w{3}) (\d{4})$/);
  if (m) return `${m[3]}-${MONTHS[m[2].toUpperCase()]}-${m[1].padStart(2, '0')}`;
  throw new Error('Unrecognised date ' + s);
}

export const monthName = iso => MON_LONG[+iso.slice(5, 7) - 1];
export const dayMonth = iso => `${+iso.slice(8, 10)} ${MON_SHORT[+iso.slice(5, 7) - 1]}`;
// Three-month window ending in the given month: "May–Jul"
export function threeMonths(iso) {
  const m = +iso.slice(5, 7) - 1;
  return `${MON_SHORT[(m + 10) % 12]}–${MON_SHORT[m]}`;
}

// Latest observation on or before a date.
export function asOf(series, iso) {
  let hit = null;
  for (const p of series) if (p.date <= iso) hit = p;
  return hit;
}

// Severity 0-100: where a reading sits within the measure's own history
// over the preceding `years` (default 20). 100 = worst ever seen in the
// window. `badness` maps a raw value to "higher is worse".
export function severity(series, point, badness, years = 20) {
  const from = String(+point.date.slice(0, 4) - years) + point.date.slice(4);
  const window = series.filter(p => p.date > from && p.date <= point.date).map(p => badness(p.value));
  if (window.length < 12) throw new Error('Not enough history to score');
  const b = badness(point.value);
  const below = window.filter(x => x < b).length;
  const equal = window.filter(x => x === b).length;
  return Math.round(((below + equal / 2) / window.length) * 100);
}

export const signed = (n, dp = 1) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toFixed(dp);

// Latest observation that had been published by a given date.
export function knownOn(series, iso, { monthly, lagDays }) {
  const published = p => {
    const d = new Date((monthly ? p.date.slice(0, 7) + '-01' : p.date) + 'T00:00:00Z');
    if (monthly) { d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); }
    d.setUTCDate(d.getUTCDate() + lagDays);
    return d.toISOString().slice(0, 10);
  };
  let hit = null;
  for (const p of series) if (published(p) <= iso) hit = p;
  return hit;
}
