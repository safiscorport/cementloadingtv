const REFRESH_MS = 10000;
let lastHash = '';

const $ = id => document.getElementById(id);

const num = v =>
  (v === undefined || v === null || v === 0 || v === '-')
    ? (v === 0 ? '0' : (v || '—'))
    : Number(v).toLocaleString('en-US');AWDAWDAWD


function formatActivityTime(val) {
  if (!val || val === '0:00' || val === '-') return '0:00';
  return val;
}


function isStoppageRemark(text) {
  if (!text || text === '-') return false;

  const lower = text.toLowerCase();

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
   SAFE NUMBER CONVERTER FOR 2026
   Handles:
   1212345
   "1212345"
   "1,212,345"
   ========================================================= */

function liveNumber(value) {

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const n = Number(
    String(value)
      .replace(/,/g, '')
      .replace(/₱/g, '')
      .trim()
  );

  return Number.isFinite(n) ? n : 0;
}


/* =========================================================
   SEND 2026 DATA TO DASHBOARD 2
   ========================================================= */

function update2026Bridge(d) {

  try {

    const monthly =
      Array.isArray(d.monthly)
        ? d.monthly
        : [];


    /* -----------------------------------------------------
       Store all 2026 monthly values
       ----------------------------------------------------- */

    const monthly2026 =
      monthly.map(row => ({

        month: row.month,

        value: liveNumber(
          row.y2026
        )

      }));


    /* -----------------------------------------------------
       Calculate live 2026 total
       ----------------------------------------------------- */

    const calculatedTotal =
      monthly2026.reduce(
        (total, row) =>
          total + row.value,
        0
      );


    /* -----------------------------------------------------
       Check monthly_total.y2026
       ----------------------------------------------------- */

    const suppliedTotal =
      d.monthly_total
        ? liveNumber(
            d.monthly_total.y2026
          )
        : 0;


    /*
     * Use monthly_total when available.
     * Otherwise calculate from monthly rows.
     */

    const total2026 =
      suppliedTotal > 0
        ? suppliedTotal
        : calculatedTotal;


    /* -----------------------------------------------------
       GLOBAL VALUES
       ----------------------------------------------------- */

    window.CEMENT_2026_TOTAL =
      total2026;

    window.cement2026Total =
      total2026;

    window.historical2026Total =
      total2026;

    window.CEMENT_2026_MONTHLY =
      monthly2026;


    /* -----------------------------------------------------
       Notify Dashboard 2
       ----------------------------------------------------- */

    if (
      typeof window.updateHistoryFromDashboard ===
      'function'
    ) {

      window.updateHistoryFromDashboard();

    }


    /*
     * Also send an event.
     * Dashboard 2 can listen for this event.
     */

    window.dispatchEvent(
      new CustomEvent(
        'cement2026Updated',
        {
          detail: {
            total: total2026,
            monthly: monthly2026
          }
        }
      )
    );


    /* -----------------------------------------------------
       DEBUG
       ----------------------------------------------------- */

    console.log(
      '[Dashboard 1] 2026 Total:',
      total2026
    );

    console.log(
      '[Dashboard 1] 2026 Monthly:',
      monthly2026
    );

  } catch (error) {

    /*
     * IMPORTANT:
     * Do not allow the bridge to break Dashboard 1.
     */

    console.warn(
      '[Dashboard 1] 2026 bridge error:',
      error
    );

  }

}


function render(d) {

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

          <span class="
