// Cascade data pipeline.
//
//   node pipeline/build.mjs check            fetch + score everything, print a table
//   node pipeline/build.mjs draft [date]     write the next issue's draft data into index.html
//   node pipeline/build.mjs alerts           flag big moves since the last published issue
//   node pipeline/build.mjs rescore DATE     re-score the current issue vs what was known on DATE
//   node pipeline/build.mjs snapshot         save the issue currently in index.html as published
//
// Automated measures come from pipeline/sources.mjs. Everything else lives in
// data/manual.json and is edited by hand (the report says which are stale).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, appendFileSync } from 'node:fs';
import { SOURCES } from './sources.mjs';
import { asOf, knownOn, severity } from './lib.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const HTML = ROOT + 'index.html';
const ISSUES = ROOT + 'data/issues/';
const MANUAL = ROOT + 'data/manual.json';
const STALE_DAYS = 45;
const ALERT_POINTS = 15;

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const pad = n => String(n).padStart(2, '0');
const tier = v => (v >= 80 ? 'high' : v < 65 ? 'low' : 'mid');
const clock = ms => Math.round(ms.reduce((a, m) => a + m.value, 0) / ms.length);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

// ----- index.html <-> DATA -------------------------------------------------
function readData() {
  const src = readFileSync(HTML, 'utf8');
  const start = src.indexOf('const DATA = {');
  const end = src.indexOf('\n};', start) + 3;
  const DATA = new Function(src.slice(start, end).replace('const DATA =', 'return'))();
  return { src, start, end, DATA };
}

function writeMeasures(issue, measures) {
  let out = readData().src;
  const mStart = out.indexOf('  measures: [');
  const mEnd = out.indexOf('\n  ],', mStart) + 5;
  out = out.slice(0, mStart) + '  measures: [\n' + measures.map(m => '    ' + JSON.stringify(m) + ',').join('\n') + '\n  ],' + out.slice(mEnd);
  const iStart = out.indexOf('  issue: ');
  const iEnd = out.indexOf('\n', iStart);
  out = out.slice(0, iStart) + '  issue: ' + JSON.stringify(issue) + ',' + out.slice(iEnd);
  writeFileSync(HTML, out);
}

function lastPublished() {
  mkdirSync(ISSUES, { recursive: true });
  const files = readdirSync(ISSUES).filter(f => /^issue-\d+\.json$/.test(f)).sort();
  if (!files.length) throw new Error('No published issue snapshot in data/issues/. Run: node pipeline/build.mjs snapshot');
  return readJson(ISSUES + files.at(-1));
}

// ----- fetch + score -------------------------------------------------------
// The previous reading is the exact period the last issue showed when we
// know it (observedAt), otherwise whatever had been published by its date.
async function automated(prevIssue) {
  const results = [];
  for (const s of SOURCES) {
    try {
      const series = await s.fetch();
      if (!series.length) throw new Error('empty series');
      const now = series.at(-1);
      const shown = prevIssue.measures.find(m => m.id === s.id)?.observedAt;
      const then = (shown && asOf(series, shown)) || knownOn(series, prevIssue.issue.publishedAt, s) || series[0];
      results.push({
        ok: true, s, now, then,
        measure: {
          id: s.id, chapterId: s.chapterId, label: s.label,
          value: severity(series, now, s.badness), prevValue: severity(series, then, s.badness),
          prevReading: s.reading(then.value), reading: s.reading(now.value), unit: s.unit,
          deltaText: now.date === then.date ? 'no new data' : s.delta(now.value, then.value),
          source: s.source, sourceUrl: s.sourceUrl, readingPeriod: s.period(now.date),
          observedAt: now.date, outcome: !!s.outcome, seeded: true, scoring: 'history-20y',
        },
      });
    } catch (e) {
      const old = prevIssue.measures.find(m => m.id === s.id);
      results.push({ ok: false, s, error: String(e.message || e), measure: old && { ...old, prevValue: old.value, prevReading: old.reading, deltaText: 'fetch failed, carried over' } });
    }
  }
  return results;
}

function manual(prevIssue, today) {
  const list = readJson(MANUAL).measures;
  return list.map(m => {
    const old = prevIssue.measures.find(x => x.id === m.id);
    const age = daysBetween(m.checkedAt, today);
    const { checkedAt, note, refreshDays = STALE_DAYS, ...rest } = m;
    return {
      stale: age > refreshDays, age, note,
      measure: {
        ...rest,
        prevValue: old ? old.value : m.value,
        prevReading: old ? old.reading : '',
        seeded: true, scoring: 'editor',
      },
    };
  });
}

function ordered(prevIssue, measures) {
  const idx = new Map(prevIssue.measures.map((m, i) => [m.id, i]));
  return [...measures].sort((a, b) => (idx.get(a.id) ?? 999) - (idx.get(b.id) ?? 999));
}

// ----- modes ---------------------------------------------------------------
async function check() {
  const prev = lastPublished();
  const auto = await automated(prev);
  const rows = auto.map(r => r.ok
    ? `${r.s.id.padEnd(18)} ${r.measure.reading.padStart(9)}  ${r.measure.readingPeriod.padEnd(16)} score ${String(r.measure.value).padStart(3)} (was ${r.measure.prevValue} at ${r.measure.prevReading})`
    : `${r.s.id.padEnd(18)} FAILED: ${r.error}`);
  console.log(`Compared with Issue ${pad(prev.issue.number)} (${prev.issue.publishedAt})\n` + rows.join('\n'));
  return auto;
}

async function draft(date) {
  const today = date || new Date().toISOString().slice(0, 10);
  const prev = lastPublished();
  const auto = await automated(prev);
  const man = manual(prev, today);
  const measures = ordered(prev, [...auto.filter(r => r.measure).map(r => r.measure), ...man.map(r => r.measure)]);
  const number = prev.issue.number + 1;
  const issue = { ...prev.issue, number, title: 'Draft', publishedAt: today, draft: true };
  writeMeasures(issue, measures);
  const snap = { issue, measures, clock: clock(measures), prevClock: clock(measures.map(m => ({ value: m.prevValue }))), builtAt: new Date().toISOString() };
  writeFileSync(ISSUES + `issue-${pad(number)}.draft.json`, JSON.stringify(snap, null, 2) + '\n');

  const moved = measures.map(m => ({ m, d: m.value - m.prevValue })).filter(x => x.d).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  const report = [
    `# Cascade Issue ${pad(number)} · draft data`,
    '',
    `Compared with Issue ${pad(prev.issue.number)} (${prev.issue.publishedAt}). **Clock ${snap.prevClock} → ${snap.clock}.**`,
    '',
    '## Biggest moves',
    ...moved.slice(0, 8).map(({ m, d }) => `- **${m.label}**: ${m.prevReading || '–'} → ${m.reading} (${m.deltaText}); severity ${m.prevValue} → ${m.value} (${d > 0 ? '+' : ''}${d})`),
    '',
    '## Automated sources',
    ...auto.map(r => r.ok ? `- ✅ ${r.s.label}: ${r.measure.reading}, ${r.measure.readingPeriod}` : `- ❌ ${r.s.label}: **fetch failed** (${r.error}). Last issue's value carried over.`),
    '',
    '## Hand-kept measures (data/manual.json)',
    ...man.map(r => `- ${r.stale ? '⚠️ **stale**' : '✅'} ${r.measure.label}: ${r.measure.reading} (checked ${r.age} days ago)${r.note ? ` · ${r.note}` : ''}`),
    '',
    '## Before merging',
    '- [ ] Update stale hand-kept measures in `data/manual.json`, then re-run `node pipeline/build.mjs draft`',
    '- [ ] Rewrite the prose (vigil, lede, bottom line, chapters, watch list, outlook, predictions, graces, poem) to match these numbers',
    '- [ ] Score the previous issue\'s predictions',
    '- [ ] Set the issue title, then `node pipeline/build.mjs snapshot` to record it as published',
    '- [ ] Check the Cloudflare preview for this branch',
  ].join('\n');
  writeFileSync(ROOT + 'data/REPORT.md', report + '\n');
  console.log(report);
}

async function alerts() {
  const prev = lastPublished();
  const auto = await automated(prev);
  const hits = auto.filter(r => r.ok).map(r => {
    const was = prev.measures.find(m => m.id === r.s.id);
    return { r, was };
  }).filter(({ r, was }) => was && (Math.abs(r.measure.value - was.value) >= ALERT_POINTS || tier(r.measure.value) !== tier(was.value)));
  const failed = auto.filter(r => !r.ok);
  const lines = [
    ...hits.map(({ r, was }) => `- **${r.measure.label}** is ${r.measure.reading} (${r.measure.readingPeriod}), was ${was.reading} in Issue ${pad(prev.issue.number)}. Severity ${was.value} → ${r.measure.value}.`),
    ...failed.map(r => `- ❌ ${r.s.label}: source failed (${r.error}). The fetcher may need fixing.`),
  ];
  const body = lines.length
    ? `Measures that moved sharply since Issue ${pad(prev.issue.number)} (${prev.issue.publishedAt}):\n\n${lines.join('\n')}\n\nIf this is worth a short note before the next issue, reply here or ask Claude to draft one.`
    : '';
  writeFileSync(ROOT + 'data/ALERTS.md', body);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `alert=${hits.length || failed.length ? 'true' : 'false'}\n`);
  console.log(body || 'No big moves.');
}

// Re-score the automated measures of the issue already in index.html,
// comparing with what was known on `since`. Hand-kept measures are untouched.
async function rescore(since) {
  if (!since) throw new Error('Usage: rescore YYYY-MM-DD');
  const { DATA } = readData();
  const auto = await automated({ issue: { publishedAt: since }, measures: [] });
  const failed = auto.filter(r => !r.ok);
  if (failed.length) throw new Error('Fetch failed: ' + failed.map(r => r.s.id + ' ' + r.error).join('; '));
  const byId = new Map(auto.map(r => [r.s.id, r.measure]));
  const measures = DATA.measures.map(m => byId.get(m.id) || m);
  writeMeasures(DATA.issue, measures);
  console.log(`Clock ${clock(measures.map(m => ({ value: m.prevValue })))} (as known on ${since}) → ${clock(measures)} now`);
  for (const r of auto) console.log(`  ${r.measure.label}: ${r.measure.prevReading} → ${r.measure.reading} (${r.measure.readingPeriod}); ${r.measure.prevValue} → ${r.measure.value}`);
}

function snapshot() {
  const { DATA } = readData();
  const issue = { ...DATA.issue };
  delete issue.draft;
  const snap = { issue, measures: DATA.measures, clock: clock(DATA.measures), prevClock: clock(DATA.measures.map(m => ({ value: m.prevValue }))) };
  mkdirSync(ISSUES, { recursive: true });
  const file = ISSUES + `issue-${pad(issue.number)}.json`;
  writeFileSync(file, JSON.stringify(snap, null, 2) + '\n');
  console.log('Saved ' + file.replace(ROOT, ''));
}

const [mode = 'check', arg] = process.argv.slice(2);
const run = { check, draft: () => draft(arg), alerts, snapshot, rescore: () => rescore(arg) }[mode];
if (!run) { console.error('Unknown mode ' + mode); process.exit(2); }
await run();
