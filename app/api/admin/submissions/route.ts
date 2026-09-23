import { after } from 'next/server'
import { adminDb } from '@/lib/admin-db'
import { guardAdminGet, json } from '@/lib/admin-guard'
import { retryUnsynced, sheetConfigured } from '@/lib/sheets'

/**
 * GET /api/admin/submissions[?since=ISO] — every sign-up, newest first.
 * With `since`, only rows changed after that moment (the dashboard polls
 * this way every 30 s). While staff have the dashboard open, this also
 * nudges any rows the Google Sheet has not confirmed, at most once every
 * few minutes per server.
 */
const RETRY_EVERY_MS = 3 * 60_000
let lastRetry = 0

export async function GET(request: Request) {
  const guard = await guardAdminGet(request)
  if ('error' in guard) return guard.error

  const sinceRaw = new URL(request.url).searchParams.get('since')
  const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw).toISOString() : null

  try {
    const rows = await adminDb.listSubmissions(since)
    if (sheetConfigured() && Date.now() - lastRetry > RETRY_EVERY_MS) {
      lastRetry = Date.now()
      after(() => retryUnsynced(50).catch((err) => console.error('[admin/submissions] retry', err)))
    }
    return json(200, { ok: true, rows, serverTime: new Date().toISOString(), sheet: sheetConfigured() })
  } catch (err) {
    console.error('[admin/submissions]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
