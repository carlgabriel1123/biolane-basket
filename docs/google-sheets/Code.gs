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
 *      Who has access:  Anyone
 *    Click Deploy, approve the permissions (Advanced → Go to … if Google
 *    warns the app is unverified — it is your own script), then copy the
 *    Web app URL (ends in /exec) and send it to the site owner.
 * 4. After ANY edit to this script: Deploy → Manage deployments → pencil →
 *    Version: New version → Deploy. The URL stays the same.
 *
 * WHAT IT DOES
 * The site POSTs rows here after every sign-up, every finished checklist
 * and every Paid change. Each row is matched by its Claim code (column A):
 * an existing row is updated in place, a new one is appended. The tab is
 * called "Sign-ups" and is created with headers on first use.
 * Do not reorder or rename the columns; the site writes them by position.
 */

var SECRET = 'PASTE_THE_SECRET_HERE';
var TAB = 'Sign-ups';
var HEADERS = [
  'Claim code', 'Status', 'Signed up (Manila)', 'Last update (Manila)', 'Name',
  'Are you', 'Others (specify)', 'Email', 'Mobile', 'Baby stage', 'Due date',
  'Marketing consent', 'Basket total (PHP)', 'Gift unlocked', 'Bag name',
  'Products', 'Paid', 'Paid at (Manila)'
];
var KEYS = [
  'claimCode', 'status', 'signedUp', 'lastUpdate', 'name',
  'areYou', 'othersSpecify', 'email', 'mobile', 'babyStage', 'dueDate',
  'consent', 'basketTotal', 'giftUnlocked', 'bagName',
  'products', 'paid', 'paidAt'
];

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

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    var lastRow = sheet.getLastRow();
    var index = {};
    if (lastRow >= 2) {
      var codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < codes.length; i++) {
        var c = String(codes[i][0]).trim();
        if (c && index[c] === undefined) index[c] = i + 2; // sheet row number
      }
    }
    var appended = [];
    var updated = 0;
    for (var r = 0; r < rows.length; r++) {
      var values = KEYS.map(function (k) { return cell(rows[r][k]); });
      var code = String(rows[r].claimCode || '').trim();
      if (!code) continue;
      if (index[code] !== undefined) {
        sheet.getRange(index[code], 1, 1, HEADERS.length).setValues([values]);
        updated++;
      } else {
        appended.push(values);
        index[code] = lastRow + appended.length; // in case the same code repeats in this batch
      }
    }
    if (appended.length) {
      sheet.getRange(lastRow + 1, 1, appended.length, HEADERS.length).setValues(appended);
    }
    return reply({ ok: true, upserted: updated + appended.length, updated: updated, added: appended.length });
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

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
  var first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (String(first[0]) !== HEADERS[0]) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function cell(v) {
  if (v === null || v === undefined) return '';
  // Keep claim codes, phone numbers and dates as text so Sheets doesn't
  // turn +639… into a number or 2026-12-01 into a locale date.
  return typeof v === 'number' ? v : String(v);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
