/**
 * Biolane Nesting Checklist → Google Sheet
 *
 * HOW TO INSTALL (once, about 3 minutes)
 * 1. Open your Google Sheet → Extensions → Apps Script.
 * 2. Delete whatever is in the editor, paste this whole file, and set
 *    SECRET below to the value you were given (SHEETS_WEBHOOK_SECRET).
 * 3. Click Deploy → New deployment → gear icon → Web app.
 *      Description:     Biolane sign-ups
 *      Execute as:      Me
 *      Who has access:  Anyone        (NOT "Anyone with Google account")
 *    Click Deploy, approve the permissions (Advanced → Go to … if Google
 *    warns the app is unverified — it is your own script), then copy the
 *    Web app URL (ends in /exec) and send it to the site owner.
 * 4. After ANY edit to this script: Deploy → Manage deployments → pencil →
 *    Version: New version → Deploy. The URL stays the same.
 * 5. To check it works, open the Web app URL in a browser: you should see
 *    {"ok":true,...}. A Google sign-in page means step 3's access is wrong.
 *
 * WHAT IT DOES
 * The site POSTs rows here after every sign-up, every finished checklist
 * and every Paid change. Each row is matched by its Claim code (column A):
 * an existing row is updated in place, a new one is appended. A row that is
 * older than what the sheet already has (column S, Updated) is ignored, so
 * retries can never overwrite fresher data. The tab is called "Sign-ups"
 * and gets its headers on first use. Do not reorder or rename the columns.
 *
 * Text typed by visitors is stored as plain text (a leading ' is added
 * when a value starts with = + - @), so nothing typed on the site can run
 * as a formula in your sheet. Keep the sheet shared with as few people as
 * possible: it holds names, mobiles, emails and due dates.
 */

var SECRET = 'PASTE_THE_SECRET_HERE';
var TAB = 'Sign-ups';
var HEADERS = [
  'Claim code', 'Status', 'Signed up (Manila)', 'Last update (Manila)', 'Name',
  'Are you', 'Others (specify)', 'Email', 'Mobile', 'Baby stage', 'Due date',
  'Marketing consent', 'Basket total (PHP)', 'Gift unlocked', 'Bag name',
  'Products', 'Paid', 'Paid at (Manila)', 'Updated (ISO)'
];
var KEYS = [
  'claimCode', 'status', 'signedUp', 'lastUpdate', 'name',
  'areYou', 'othersSpecify', 'email', 'mobile', 'babyStage', 'dueDate',
  'consent', 'basketTotal', 'giftUnlocked', 'bagName',
  'products', 'paid', 'paidAt', 'updatedIso'
];
var UPDATED_COL = KEYS.indexOf('updatedIso') + 1;

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'bad json' });
  }
  if (!body || body.secret !== SECRET) return reply({ ok: false, error: 'forbidden' });
  var rows = Array.isArray(body.rows) ? body.rows : body.row ? [body.row] : [];
  if (rows.length === 0) return reply({ ok: true, upserted: 0 });
  if (rows.length > 500) return reply({ ok: false, error: 'too many rows' });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    if (!sheet) return reply({ ok: false, error: 'header row changed — restore the headers in row 1' });
    var lastRow = sheet.getLastRow();
    var index = {};
    var stamps = {};
    if (lastRow >= 2) {
      var existing = sheet.getRange(2, 1, lastRow - 1, UPDATED_COL).getValues();
      for (var i = 0; i < existing.length; i++) {
        var c = String(existing[i][0]).trim();
        if (c && index[c] === undefined) {
          index[c] = i + 2; // sheet row number
          stamps[c] = String(existing[i][UPDATED_COL - 1] || '');
        }
      }
    }
    var appended = [];
    var updated = 0;
    var skipped = 0;
    for (var r = 0; r < rows.length; r++) {
      var code = String(rows[r].claimCode || '').trim();
      if (!code) continue;
      var values = KEYS.map(function (k) { return cell(rows[r][k]); });
      var stamp = String(rows[r].updatedIso || '');
      if (index[code] !== undefined) {
        if (stamps[code] && stamp && stamp < stamps[code]) { skipped++; continue; } // older than the sheet's copy
        sheet.getRange(index[code], 1, 1, HEADERS.length).setValues([values]);
        stamps[code] = stamp;
        updated++;
      } else {
        appended.push(values);
        index[code] = lastRow + appended.length; // in case the same code repeats in this batch
        stamps[code] = stamp;
      }
    }
    if (appended.length) {
      sheet.getRange(lastRow + 1, 1, appended.length, HEADERS.length).setValues(appended);
    }
    return reply({ ok: true, upserted: updated + appended.length, updated: updated, added: appended.length, skipped: skipped });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Opening the URL in a browser shows this, which is handy to confirm the deployment. */
function doGet() {
  return reply({ ok: true, message: 'Biolane sign-ups endpoint is live. The site sends rows here with POST.' });
}

/** The Sign-ups tab with headers. Returns null if row 1 holds something unexpected. */
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
  var first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var empty = first.every(function (v) { return String(v) === ''; });
  if (empty) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }
  return String(first[0]) === HEADERS[0] ? sheet : null;
}

/** Numbers stay numbers; everything else is stored as text, never as a formula. */
function cell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return v;
  var s = String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
