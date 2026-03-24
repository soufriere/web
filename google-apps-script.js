/**
 * BUDGET TRACKER — Google Apps Script
 * ====================================
 * Paste this entire file into the Apps Script editor bound to your Google Sheet,
 * then deploy it as a Web App.
 *
 * SETUP STEPS
 * -----------
 * 1. Open your Google Sheet (create a new blank one if needed).
 * 2. Click Extensions → Apps Script.
 * 3. Delete any existing code and paste this entire file.
 * 4. Click Deploy → New deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Click Deploy, authorise when prompted, then copy the Web app URL.
 * 6. Open Budget Tracker → Settings, paste the URL into "Google Sheets Script URL", Save.
 *
 * The script creates two sheets automatically on first push:
 *   Config   — stores your budget amounts (bills / specials / daily)
 *   Expenses — stores every transaction as a row
 *
 * RE-DEPLOYING AFTER CHANGES
 * --------------------------
 * If you ever edit this script, use Deploy → Manage deployments → Edit (pencil icon)
 * and choose "New version" before saving — otherwise the old code stays live.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateSheet(ss, name) {
    return ss.getSheetByName(name) || ss.insertSheet(name);
}

// ── GET  (pull: sheet → app) ─────────────────────────────────────────────────

function doGet(e) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const configSheet   = getOrCreateSheet(ss, 'Config');
        const expensesSheet = getOrCreateSheet(ss, 'Expenses');

        // Read config (key | value rows)
        const config = { bills: 0, specials: 0, daily: 0 };
        const cfgRows = configSheet.getDataRange().getValues();
        cfgRows.forEach(function(row) {
            if (row[0] && config.hasOwnProperty(row[0])) {
                config[row[0]] = Number(row[1]) || 0;
            }
        });

        // Read expenses (first row is header)
        const expenses = [];
        const expRows = expensesSheet.getDataRange().getValues();
        if (expRows.length > 1) {
            const headers = expRows[0];
            for (var i = 1; i < expRows.length; i++) {
                var exp = {};
                headers.forEach(function(h, j) { exp[h] = expRows[i][j]; });
                // id and date are stored as numbers
                exp.id   = Number(exp.id)   || 0;
                exp.date = Number(exp.date) || 0;
                exp.amount = Number(exp.amount) || 0;
                expenses.push(exp);
            }
        }

        var payload = JSON.stringify({
            bills:    config.bills,
            specials: config.specials,
            daily:    config.daily,
            expenses: expenses
        });

        return ContentService
            .createTextOutput(payload)
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService
            .createTextOutput(JSON.stringify({ error: err.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ── POST  (push: app → sheet) ────────────────────────────────────────────────

function doPost(e) {
    try {
        var payload = JSON.parse(e.postData.contents);

        var ss            = SpreadsheetApp.getActiveSpreadsheet();
        var configSheet   = getOrCreateSheet(ss, 'Config');
        var expensesSheet = getOrCreateSheet(ss, 'Expenses');

        // Write config
        configSheet.clearContents();
        configSheet.getRange(1, 1, 3, 2).setValues([
            ['bills',    payload.bills    || 0],
            ['specials', payload.specials || 0],
            ['daily',    payload.daily    || 0]
        ]);

        // Write expenses
        expensesSheet.clearContents();
        var expenses = payload.expenses || [];
        if (expenses.length > 0) {
            var headers = ['id', 'amount', 'segment', 'category', 'label', 'date', 'type'];
            var rows = [headers].concat(
                expenses.map(function(exp) {
                    return headers.map(function(h) {
                        return exp[h] !== undefined ? exp[h] : '';
                    });
                })
            );
            expensesSheet
                .getRange(1, 1, rows.length, headers.length)
                .setValues(rows);
        }

        return ContentService
            .createTextOutput(JSON.stringify({ ok: true, written: expenses.length }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService
            .createTextOutput(JSON.stringify({ error: err.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
