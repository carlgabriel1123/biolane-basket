import 'server-only'
import { adminDb, type AdminSubmission } from './admin-db'
import { toSheetRow, type SheetRow } from './sheet-row'

/**
 * Google Sheets mirror — server only.
 *
 * The site POSTs rows to the Apps Script web app pasted into the owner's
 * sheet (docs/google-sheets/Code.gs). The script upserts by claim code.
 * A sheet failure never fails a save: the row stays "unsynced" and is
 * retried by the dashboard's Sync button and the daily health cron.
 */

const CHUNK = 100

export function sheetConfigured(): boolean {
  return Boolean(process.env.SHEETS_WEBHOOK_URL && process.env.SHEETS_WEBHOOK_SECRET)
}

/** Sends rows to the sheet. Resolves to an error message, or null on success. */
export async function pushRowsToSheet(rows: SheetRow[]): Promise<string | null> {
  const url = process.env.SHEETS_WEBHOOK_URL
  const secret = process.env.SHEETS_WEBHOOK_SECRET
  if (!url || !secret) return 'not-configured'
  if (rows.length === 0) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      // Apps Script answers a POST with a redirect that must be followed
      // with a GET; fetch does that by default.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret, rows }),
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    const text = (await res.text()).slice(0, 500)
    if (!res.ok) return `sheet http ${res.status}: ${text}`
    let parsed: { ok?: boolean; error?: string } = {}
    try {
      parsed = JSON.parse(text)
    } catch {
      return `sheet returned non-JSON (is the script deployed with access "Anyone"?): ${text.slice(0, 120)}`
    }
    return parsed.ok ? null : `sheet refused: ${parsed.error ?? text.slice(0, 120)}`
  } catch (err) {
    return `sheet unreachable: ${err instanceof Error ? err.message : String(err)}`
  }
}

export interface SyncResult {
  attempted: number
  synced: number
  error: string | null
}

/**
 * Pushes these submissions to the sheet and marks each one synced in the
 * database (only if it has not changed meanwhile).
 */
export async function syncToSheet(subs: AdminSubmission[]): Promise<SyncResult> {
  if (!sheetConfigured()) return { attempted: 0, synced: 0, error: 'not-configured' }
  let synced = 0
  for (let i = 0; i < subs.length; i += CHUNK) {
    const batch = subs.slice(i, i + CHUNK)
    const error = await pushRowsToSheet(batch.map(toSheetRow))
    if (error) {
      console.error('[sheets] push failed', error)
      return { attempted: subs.length, synced, error }
    }
    await Promise.all(
      batch.map((s) =>
        adminDb.markSynced(s.submission_id, s.updated_at).then(
          () => synced++,
          (err) => console.error('[sheets] could not mark synced', s.submission_id, err)
        )
      )
    )
  }
  return { attempted: subs.length, synced, error: null }
}

/** Re-sends everything the sheet has not confirmed yet (oldest first). */
export async function retryUnsynced(limit: number): Promise<SyncResult> {
  if (!sheetConfigured()) return { attempted: 0, synced: 0, error: 'not-configured' }
  const pending = await adminDb.unsynced(limit)
  if (pending.length === 0) return { attempted: 0, synced: 0, error: null }
  return syncToSheet(pending)
}
