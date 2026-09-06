const REFRESH_MS = 10000;
let lastHash = '';
const $ = id => document.getElementById(id);
const num = v => (v === undefined || v === null || v === 0 || v === '-') ? (v === 0 ? '0' : (v || '—')) : Number(v).toLocaleString('en-US');

function formatActivityTime(val) {
  if (!val || val === '0:00' || val === '-') return '0:00';
  return val;
}

function isStoppageRemark(text) {
  if (!text || text === '-' || text.trim() === '') return false;
  const cleanText = text.toLowerCase().trim();
  const keywords = ['stop', 'stopped', 'waiting', 'delay', 'breakdown', 'refuse', 'standby', 'repair', 'maintenance', 'problem', 'issue', 'shortage', 'no stock'];
  return keywords.some(keyword => cleanText.includes(keyword));
}

function render(d) {
  $('syncText').textContent = 'LIVE • UPDATED ' + new Date(d.updated_at).toLocaleTimeString('en-PH', { hour12: false });
  $('refreshSec').textContent = (REFRESH_MS / 1000) + 's';

  // Berths
  const rows = d.berths || [];
  $('berthGrid').innerHTML = rows.map(x => {
    let p = Math.max(0, Math.min(100, (x.progress || 0) * 100));
    let vacant = String(x.vessel || '').toUpperCase() === 'VACANT';
    let remarkAlert = isStoppageRemark(x.remarks) ? 'stoppage-alert' : '';
    return `<div class="berth-row ${vacant ? 'vacant' : ''}">
      <span><b>${x.berth}</b></span>
      <span class="vessel">${x.vessel || '—'}</span>
      <span>${x.voyage || '-'}</span>
      <span>${num(x.booking)}</span>
      <span>${num(x.dispatch)}</span>
      <span>${num(x.loaded)}</span>
      <span>${num(x.balance)}</span>
      <span><div class="progress-wrap"><div class="bar"><i style="width:${p}%"></i></div>${p > 0 ? p.toFixed(0) + '%' : ''}</div></span>
      <span>${num(x.stockpile)}</span>
      <span>${x.time || '-'}</span>
      <span class="remark ${remarkAlert}">${x.remarks || '-'}</span>
      <span>${x.equipment || '0'}</span>
      <span class="activity">${formatActivityTime(x.activity_time)}</span>
    </div>`;
  }).join('');

  // Totals
  const t = d.total || {};
  $('totalBooking').textContent = num(t.booking);
  $('totalDispatch').textContent = num(t.dispatch);
  $('totalLoaded').textContent = num(t.loaded);
  $('totalBalance').textContent = num(t.balance);
  $('totalProgress').textContent = ((t.progress || 0) * 100).toFixed(0) + '%';
  $('totalStockpile').textContent = num(t.stockpile);

  // Alpha Berths (R1, R2, R3)
  $('alphaRows').innerHTML = (d.alpha || []).map(x => {
    let pVal = parseFloat(String(x.progress).replace('%', '')) || 0;
    let remarkAlert = isStoppageRemark(x.remarks) ? 'stoppage-alert' : '';
    return `<div class="alpha-row">
      <span><b>${x.berth}</b></span>
      <span class="vessel">${x.vessel}</span>
      <span>${x.materials || '-'}</span>
      <span>${x.discharge || '0%'}</span>
      <span>${x.balance || '0%'}</span>
      <span><div class="progress-wrap"><div class="bar"><i style="width:${pVal}%"></i></div>${x.progress}</div></span>
      <span>${x.time || '0:00'}</span>
      <span class="remark ${remarkAlert}">${x.remarks || '-'}</span>
      <span>${x.equip || '0'}</span>
      <span class="activity">${formatActivityTime(x.activity_time)}</span>
    </div>`;
  }).join('');

  // Foreign Berth (Berth F)
  const f = d.foreign || {};
  let fPVal = parseFloat(String(f.progress || '0').replace('%', '')) || 0;
  let fRemarkAlert = isStoppageRemark(f.remarks) ? 'stoppage-alert' : '';
  $('foreignRow').innerHTML = `
    <span><b>${f.berth}</b></span>
    <span class="vessel">${f.vessel}</span>
    <span>${f.materials || '-'}</span>
    <span>${f.discharge || '-'}</span>
    <span>${f.balance || '-'}</span>
    <span><div class="progress-wrap"><div class="bar"><i style="width:${fPVal}%"></i></div>${f.progress || '-'}</div></span>
    <span>${f.time || '-'}</span>
    <span class="remark ${fRemarkAlert}">${f.remarks || '-'}</span>
    <span>${f.equip || '0'}</span>
    <span class="activity">${formatActivityTime(f.activity_time)}</span>
  `;

  // Trucking (with Variance column)
  const truckData = d.trucking || [];
  const truckTotal = truckData.reduce((acc, curr) => ({
    august: acc.august + (typeof curr.august === 'number' ? curr.august : 0),
    september: acc.september + (typeof curr.september === 'number' ? curr.september : 0),
    daily: acc.daily + (typeof curr.daily === 'number' ? curr.daily : 0)
  }), { august: 0, september: 0, daily: 0 });

  $('trucking').innerHTML = truckData.map(x => {
    let aug = typeof x.august === 'number' ? x.august : 0;
    let sep = typeof x.september === 'number' ? x.september : 0;
    let diff = sep - aug;
    let diffStr = diff > 0 ? '+' + num(diff) : num(diff);
    return `<div class="tr"><b>${x.hauler}</b><span>${num(x.august)}</span><span>${num(x.september)}</span><span>${diffStr}</span><span>${num(x.daily)}</span></div>`;
  }).join('') + `<div class="tr total-row"><b>Total</b><span><b>${num(truckTotal.august)}</b></span><span><b>${num(truckTotal.september)}</b></span><span><b>${num(truckTotal.september - truckTotal.august)}</b></span><span><b>${num(truckTotal.daily)}</b></span></div>`;

  // Monthly Table (with Variance column)
  const m = d.monthly || [];
  const mt = d.monthly_total || {};
  $('monthly').innerHTML = m.map(x => {
    let y25 = typeof x.y2025 === 'number' ? x.y2025 : 0;
    let y26 = typeof x.y2026 === 'number' ? x.y2026 : 0;
    let varVal = y26 - y25;
    let varStr = varVal > 0 ? '+' + num(varVal) : num(varVal);
    return `<div>${x.month}</div><div>${num(x.y2025)}</div><div>${num(x.y2026)}</div><div style="color:${varVal >= 0 ? '#65b83f' : '#ff3030'}">${varStr}</div>`;
  }).join('') + `<div class="mh">Total</div><div style="font-weight:bold;background:#1a1a1a">${num(mt.y2025)}</div><div style="font-weight:bold;background:#1a1a1a">${num(mt.y2026)}</div><div style="font-weight:bold;background:#1a1a1a;color:${(mt.y2026 - mt.y2025) >= 0 ? '#65b83f' : '#ff3030'}">${num(mt.y2026 - mt.y2025)}</div>`;

  // Daily Production
  const prodData = d.daily_production || [];
  const prodTotal = prodData.reduce((sum, curr) => sum + (typeof curr.qty === 'number' ? curr.qty : 0), 0);
  $('dailyProduction').innerHTML = prodData.map(x => `
    <div class="prod-row"><span>${x.shift}</span><b>${num(x.qty)}</b></div>
  `).join('') + `<div class="prod-row total-row"><span>Total</span><b>${num(prodTotal)}</b></div>`;

  // Trucking Stockpile
  const stockData = d.trucking_stockpile || [];
  const stockTotal = stockData.reduce((sum, curr) => sum + (typeof curr.volume === 'number' ? curr.volume : 0), 0);
  $('truckingStockpile').innerHTML = stockData.map(x => `
    <div class="prod-row"><span>${x.client}</span><b>${num(x.volume)}</b></div>
  `).join('') + `<div class="prod-row total-row"><span>Total</span><b>${num(stockTotal)}</b></div>`;

  // Status & Personnel
  const s = d.status || {};
  $('supervisor').textContent = s.supervisor || '--';
  $('checker').textContent = s.checker || '--';
  $('pmc').textContent = s.pmc || '--';
  $('cranes').textContent = s.cranes ?? '--';
  $('forklifts').textContent = s.forklifts ?? '--';
  $('stevedores').textContent = s.stevedores ?? '--';

  const alerts = rows.filter(x => x.remarks && x.remarks !== '-' && x.vessel !== 'VACANT').map(x => `${x.berth}: ${x.vessel} — ${x.remarks}`);
  $('tickerText').textContent = alerts.length ? alerts.join('    •    ') : 'ALL PORT OPERATIONS NORMAL';
}

async function load() {
  try {
    const r = await fetch('data.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    const h = JSON.stringify(d);
    if (h !== lastHash) {
      lastHash = h;
      render(d);
    }
  } catch (e) {
    $('syncText').textContent = 'OFFLINE / WAITING FOR DATA';
  }
}

function clock() {
  const n = new Date();
  $('phDate').textContent = n.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
  $('phTime').textContent = n.toLocaleTimeString('en-PH', { hour12: false });
}

clock();
setInterval(clock, 1000);
load();
setInterval(load, REFRESH_MS);
