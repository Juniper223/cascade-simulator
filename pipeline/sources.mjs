// Measures Cascade can refresh automatically from official, free sources.
// Each fetch() returns the full history as [{ date: 'YYYY-MM-DD', value }]
// so the measure can be scored against its own past.
import { get, parseCsv, onsMonth, dmy, monthName, dayMonth, threeMonths, signed } from './lib.mjs';

// ONS dates rolling three-month series by the middle month but labels them
// "2026 MAY-JUL"; key those by the end month so dates mean "period ending".
async function ons(path) {
  const d = await get(`https://www.ons.gov.uk/${path}/data`, { as: 'json' });
  return d.months.filter(m => m.value !== '').map(m => {
    const range = m.label.match(/^(\d{4}) ([A-Z]{3})-([A-Z]{3})$/);
    if (!range) return { date: onsMonth(m.date), value: +m.value };
    const start = onsMonth(`${range[1]} ${range[2]}`), end = onsMonth(`${range[1]} ${range[3]}`);
    const year = end < start ? +range[1] + 1 : +range[1];
    return { date: onsMonth(`${year} ${range[3]}`), value: +m.value };
  });
}

async function fred(id) {
  const rows = parseCsv(await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=1990-01-01`));
  return rows.slice(1).filter(r => r[1] && r[1] !== '.').map(r => ({ date: r[0], value: +r[1] }));
}

const pts = (a, b, dp = 1, unit = ' pt') => {
  const d = +(a - b).toFixed(dp);
  return d === 0 ? 'unchanged' : signed(d, dp) + unit;
};

export const SOURCES = [
  {
    id: 'uk-unemployment', chapterId: 'work', label: 'UK unemployment', unit: 'of workforce',
    source: 'Office for National Statistics', sourceUrl: 'https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms',
    badness: v => v,
    fetch: () => ons('employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms'),
    reading: v => v.toFixed(1) + '%', period: threeMonths, delta: (a, b) => pts(a, b),
  },
  {
    id: 'uk-real-wages', chapterId: 'work', label: 'UK real pay', unit: 'regular pay, year on year',
    source: 'Office for National Statistics', sourceUrl: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/a2fa/lms',
    badness: v => -v,
    fetch: () => ons('employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/a2fa/lms'),
    reading: v => signed(v) + '%', period: d => threeMonths(d) + ', CPIH', delta: (a, b) => pts(a, b),
  },
  {
    id: 'uk-cpi', chapterId: 'housing', label: 'UK inflation', unit: 'CPI, year on year',
    source: 'Office for National Statistics', sourceUrl: 'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23',
    // Distance from the 2% target: deflation is a stress too.
    badness: v => Math.abs(v - 2),
    fetch: () => ons('economy/inflationandpriceindices/timeseries/d7g7/mm23'),
    reading: v => v.toFixed(1) + '%', period: monthName, delta: (a, b) => pts(a, b),
  },
  {
    id: 'mortgage-rate', chapterId: 'housing', label: 'UK 5-year fix', unit: 'quoted rate, 75% LTV',
    source: 'Bank of England (IUMBV45)', sourceUrl: 'https://www.bankofengland.co.uk/boeapps/database/',
    badness: v => v,
    fetch: async () => {
      const url = 'https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=01/Jan/2000&Dateto=now&SeriesCodes=IUMBV45&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N';
      return parseCsv(await get(url)).slice(1).filter(r => r[1]).map(r => ({ date: dmy(r[0]), value: +r[1] }));
    },
    reading: v => v.toFixed(2) + '%', period: monthName,
    delta: (a, b) => { const d = Math.round((a - b) * 100); return d === 0 ? 'unchanged' : signed(d, 0) + ' bps'; },
  },
  {
    id: 'food-price-index', chapterId: 'environment', label: 'FAO food price', unit: 'index',
    source: 'UN Food & Agriculture Org', sourceUrl: 'https://www.fao.org/worldfoodsituation/foodpricesindex/en/',
    badness: v => v,
    fetch: async () => {
      const page = await get('https://www.fao.org/worldfoodsituation/foodpricesindex/en/');
      const link = page.match(/https?:\/\/[^"']*food_price_indices_data[^"']*\.csv[^"']*/);
      if (!link) throw new Error('FAO CSV link not found on page');
      const rows = parseCsv(await get(link[0].replace(/&amp;/g, '&')));
      return rows.filter(r => /^\d{4}-\d{2}$/.test(r[0]) && r[1]).map(r => ({ date: r[0] + '-01', value: +r[1] }));
    },
    reading: v => v.toFixed(1), period: monthName, delta: (a, b) => pts(a, b, 1, ' pts'),
  },
  {
    id: 'climate-anomaly', chapterId: 'environment', label: 'Global temperature', unit: 'vs. 1951–80',
    source: 'NASA GISTEMP', sourceUrl: 'https://data.giss.nasa.gov/gistemp/',
    badness: v => v,
    fetch: async () => {
      const rows = parseCsv(await get('https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv'));
      const out = [];
      for (const r of rows) if (/^\d{4}$/.test(r[0])) for (let m = 1; m <= 12; m++) {
        if (r[m] && !r[m].includes('*')) out.push({ date: `${r[0]}-${String(m).padStart(2, '0')}-01`, value: +r[m] });
      }
      return out;
    },
    reading: v => signed(v, 2) + '°C', period: monthName,
    delta: (a, b) => { const d = +(a - b).toFixed(2); return d === 0 ? 'unchanged' : signed(d, 2) + '°C'; },
  },
  {
    id: 'brent-crude', chapterId: 'geopolitics', label: 'Brent crude', unit: 'spot, per barrel',
    source: 'EIA via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/DCOILBRENTEU',
    badness: v => v,
    fetch: () => fred('DCOILBRENTEU'),
    reading: v => '$' + v.toFixed(2), period: dayMonth,
    delta: (a, b) => { const d = +(a - b).toFixed(2); return d === 0 ? 'unchanged' : (d > 0 ? '+$' : '−$') + Math.abs(d).toFixed(2); },
  },
  {
    id: 'uk-diesel', chapterId: 'geopolitics', label: 'UK diesel', unit: 'per litre',
    source: 'DESNZ weekly road fuel prices', sourceUrl: 'https://www.gov.uk/government/statistics/weekly-road-fuel-prices',
    badness: v => v,
    fetch: async () => {
      const meta = await get('https://www.gov.uk/api/content/government/statistics/weekly-road-fuel-prices', { as: 'json' });
      const csvs = meta.details.attachments.filter(a => a.content_type === 'text/csv');
      if (!csvs.length) throw new Error('No CSV attachments on fuel page');
      const out = [];
      for (const a of csvs) for (const r of parseCsv(await get(a.url))) {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(r[0]) && r[2]) out.push({ date: dmy(r[0]), value: +r[2] });
      }
      return out.sort((x, y) => x.date.localeCompare(y.date));
    },
    reading: v => v.toFixed(1) + 'p', period: dayMonth, delta: (a, b) => pts(a, b, 1, 'p'),
  },
  {
    id: 'consumer-mood', chapterId: 'outcomes', label: 'U.S. consumer mood', unit: 'U-Mich index', outcome: true,
    source: 'University of Michigan via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/UMCSENT',
    badness: v => -v,
    fetch: () => fred('UMCSENT'),
    reading: v => v.toFixed(1), period: monthName, delta: (a, b) => pts(a, b),
  },
];

// When each observation becomes public: [monthly?, days after period end].
// Used to ask "what was known on the last issue's date" for fair deltas.
const RELEASE = {
  'uk-unemployment': [true, 46], 'uk-real-wages': [true, 46], 'uk-cpi': [true, 18],
  'mortgage-rate': [true, 30], 'food-price-index': [true, 7], 'climate-anomaly': [true, 12],
  'brent-crude': [false, 7], 'uk-diesel': [false, 2], 'consumer-mood': [true, 0],
};
for (const s of SOURCES) [s.monthly, s.lagDays] = RELEASE[s.id];
