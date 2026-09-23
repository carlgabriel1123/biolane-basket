import { adminDb } from '@/lib/admin-db'
import { guardAdminPost, json, readJson } from '@/lib/admin-guard'
import { retryUnsynced, sheetConfigured, syncToSheet } from '@/lib/sheets'

/**
 * POST /api/admin/sync — {all?: boolean}. Re-sends rows the sheet has not
 * confirmed; with all=true, re-sends every row (e.g. after starting a
 * fresh sheet).
 */
export async function POST(request: Request) {
  const guard = await guardAdminPost(request)
  if ('error' in guard) return guard.error
  if (!sheetConfigured()) return json(200, { ok: false, error: 'not-configured', attempted: 0, synced: 0 })

  const body = await readJson(request)
  try {
    const result = body?.all === true ? await syncToSheet(await adminDb.listSubmissions(null)) : await retryUnsynced(500)
    return json(200, { ok: !result.error, ...result })
  } catch (err) {
    console.error('[admin/sync]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
