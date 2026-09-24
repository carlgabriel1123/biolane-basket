import { adminDb } from '@/lib/admin-db'
import { guardAdminPost, json, readJson } from '@/lib/admin-guard'
import { checkSheet, retryUnsynced, sheetConfigured, syncToSheet } from '@/lib/sheets'

/** Re-sending every row can take a while on a big sheet. */
export const maxDuration = 60

/**
 * POST /api/admin/sync — {all?: boolean}. Re-sends rows the sheet has not
 * confirmed; with all=true, re-sends every row (after "Start fresh" in the
 * sheet). `total` is how many sign-ups exist, so the dashboard can offer the
 * full re-send. With nothing to send, it still checks that the sheet accepts
 * our secret, so a wrong secret never shows as "up to date".
 */
export async function POST(request: Request) {
  const guard = await guardAdminPost(request)
  if ('error' in guard) return guard.error
  if (!sheetConfigured()) return json(200, { ok: false, error: 'not-configured', attempted: 0, synced: 0 })

  const body = await readJson(request)
  try {
    if (body?.all === true) {
      const all = await adminDb.listSubmissions(null)
      const result = all.length ? await syncToSheet(all) : { attempted: 0, synced: 0, error: await checkSheet() }
      return json(200, { ok: !result.error, ...result, total: all.length })
    }
    const result = await retryUnsynced(500)
    if (result.attempted === 0 && !result.error) result.error = await checkSheet()
    return json(200, { ok: !result.error, ...result })
  } catch (err) {
    console.error('[admin/sync]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
