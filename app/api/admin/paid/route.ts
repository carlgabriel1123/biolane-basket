import { adminDb } from '@/lib/admin-db'
import { guardAdminPost, json, readJson } from '@/lib/admin-guard'
import { sheetConfigured, syncToSheet } from '@/lib/sheets'

const ID_RE = /^BIO-[0-9A-Z]{4,12}$/

/** POST /api/admin/paid — {id, paid} → the updated row, mirrored to the sheet. */
export async function POST(request: Request) {
  const guard = await guardAdminPost(request)
  if ('error' in guard) return guard.error

  const body = await readJson(request)
  const id = typeof body?.id === 'string' ? body.id : ''
  const paid = body?.paid === true
  if (!ID_RE.test(id) || typeof body?.paid !== 'boolean') return json(422, { ok: false, error: 'bad-request' })

  try {
    const row = await adminDb.setPaid(id, paid)
    if (!row) return json(404, { ok: false, error: 'not-found' })
    let sheet: string | null = sheetConfigured() ? null : 'not-configured'
    if (sheetConfigured()) {
      const result = await syncToSheet([row])
      sheet = result.error
      if (!sheet) row.sheet_synced_at = new Date().toISOString()
    }
    return json(200, { ok: true, row, sheet })
  } catch (err) {
    console.error('[admin/paid]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
