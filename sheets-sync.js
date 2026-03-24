// Google Sheets Sync Module
// Syncs budget data to/from a Google Sheets spreadsheet via an Apps Script Web App.
// See google-apps-script.js for the script to deploy in your Google Sheet.

const SHEETS_URL_KEY = 'sheetsScriptUrl';
const LAST_SYNC_KEY = 'sheetsLastSync';

let _pushDebounceTimer = null;

// ── Storage ──────────────────────────────────────────────────────────────────

function getSheetsUrl() {
    return localStorage.getItem(SHEETS_URL_KEY) || '';
}

function setSheetsUrl(url) {
    localStorage.setItem(SHEETS_URL_KEY, url.trim());
}

// ── Push (local → sheet) ─────────────────────────────────────────────────────

// Call after every saveData(); debounced so rapid taps don't flood the sheet.
function schedulePush() {
    if (!getSheetsUrl()) return;
    clearTimeout(_pushDebounceTimer);
    _pushDebounceTimer = setTimeout(_doPush, 4000);
}

async function _doPush() {
    const url = getSheetsUrl();
    if (!url) return;

    _setSyncStatus('syncing');
    try {
        const payload = JSON.stringify(getFilteredDataForSync());
        // No Content-Type header → browser sends text/plain → no CORS preflight needed.
        const res = await fetch(url, { method: 'POST', body: payload });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        localStorage.setItem(LAST_SYNC_KEY, Date.now());
        _setSyncStatus('ok');
    } catch (e) {
        console.warn('[sheets-sync] push failed:', e);
        _setSyncStatus('error');
    }
}

// ── Pull (sheet → local) ─────────────────────────────────────────────────────

// Called on startup (silent) and from the manual Pull button.
async function pullFromSheets(silent) {
    const url = getSheetsUrl();
    if (!url) return;

    _setSyncStatus('syncing');
    try {
        const res = await fetch(url + '?action=get');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const imported = await res.json();

        if (
            typeof imported.bills === 'number' &&
            typeof imported.specials === 'number' &&
            typeof imported.daily === 'number' &&
            Array.isArray(imported.expenses)
        ) {
            mergeData(imported);
            saveData();
            render();
            localStorage.setItem(LAST_SYNC_KEY, Date.now());
            _setSyncStatus('ok');
            if (!silent) showToast('Synced from Google Sheets', '#10b981');
        } else {
            throw new Error('Unexpected response shape');
        }
    } catch (e) {
        console.warn('[sheets-sync] pull failed:', e);
        _setSyncStatus('error');
        if (!silent) showToast('Sheets sync failed — check the URL', '#ef4444');
    }
}

// ── Status UI ────────────────────────────────────────────────────────────────

function _setSyncStatus(status) {
    const el = document.getElementById('sheetsSyncStatus');
    if (!el) return;

    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    const timeStr = lastSync
        ? new Date(Number(lastSync)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    const map = {
        ok:      { text: '✓ Synced' + (timeStr ? ' ' + timeStr : ''), cls: 'sync-ok' },
        syncing: { text: '↻ Syncing…',                                  cls: 'sync-ing' },
        error:   { text: '✗ Sync failed',                               cls: 'sync-err' },
        idle:    { text: timeStr ? 'Last sync ' + timeStr : '',         cls: '' }
    };
    const s = map[status] || map.idle;
    el.textContent = s.text;
    el.className = 'sheets-sync-status ' + s.cls;
}

function refreshSyncStatus() {
    _setSyncStatus('idle');
}

// Expose to global scope (app.js and onclick handlers use these)
window.schedulePush    = schedulePush;
window.pullFromSheets  = pullFromSheets;
window.getSheetsUrl    = getSheetsUrl;
window.setSheetsUrl    = setSheetsUrl;
window.refreshSyncStatus = refreshSyncStatus;
