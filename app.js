const REFRESH_MS = 10000;
let lastHash = '';

const $ = id => document.getElementById(id);

const num = value => {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : String(value);
};

const safe = value => String(value ?? '—').replace(/[&<>"']/g, ch => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[ch]));

function isStoppageRemark(text) {
  const lower = String(text || '').toLowerCase();
  return ['waiting','stopped','stop','delay','breakdown','refuse','standby',
    'repair','maintenance','problem','issue','shortage','no stock']
    .some(word => lower.includes(word));
}

function monthlyNumber(value) {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function formatMonthly(value) {
  const n = monthlyNumber(value);
  return n === null ? '—' : n.toLocaleString('en-US');
}

function render(d) {
  const updated = d.updated_at ? new Date(d.updated_at) : new Date();
  $('syncText').textContent = 'LIVE • UPDATED ' + updated.toLocaleTimeString('en-PH', {
    hour12:false, hour:'2-digit', minute:'2-digit'
  });
  $('refreshSec').textContent = (REFRESH_MS / 1000) + 's';

  const rows = Array.isArray(d.berths) ? d.berths : [];
  $('berthGrid').innerHTML = rows.map(x => {
    const progress = Math.max(0, Math.min(100, (Number(x.progress) || 0) * 100));
    const vacant = String(x.vessel || '').toUpperCase() === 'VACANT';
    const status = [x.status, x.remarks].filter(v =>
      v && !['-','0','#N/A'].includes(String(v).trim())
    ).join(' / ') || '-';
    const alert = isStoppageRemark(status) ? 'stoppage-alert' : '';
    return `
      <div class="berth-row ${vacant ? 'vacant' : ''}">
        <span><b>${safe(x.berth)}</b></span>
        <span class="vessel">${safe(x.vessel || '—')}</span>
        <span>${safe(x.voyage || '-')}</span>
        <span>${num(x.booking)}</span>
        <span>${num(x.dispatch)}</span>
        <span>${num(x.loaded)}</span>
        <span>${num(x.balance)}</span>
        <span>
          <div class="progress-wrap">
            <div class="bar"><i style="width:${progress}%"></i></div>
            ${progress > 0 ? progress.toFixed(0) + '%' : '0%'}
          </div>
        </span>
        <span>${num(x.stockpile)}</span>
        <span>${safe(x.time || '00:00')}</span>
        <span class="remark ${alert}">${safe(status)}</span>
        <span>${safe(x.equipment || '0')}</span>
        <span class="activity">${safe(x.activity_time || '00:00')}</span>
      </div>`;
  }).join('');

  const total = d.total || {};
  $('totalBooking').textContent = num(total.booking);
  $('totalDispatch').textContent = num(total.dispatch);
  $('totalLoaded').textContent = num(total.loaded);
  $('totalBalance').textContent = num(total.balance);
  $('totalProgress').textContent = ((Number(total.progress) || 0) * 100).toFixed(0) + '%';
  $('totalStockpile').textContent = num(total.stockpile);

  // Monthly cement hauling production by client
  const trucking = Array.isArray(d.trucking) ? d.trucking : [];
  const truckingTotal = trucking.reduce((sum, x) => sum + (Number(x.monthly) || 0), 0);
  $('trucking').innerHTML = trucking.map(x => `
    <div class="tr">
      <b>${safe(x.hauler)}</b>
      <span>${num(x.monthly)}</span>
    </div>`).join('') + `
    <div class="tr total-row"><b>Total</b><span><b>${num(truckingTotal)}</b></span></div>`;

  // Vessel cement loading by month. 2025 is intentionally blank because
  // the newly supplied sheet contains 2026 values only.
  const monthly = Array.isArray(d.monthly) ? d.monthly : [];
  const monthlyTotal = d.monthly_total || {};
  let monthlyHTML = '';
  monthly.forEach(x => {
    const y25 = monthlyNumber(x.y2025);
    const y26 = monthlyNumber(x.y2026);
    const variance = (y25 === null || y26 === null) ? null : y26 - y25;
    const varianceClass = variance === null ? 'monthly-var-zero' :
      variance > 0 ? 'monthly-var-positive' :
      variance < 0 ? 'monthly-var-negative' : 'monthly-var-zero';
    const varianceText = variance === null ? '—' :
      variance > 0 ? '+' + variance.toLocaleString('en-US') :
      variance < 0 ? '-' + Math.abs(variance).toLocaleString('en-US') : '0';
    monthlyHTML += `
      <div class="monthly-row">
        <div class="monthly-month">${safe(x.month)}</div>
        <div class="monthly-2025">${formatMonthly(x.y2025)}</div>
        <div class="monthly-variance ${varianceClass}"><span class="variance-value">${varianceText}</span></div>
        <div class="monthly-2026">${formatMonthly(x.y2026)}</div>
      </div>`;
  });
  const total25 = monthlyNumber(monthlyTotal.y2025);
  const total26 = monthlyNumber(monthlyTotal.y2026);
  const totalVar = total25 === null || total26 === null ? null : total26 - total25;
  monthlyHTML += `
    <div class="monthly-row monthly-total">
      <div class="monthly-month">TOTAL</div>
      <div class="monthly-2025">${formatMonthly(monthlyTotal.y2025)}</div>
      <div class="monthly-variance ${totalVar === null ? 'monthly-var-zero' : totalVar > 0 ? 'monthly-var-positive' : totalVar < 0 ? 'monthly-var-negative' : 'monthly-var-zero'}">
        <span class="variance-value">${totalVar === null ? '—' : totalVar > 0 ? '+' + totalVar.toLocaleString('en-US') : totalVar < 0 ? '-' + Math.abs(totalVar).toLocaleString('en-US') : '0'}</span>
      </div>
      <div class="monthly-2026">${formatMonthly(monthlyTotal.y2026)}</div>
    </div>`;
  $('monthly').innerHTML = monthlyHTML;

  // Cement hauling daily production
  const haulingDaily = Array.isArray(d.hauling_daily) ? d.hauling_daily : [];
  const haulingTotal = haulingDaily.reduce((sum, x) => sum + (Number(x.volume) || 0), 0);
  const haulingHTML = `
    <div class="prod-subtitle">CEMENT HAULING DAILY PRODUCTION</div>
    ${haulingDaily.map(x => `<div class="prod-row"><span>${safe(x.client)}</span><b>${num(x.volume)}</b></div>`).join('')}
    <div class="prod-row total-row"><span>Total</span><b>${num(haulingTotal)}</b></div>`;
  const prodData = Array.isArray(d.daily_production) ? d.daily_production : [];
  const prodTotal = prodData.reduce((sum, x) => sum + (Number(x.qty) || 0), 0);
  const cementHTML = `
    <div class="prod-subtitle">CEMENT LOADING DAILY PRODUCTION</div>
    ${prodData.map(x => `<div class="prod-row"><span>${safe(x.shift)}</span><b>${num(x.qty)}</b></div>`).join('')}
    <div class="prod-row total-row"><span>Total</span><b>${num(prodTotal)}</b></div>`;
  $('dailyProduction').innerHTML = haulingHTML + cementHTML;

  // Stockpile by client
  const stockpile = Array.isArray(d.trucking_stockpile) ? d.trucking_stockpile : [];
  const stockTotal = stockpile.reduce((sum, x) => sum + (Number(x.volume) || 0), 0);
  $('truckingStockpile').innerHTML = stockpile.map(x => `
    <div class="prod-row"><span>${safe(x.client)}</span><b>${num(x.volume)}</b></div>
  `).join('') + `<div class="prod-row total-row"><span>Total</span><b>${num(stockTotal)}</b></div>`;

  const status = d.status || {};
  $('supervisor').textContent = status.supervisor || '--';
  $('checker').textContent = status.checker || '--';
  $('pmc').textContent = status.pmc || '--';
  $('cranes').textContent = status.cranes ?? '--';
  $('forklifts').textContent = status.forklifts ?? '--';
  $('stevedores').textContent = status.stevedores ?? '--';

  if (typeof window.updateHistoryFromDashboard === 'function') {
    window.updateHistoryFromDashboard();
  }
}

async function load() {
  try {
    const response = await fetch('data.json?t=' + Date.now(), {cache:'no-store'});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    const hash = JSON.stringify(data);
    if (hash !== lastHash) {
      lastHash = hash;
      render(data);
    }
  } catch (error) {
    $('syncText').textContent = 'ONLINE / WAITING FOR DATA';
    console.error('Dashboard data load failed:', error);
  }
}

function clock() {
  const now = new Date();
  $('phDate').textContent = now.toLocaleDateString('en-PH', {
    weekday:'short', year:'numeric', month:'short', day:'2-digit'
  });
  $('phTime').textContent = now.toLocaleTimeString('en-PH', {hour12:false});
}

clock();
setInterval(clock, 1000);
load();
setInterval(load, REFRESH_MS);
