/**
 * Biolane Checklist → Google Sheet
 *
 * HOW TO INSTALL (once, about 3 minutes)
 * 1. Open your Google Sheet → Extensions → Apps Script.
 * 2. UPDATING? First copy your existing line  var SECRET = '…';  somewhere
 *    safe. Then delete whatever is in the editor, paste this whole file, and
 *    set SECRET below to that value (SHEETS_WEBHOOK_SECRET). Click Save.
 * 3. Click Deploy → New deployment → gear icon → Web app.
 *      Description:     Biolane sign-ups
 *      Execute as:      Me
 *      Who has access:  Anyone        (NOT "Anyone with Google account")
 *    Click Deploy, approve the permissions (Advanced → Go to … if Google
 *    warns the app is unverified — it is your own script), then copy the
 *    Web app URL (ends in /exec) and send it to the site owner.
 * 4. After ANY edit to this script: Deploy → Manage deployments → pencil →
 *    Version: New version → Deploy. The URL stays the same.
 * 5. To check it works, open the Web app URL in a browser. You should see
 *    "version":"2026-09-24 start-fresh" and "secretSet":true. An older
 *    version means step 4 was missed (or "New deployment" was used, which
 *    makes a new URL the site does not know). A Google sign-in page means
 *    step 3's access is wrong.
 * 6. Reload the sheet in a computer browser. A "Biolane" menu appears next
 *    to Help (menus don't show in the Sheets phone app). The first time you
 *    use it, Google asks you to authorize the script: allow it.
 *
 * START FRESH (Biolane menu → Start fresh (keep a backup tab)…)
 * Only after step 5 shows the new version. Copies the whole Sign-ups tab,
 * exactly as it is, into a new tab named "Backup <date> <time>", then
 * removes those rows from Sign-ups (the header row stays). New sign-ups keep
 * arriving in Sign-ups as usual. Nothing is lost: the backup tab is
 * protected (editing it shows a warning) and can be kept for good. Then
 * press "Sync sheet" on the admin page, so anyone still listed there is put
 * back into Sign-ups.
 *
 * WHAT IT DOES
 * The site POSTs rows here after every sign-up, every finished checklist
 * and every Paid change. Each row is matched by its Claim code (column A):
 * an existing row is updated in place, a new one is appended. A row that is
 * older than what the sheet already has (the Updated (ISO) column) is
 * ignored, so retries can never overwrite fresher data. The tab is called
 * "Sign-ups" and gets its headers on first use. A sheet made by an older
 * version of this script is upgraded in place: the TikTok and Instagram
 * columns are inserted after Mobile and every existing row keeps its values.
 * Do not reorder or rename the columns.
 *
 * Text typed by visitors is stored as plain text (a leading ' is added
 * when a value starts with = + - @), so nothing typed on the site can run
 * as a formula in your sheet. Keep the sheet shared with as few people as
 * possible: it holds names, mobiles, emails and due dates.
 */

var SECRET = 'PASTE_THE_SECRET_HERE';
var VERSION = '2026-09-24 start-fresh';
var TAB = 'Sign-ups';
var HEADERS = [
  'Claim code', 'Status', 'Signed up (Manila)', 'Last update (Manila)', 'Name',
  'Are you', 'Others (specify)', 'Email', 'Mobile', 'TikTok', 'Instagram',
  'Baby stage', 'Due date',
  'Marketing consent', 'Basket total (PHP)', 'Gift unlocked', 'Bag name',
  'Products', 'Paid', 'Paid at (Manila)', 'Updated (ISO)'
];
var KEYS = [
  'claimCode', 'status', 'signedUp', 'lastUpdate', 'name',
  'areYou', 'othersSpecify', 'email', 'mobile', 'tiktok', 'instagram',
  'babyStage', 'dueDate',
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
  return reply({
    ok: true,
    version: VERSION,
    secretSet: SECRET !== '' && SECRET !== 'PASTE_THE_SECRET_HERE',
    message: 'Biolane sign-ups endpoint is live. The site sends rows here with POST.'
  });
}

/**
 * The Sign-ups tab with current headers, upgrading an older layout in place.
 * Returns null if row 1 holds something unexpected.
 */
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
  var width = Math.max(sheet.getLastColumn(), HEADERS.length);
  var first = sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
  var empty = first.every(function (v) { return v === ''; });
  if (!empty) {
    if (first[0] !== HEADERS[0]) return null;
    // Made before the TikTok / Instagram question: open two columns right
    // after Mobile, so every existing row keeps its values in place.
    if (first.indexOf('TikTok') === -1) {
      var mobile = first.indexOf('Mobile');
      if (mobile === -1) return null;
      sheet.insertColumnsAfter(mobile + 1, 2);
    }
  }
  var header = sheet.getRange(1, 1, 1, HEADERS.length);
  if (header.getValues()[0].map(String).join('|') !== HEADERS.join('|')) {
    header.setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Adds the Biolane menu. Google runs this by itself whenever the sheet is opened. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Biolane')
    .addItem('Start fresh (keep a backup tab)…', 'startFresh')
    .addToUi();
}

/**
 * Copies the Sign-ups tab to a new, protected "Backup <date> <time>" tab,
 * then removes those rows from Sign-ups (the header row stays). Asks first;
 * changes nothing if the answer is No or if Sign-ups is already empty.
 * It never changes the columns: only the deployed doPost upgrades the
 * header, so the header always matches the version that writes the rows.
 */
function startFresh() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var current = ss.getSheetByName(TAB);
  var count = current ? Math.max(current.getLastRow() - 1, 0) : 0;
  if (count === 0) {
    ui.alert('Nothing to back up', 'The "' + TAB + '" tab has no sign-ups yet.', ui.ButtonSet.OK);
    return;
  }
  var answer = ui.alert(
    'Start fresh?',
    'All ' + count + ' rows of "' + TAB + '" will be copied into a new backup tab, then "' + TAB +
      '" will be emptied (the header row stays). New sign-ups will keep arriving in "' + TAB + '".',
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) return;

  // Dialogs are shown only outside the lock, so the site's saves never wait on them.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var name = '';
  var moved = 0;
  try {
    var sheet = ss.getSheetByName(TAB);
    if (sheet && String(sheet.getRange(1, 1).getValue()) === HEADERS[0]) {
      var last = sheet.getLastRow();
      moved = Math.max(last - 1, 0);
      name = uniqueSheetName(ss, 'Backup ' + Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd h.mm a'));
      // copyTo keeps every value and format exactly (text stays text).
      var backup = sheet.copyTo(ss).setName(name);
      backup.setTabColor('#9e9e9e');
      backup.protect().setDescription('Backup made by Start fresh. Please do not edit.').setWarningOnly(true);
      if (moved > 0) {
        // Delete the rows (values, colours, notes, hidden state) so new sign-ups
        // start on clean rows. Sheets won't delete every row below a frozen
        // header, so add one blank row first when needed.
        if (sheet.getMaxRows() <= last) sheet.insertRowsAfter(last, 1);
        sheet.deleteRows(2, moved);
      }
      ss.setActiveSheet(sheet);
    }
  } finally {
    lock.releaseLock();
  }
  if (!name) {
    ui.alert('Row 1 of "' + TAB + '" was changed. Restore the headers, then try again.');
    return;
  }
  ui.alert(
    'Done',
    moved + ' rows are saved in the "' + name + '" tab, and "' + TAB + '" is empty. ' +
      'Now press "Sync sheet" on the admin page, so anyone still listed there is added back.',
    ui.ButtonSet.OK
  );
}

/** base, or "base (2)", "base (3)"… if a tab with that name already exists. */
function uniqueSheetName(ss, base) {
  var name = base;
  for (var n = 2; ss.getSheetByName(name); n++) name = base + ' (' + n + ')';
  return name;
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
