const REFRESH_MS = 10000;
let lastHash = '';

const $ = id => document.getElementById(id);


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

const num = v => {

  if (
    v === undefined ||
    v === null ||
    v === 0 ||
    v === '-'
  ) {
    return v === 0 ? '0' : (v || '—');
  }

  return Number(v).toLocaleString('en-US');

};


/* =========================================================
   LIVE NUMBER PARSER
   Handles:
   1218702
   "1218702"
   "1,218,702"
   " 1,218,702 "
   ========================================================= */

function parseLiveNumber(value) {

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 0;
  }

  if (typeof value === 'number') {

    return Number.isFinite(value)
      ? value
      : 0;

  }

  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/₱/g, '')
    .replace(/\s/g, '')
    .trim();

  const n = Number(cleaned);

  return Number.isFinite(n)
    ? n
    : 0;

}


/* =========================================================
   ACTIVITY TIME
   ========================================================= */

function formatActivityTime(val) {

  if (
    !val ||
    val === '0:00' ||
    val === '-'
  ) {
    return '0:00';
  }

  return val;

}


/* =========================================================
   STOPPAGE REMARK DETECTION
   ========================================================= */

function isStoppageRemark(text) {

  if (
    !text ||
    text === '-'
  ) {
    return false;
  }

  const lower =
    String(text).toLowerCase();

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
   SEND 2026 DATA TO HISTORY DASHBOARD
   ========================================================= */

function send2026ToHistory(d) {

  const monthly =
    Array.isArray(d.monthly)
      ? d.monthly
      : [];


  /* -------------------------------------------------------
     Build live 2026 monthly dataset
     ------------------------------------------------------- */

  const live2026Monthly =
    monthly.map(x => ({

      month:
        x.month,

      value:
        parseLiveNumber(x.y2026)

    }));


  /* -------------------------------------------------------
     Expose monthly 2026 data globally
     ------------------------------------------------------- */

  window.CEMENT_2026_MONTHLY =
    live2026Monthly;


  /* -------------------------------------------------------
     Calculate 2026 total directly from monthly data
     
     This is the important part.
     
     It does NOT depend only on monthly_total.y2026.
     ------------------------------------------------------- */

  const calculated2026Total =
    live2026Monthly.reduce(
      (sum, item) =>
        sum + item.value,
      0
    );


  /* -------------------------------------------------------
     Also read monthly_total.y2026 if available
     ------------------------------------------------------- */

  const supplied2026Total =
    parseLiveNumber(
      d.monthly_total &&
      d.monthly_total.y2026
    );


  /* -------------------------------------------------------
     Select the live 2026 total
     
     Prefer the official monthly_total when it is
     greater than zero.
     
     Otherwise calculate it from the monthly rows.
     ------------------------------------------------------- */

  let live2026Total;

  if (supplied2026Total > 0) {

    live2026Total =
      supplied2026Total;

  } else {

    live2026Total =
      calculated2026Total;

  }


  /* -------------------------------------------------------
     Make 2026 available to Dashboard 2
     ------------------------------------------------------- */

  window.CEMENT_2026_TOTAL =
    live2026Total;


  /* -------------------------------------------------------
     Additional aliases for compatibility
     ------------------------------------------------------- */

  window.cement2026Total =
    live2026Total;

  window.historical2026Total =
    live2026Total;


  /* -------------------------------------------------------
     Debug information
     
     Open F12 → Console to see these.
     ------------------------------------------------------- */

  console.log(
    '[CEMENT] 2026 MONTHLY:',
    window.CEMENT_2026_MONTHLY
  );

  console.log(
    '[CEMENT] 2026 TOTAL:',
    window.CEMENT_2026_TOTAL
  );


  /* -------------------------------------------------------
     Notify Dashboard 2 immediately
     ------------------------------------------------------- */

  if (
    typeof window.updateHistoryFromDashboard ===
    'function'
  ) {

    window.updateHistoryFromDashboard();

  }


  /* -------------------------------------------------------
     Also send a browser event.
     
     This allows Dashboard 2 to listen for updates
     even if its history script was initialized separately.
     ------------------------------------------------------- */

  try {

    window.dispatchEvent(
      new CustomEvent(
        'cement2026Updated',
        {
          detail: {
            total:
              live2026Total,

            monthly:
              live2026Monthly
          }
        }
      )
    );

  } catch (e) {

    console.warn(
      'Unable to dispatch cement2026Updated event:',
      e
    );

  }

}


/* =========================================================
   MAIN DASHBOARD RENDER
   ========================================================= */

function render(d) {


  /* =======================================================
     SYNC STATUS
     ======================================================= */

  $('syncText').textContent =
    'LIVE • UPDATED ' +
    new Date(
      d.updated_at
    ).toLocaleTimeString(
      'en-PH',
      {
        hour12: false
      }
    );


  $('refreshSec').textContent =
    (REFRESH_MS / 1000) + 's';


  /* =======================================================
     BERTHS
     ======================================================= */

  const rows =
    d.berths || [];


  $('berthGrid').innerHTML =
    rows.map(x => {

      let p =
        Math.max(
          0,
          Math.min(
            100,
            (x.progress || 0) * 100
          )
        );


      let vacant =
        String(
          x.vessel || ''
        ).toUpperCase() === 'VACANT';


      let remarkAlert =
        isStoppageRemark(
          x.remarks
        )
          ? 'stoppage-alert'
          : '';


      return `
        <div class="berth-row ${vacant ? 'vacant' : ''}">

          <span>
            <b>${x.berth}</b>
          </span>

          <span class="vessel">
            ${x.vessel || '—'}
          </span>

          <span>
            ${x.voyage || '-'}
          </
