
/* =========================================================
   SAFISCOR PORT OPERATIONS DASHBOARD
   COMPLETE APP.JS
   AUTOMATIC SMART TV FIT VERSION

   TARGET:
   - 1920 x 1080 Smart TV
   - 43-inch kiosk display
   - Automatic resolution scaling
   - No overlapping dashboard sections
   - Refit after every data refresh
   - Monthly December row preserved
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const REFRESH_MS = 10000;

let lastHash = '';

const TV_FIT = {
  frameId: 'dashboardFitFrame',
  appSelector: '.app',
  minScale: 0.45,
  maxScale: 1
};

let fitScheduled = false;
let lastFitScale = 1;

const $ = id => document.getElementById(id);


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

const num = v =>
  (
    v === undefined ||
    v === null ||
    v === 0 ||
    v === '-'
  )
    ? (v === 0 ? '0' : (v || '—'))
    : Number(v).toLocaleString('en-US');


function formatActivityTime(val) {

  if (!val || val === '0:00' || val === '-') {
    return '0:00';
  }

  return val;

}


/* =========================================================
   SAFE TEXT
   ========================================================= */

function safeText(value, fallback = '—') {

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback;
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


/* =========================================================
   STOPPAGE REMARKS
   ========================================================= */

function isStoppageRemark(text) {

  if (!text || text === '-') {
    return false;
  }

  const lower = String(text).toLowerCase();

  return (
    lower.includes('waiting') ||
    lower.includes('stopped') ||
    lower.includes('stop') ||
    lower.includes('delay') ||
    lower.includes('breakdown') ||
    lower.includes('refuse') ||
    lower.includes('standby') ||
    lower.includes('repair') ||
    lower.includes('maintenance') ||
    lower.includes('problem') ||
    lower.includes('issue') ||
    lower.includes('shortage') ||
    lower.includes('no stock')
  );

}


/* =========================================================
   MONTHLY NUMBER HELPERS
   ========================================================= */

function monthlyNumber(v) {

  if (
    v === undefined ||
    v === null ||
    v === '' ||
    v === '-'
  ) {
    return 0;
  }

  const n = Number(
    String(v).replace(/,/g, '')
  );

  return Number.isFinite(n) ? n : 0;

}


function monthlyFormat(v) {

  if (
    v === undefined ||
    v === null ||
    v === '' ||
    v === '-'
  ) {
    return '—';
  }

  return monthlyNumber(v).toLocaleString('en-US');

}


function monthlyVarianceClass(v) {

  if (v > 0) {
    return 'monthly-var-positive';
  }

  if (v < 0) {
    return 'monthly-var-negative';
  }

  return 'monthly-var-zero';

}


function monthlyVarianceText(v) {

  if (v > 0) {
    return '+' + Math.abs(v).toLocaleString('en-US');
  }

  if (v < 0) {
    return '-' + Math.abs(v).toLocaleString('en-US');
  }

  return '0';

}


/* =========================================================
   PROGRESS HELPERS
   ========================================================= */

function progressValue(value) {

  const p = parseFloat(
    String(value ?? '0').replace('%', '')
  ) || 0;

  return Math.max(0, Math.min(100, p));

}


function progressHTML(value) {

  const p = progressValue(value);

  return `
    <div class="progress-wrap">
      <div class="bar">
        <i style="width:${p}%"></i>
      </div>
      <span>${p > 0 ? p.toFixed(0) + '%' : ''}</span>
    </div>
  `;

}


/* =========================================================
   AUTOMATIC TV FIT CONTROLLER
   ========================================================= */

function fitDashboard() {

  const frame = document.getElementById(
    TV_FIT.frameId
  );

  if (!frame) {
    return;
  }

  const app = frame.querySelector(
    TV_FIT.appSelector
  );

  if (!app) {
    return;
  }

  const frameWidth = frame.clientWidth;
  const frameHeight = frame.clientHeight;

  if (!frameWidth || !frameHeight) {
    return;
  }

  /* Reset previous scaling. */

  app.style.setProperty(
    'transform',
    'none',
    'important'
  );

  app.style.setProperty(
    'width',
    frameWidth + 'px',
    'important'
  );

  app.style.setProperty(
    'height',
    'auto',
    'important'
  );

  app.style.setProperty(
    'max-height',
    'none',
    'important'
  );

  let scale = 1;

  /* Measure natural dashboard dimensions. */

  for (let i = 0; i < 4; i++) {

    const contentHeight = Math.max(
      app.scrollHeight,
      app.offsetHeight
    );

    const contentWidth = Math.max(
      app.scrollWidth,
      frameWidth
    );

    const scaleX = frameWidth / contentWidth;

    const scaleY =
      frameHeight / Math.max(contentHeight, 1);

    scale = Math.min(
      TV_FIT.maxScale,
      scaleX,
      scaleY
    );

    scale = Math.max(
      TV_FIT.minScale,
      scale
    );

    app.style.setProperty(
      'width',
      (frameWidth / scale) + 'px',
      'important'
    );

  }

  /* Final dimensions. */

  const finalHeight = Math.max(
    app.scrollHeight,
    app.offsetHeight
  );

  const finalWidth = Math.max(
    app.scrollWidth,
    frameWidth
  );

  scale = Math.min(
    TV_FIT.maxScale,
    frameWidth / finalWidth,
    frameHeight / Math.max(finalHeight, 1)
  );

  scale = Math.max(
    TV_FIT.minScale,
    scale
  );

  app.style.setProperty(
    'width',
    (frameWidth / scale) + 'px',
    'important'
  );

  app.style.setProperty(
    'transform-origin',
    'top left',
    'important'
  );

  app.style.setProperty(
    'transform',
    `scale(${scale})`,
    'important'
  );

  lastFitScale = scale;

  frame.scrollTop = 0;
  frame.scrollLeft = 0;

  console.log(
    'SAFISCOR TV FIT:',
    {
      resolution:
        frameWidth + ' x ' + frameHeight,

      scale:
        (scale * 100).toFixed(1) + '%'
    }
  );

}


/* =========================================================
   SCHEDULE AUTOMATIC FITTING
   ========================================================= */

function scheduleDashboardFit() {

  if (fitScheduled) {
    return;
  }

  fitScheduled = true;

  requestAnimationFrame(() => {

    requestAnimationFrame(() => {

      fitDashboard();

      fitScheduled = false;

    });

  });

}


/* =========================================================
   RESOLUTION CHANGE DETECTION
   ========================================================= */

window.addEventListener(
  'resize',
  scheduleDashboardFit
);

window.addEventListener(
  'orientationchange',
  scheduleDashboardFit
);

if (window.visualViewport) {

  window.visualViewport.addEventListener(
    'resize',
    scheduleDashboardFit
  );

}


if (document.fonts && document.fonts.ready) {

  document.fonts.ready.then(
    scheduleDashboardFit
  );

}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function render(d) {


  /* =======================================================
     LIVE STATUS
     ======================================================= */

  if ($('syncText')) {

    $('syncText').textContent =
      'LIVE • UPDATED ' +
      new Date(d.updated_at).toLocaleTimeString(
        'en-PH',
        {
          hour12: false
        }
      );

  }

  if ($('refreshSec')) {

    $('refreshSec').textContent =
      (REFRESH_MS / 1000) + 's';

  }


  /* =======================================================
     MAIN BERTH TABLE
     ======================================================= */

  const rows = d.berths || [];

  if ($('berthGrid')) {

    $('berthGrid').innerHTML =

      rows.map(x => {

        const p = progressValue(
          (x.progress || 0) * 100
        );

        const vacant =
          String(x.vessel || '')
            .toUpperCase() === 'VACANT';

        const remarkAlert =
          isStoppageRemark(x.remarks)
            ? 'stoppage-alert'
            : '';

        return `

          <div class="berth-row ${vacant ? 'vacant' : ''}">

            <span>
              <b>${safeText(x.berth)}</b>
            </span>

            <span class="vessel">
              ${safeText(x.vessel)}
            </span>

            <span>
              ${safeText(x.voyage, '-')}
            </span>

            <span>
              ${num(x.booking)}
            </span>

            <span>
              ${num(x.dispatch)}
            </span>

            <span>
              ${num(x.loaded)}
            </span>

            <span>
              ${num(x.balance)}
            </span>

            <span>
              ${progressHTML(p)}
            </span>

            <span>
              ${num(x.stockpile)}
            </span>

            <span>
              ${safeText(x.time, '-')}
            </span>

            <span class="remark ${remarkAlert}">
              ${safeText(x.remarks, '-')}
            </span>

            <span>
              ${safeText(x.equipment, '0')}
            </span>

            <span class="activity">
              ${safeText(formatActivityTime(x.activity_time))}
            </span>

          </div>

        `;

      }).join('');

  }


  /* =======================================================
     TOTALS
     ======================================================= */

  const t = d.total || {};

  const totalFields = {

    totalBooking: num(t.booking),

    totalDispatch: num(t.dispatch),

    totalLoaded: num(t.loaded),

    totalBalance: num(t.balance),

    totalProgress:
      ((t.progress || 0) * 100).toFixed(0) + '%',

    totalStockpile: num(t.stockpile)

  };

  Object.entries(totalFields).forEach(
    ([id, value]) => {

      if ($(id)) {
        $(id).textContent = value;
      }

    }
  );


  /* =======================================================
     ALPHA BERTHS
     R1 / R2 / R3
     ======================================================= */

  if ($('alphaRows')) {

    $('alphaRows').innerHTML =

      (d.alpha || []).map(x => {

        const p = progressValue(x.progress);

        const remarkAlert =
          isStoppageRemark(x.remarks)
            ? 'stoppage-alert'
            : '';

        return `

          <div class="alpha-row">

            <span>
              <b>${safeText(x.berth)}</b>
            </span>

            <span class="vessel">
              ${safeText(x.vessel)}
            </span>

            <span>
              ${safeText(x.materials, '-')}
            </span>

            <span>
              ${safeText(x.discharge, '0%')}
            </span>

            <span>
              ${safeText(x.balance, '0%')}
            </span>

            <span>
              ${progressHTML(p)}
            </span>

            <span>
              ${safeText(x.time, '0:00')}
            </span>

            <span class="remark ${remarkAlert}">
              ${safeText(x.remarks, '-')}
            </span>

            <span>
              ${safeText(x.equip, '0')}
            </span>

            <span class="activity">
              ${safeText(formatActivityTime(x.activity_time))}
            </span>

          </div>

        `;

      }).join('');

  }


  /* =======================================================
     FOREIGN BERTH
     BERTH F
     ======================================================= */

  const f = d.foreign || {};

  if ($('foreignRow')) {

    const fRemarkAlert =
      isStoppageRemark(f.remarks)
        ? 'stoppage-alert'
        : '';

    $('foreignRow').innerHTML = `

      <span>
        <b>${safeText(f.berth)}</b>
      </span>

      <span class="vessel">
        ${safeText(f.vessel)}
      </span>

      <span>
        ${safeText(f.materials, '-')}
      </span>

      <span>
        ${safeText(f.discharge, '-')}
      </span>

      <span>
        ${safeText(f.balance, '-')}
      </span>

      <span>
        ${progressHTML(f.progress)}
      </span>

      <span>
        ${safeText(f.time, '-')}
      </span>

      <span class="remark ${fRemarkAlert}">
        ${safeText(f.remarks, '-')}
      </span>

      <span>
        ${safeText(f.equip, '0')}
      </span>

      <span class="activity">
        ${safeText(formatActivityTime(f.activity_time))}
      </span>

    `;

  }


  /* =======================================================
     ANCHORAGE
     ======================================================= */

  const anchorage = d.anchorage || {};

  const anchorageRow = $('anchorageRow');

  if (anchorageRow) {

    const anchorageRemarkAlert =
      isStoppageRemark(anchorage.remarks)
        ? 'stoppage-alert'
        : '';

    anchorageRow.innerHTML = `

      <span>
        <b>${safeText(anchorage.berth, 'ANCHORAGE')}</b>
      </span>

      <span class="vessel">
        ${safeText(anchorage.vessel)}
      </span>

      <span>
        ${safeText(anchorage.materials, '-')}
      </span>

      <span>
        ${safeText(anchorage.discharge, '-')}
      </span>

      <span>
        ${safeText(anchorage.balance, '-')}
      </span>

      <span>
        ${progressHTML(anchorage.progress)}
      </span>

      <span>
        ${safeText(anchorage.time, '-')}
      </span>

      <span class="remark ${anchorageRemarkAlert}">
        ${safeText(anchorage.remarks, '-')}
      </span>

      <span>
        ${safeText(anchorage.equip, '0')}
      </span>

      <span class="activity">
        ${safeText(formatActivityTime(anchorage.activity_time))}
      </span>

    `;

  }


  /* =======================================================
     TRUCKING
     ======================================================= */

  const truckData = d.trucking || [];

  const truckTotal = truckData.reduce(
    (acc, curr) => ({

      august:
        acc.august +
        monthlyNumber(curr.August),

      september:
        acc.september +
        monthlyNumber(curr.September),

      daily:
        acc.daily +
        monthlyNumber(curr.daily)

    }),
    {
      august: 0,
      september: 0,
      daily: 0
    }
  );


  if ($('trucking')) {

    $('trucking').innerHTML =

      truckData.map(x => `

        <div class="tr">

          <b>
            ${safeText(x.hauler)}
          </b>

          <span>
            ${num(x.August)}
          </span>

          <span>
            ${num(x.September)}
          </span>

          <span>
            ${num(x.daily)}
          </span>

        </div>

      `).join('')

      +

      `

        <div class="tr total-row">

          <b>Total</b>

          <span>
            <b>${num(truckTotal.august)}</b>
          </span>

          <span>
            <b>${num(truckTotal.september)}</b>
          </span>

          <span>
            <b>${num(truckTotal.daily)}</b>
          </span>

        </div>

      `;

  }


  /* =======================================================
     MONTHLY VESSEL CEMENT LOADING
     2025 | VARIANCE | 2026
     ======================================================= */

  const m = d.monthly || [];

  const mt = d.monthly_total || {};

  let monthlyHTML = '';

  m.forEach(x => {

    const y2025 = monthlyNumber(x.y2025);

    const y2026 = monthlyNumber(x.y2026);

    const variance = y2026 - y2025;

    monthlyHTML += `

      <div class="monthly-row">

        <div class="monthly-month">
          ${safeText(x.month)}
        </div>

        <div class="monthly-2025">
          ${monthlyFormat(x.y2025)}
        </div>

        <div class="
          monthly-variance
          ${monthlyVarianceClass(variance)}
        ">

          <span class="variance-value">
            ${monthlyVarianceText(variance)}
          </span>

        </div>

        <div class="monthly-2026">
          ${monthlyFormat(x.y2026)}
        </div>

      </div>

    `;

  });


  /* =======================================================
     MONTHLY TOTAL
     ======================================================= */

  const total2025 = monthlyNumber(mt.y2025);

  const total2026 = monthlyNumber(mt.y2026);

  const totalVariance = total2026 - total2025;

  monthlyHTML += `

    <div class="monthly-row monthly-total">

      <div class="monthly-month">
        TOTAL
      </div>

      <div class="monthly-2025">
        ${monthlyFormat(mt.y2025)}
      </div>

      <div class="
        monthly-variance
        ${monthlyVarianceClass(totalVariance)}
      ">

        <span class="variance-value">
          ${monthlyVarianceText(totalVariance)}
        </span>

      </div>

      <div class="monthly-2026">
        ${monthlyFormat(mt.y2026)}
      </div>

    </div>

  `;


  if ($('monthly')) {
    $('monthly').innerHTML = monthlyHTML;
  }


  /* =======================================================
     DAILY PRODUCTION
     ======================================================= */

  const prodData = d.daily_production || [];

  const prodTotal = prodData.reduce(
    (sum, curr) =>
      sum + monthlyNumber(curr.qty),
    0
  );


  if ($('dailyProduction')) {

    $('dailyProduction').innerHTML =

      prodData.map(x => `

        <div class="prod-row">

          <span>
            ${safeText(x.shift)}
          </span>

          <b>
            ${num(x.qty)}
          </b>

        </div>

      `).join('')

      +

      `

        <div class="prod-row total-row">

          <span>Total</span>

          <b>${num(prodTotal)}</b>

        </div>

      `;

  }


  /* =======================================================
     TRUCKING STOCKPILE
     ======================================================= */

  const stockData = d.trucking_stockpile || [];

  const stockTotal = stockData.reduce(
    (sum, curr) =>
      sum + monthlyNumber(curr.volume),
    0
  );


  if ($('truckingStockpile')) {

    $('truckingStockpile').innerHTML =

      stockData.map(x => `

        <div class="prod-row">

          <span>
            ${safeText(x.client)}
          </span>

          <b>
            ${num(x.volume)}
          </b>

        </div>

      `).join('')

      +

      `

        <div class="prod-row total-row">

          <span>Total</span>

          <b>${num(stockTotal)}</b>

        </div>

      `;

  }


  /* =======================================================
     STATUS AND PERSONNEL
     ======================================================= */

  const s = d.status || {};

  const statusFields = {

    supervisor: s.supervisor || '--',

    checker: s.checker || '--',

    pmc: s.pmc || '--',

    cranes: s.cranes ?? '--',

    forklifts: s.forklifts ?? '--',

    stevedores: s.stevedores ?? '--'

  };

  Object.entries(statusFields).forEach(
    ([id, value]) => {

      if ($(id)) {
        $(id).textContent = value;
      }

    }
  );


  /* =======================================================
     TICKER AND ALERTS
     ======================================================= */

  const alerts = rows

    .filter(
      x =>
        x.remarks &&
        x.remarks !== '-' &&
        x.vessel !== 'VACANT'
    )

    .map(
      x =>
        `${x.berth}: ${x.vessel} — ${x.remarks}`
    );


  if (
    anchorage.vessel &&
    anchorage.vessel !== 'VACANT' &&
    anchorage.remarks &&
    anchorage.remarks !== '-'
  ) {

    alerts.push(
      `ANCHORAGE: ${anchorage.vessel} — ${anchorage.remarks}`
    );

  }


  if ($('tickerText')) {

    $('tickerText').textContent =
      alerts.length
        ? alerts.join('    •    ')
        : 'ALL PORT OPERATIONS NORMAL';

  }


  /* =======================================================
     REFIT AFTER ALL DYNAMIC CONTENT IS RENDERED
     ======================================================= */

  scheduleDashboardFit();

}


/* =========================================================
   LOAD DATA.JSON
   ========================================================= */

async function load() {

  try {

    const r = await fetch(
      'data.json?t=' + Date.now(),
      {
        cache: 'no-store'
      }
    );

    if (!r.ok) {
      throw new Error(r.status);
    }

    const d = await r.json();

    const h = JSON.stringify(d);

    if (h !== lastHash) {

      render(d);

      lastHash = h;

      scheduleDashboardFit();

    }

  }

  catch (e) {

    if ($('syncText')) {

      $('syncText').textContent =
        'ONLINE / WAITING FOR DATA';

    }

    console.error(
      'SAFISCOR DATA ERROR:',
      e
    );

  }

}


/* =========================================================
   PHILIPPINE CLOCK
   ========================================================= */

function clock() {

  const n = new Date();

  if ($('phDate')) {

    $('phDate').textContent =
      n.toLocaleDateString(
        'en-PH',
        {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }
      );

  }

  if ($('phTime')) {

    $('phTime').textContent =
      n.toLocaleTimeString(
        'en-PH',
        {
          hour12: false
        }
      );

  }

}


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

clock();

setInterval(
  clock,
  1000
);

load();

setInterval(
  load,
  REFRESH_MS
);


/* =========================================================
   INITIAL FIT
   ========================================================= */

scheduleDashboardFit();

window.addEventListener(
  'load',
  scheduleDashboardFit
);


/* =========================================================
   OPTIONAL: OBSERVE DASHBOARD CONTENT CHANGES
   ========================================================= */

if (window.ResizeObserver) {

  const observer = new ResizeObserver(() => {

    scheduleDashboardFit();

  });

  window.addEventListener(
    'load',
    () => {

      const frame = document.getElementById(
        TV_FIT.frameId
      );

      if (frame) {
        observer.observe(frame);
      }

    },
    { once: true }
  );

}


/* =========================================================
   END OF SAFISCOR APP.JS
   ========================================================= */
