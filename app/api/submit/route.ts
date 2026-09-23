import { NextResponse } from 'next/server'

/**
 * POST /api/submit — saves one sign-up / finished checklist to Supabase.
 *
 * Runs only on the Vercel server. It forwards a cleaned copy of the record
 * to the database function `upsert_submission`, together with SUBMIT_TOKEN.
 * The database refuses any call without that token, and the public cannot
 * read or write the submissions table directly.
 *
 * Environment (Vercel → Project → Settings → Environment Variables):
 *   SUPABASE_URL              https://<ref>.supabase.co
 *   SUPABASE_PUBLISHABLE_KEY  sb_publishable_…
 *   SUBMIT_TOKEN              the write token whose SHA-256 is stored in
 *                             private.write_tokens
 */

const MAX_BODY_BYTES = 16_000
const ID_RE = /^BIO-[0-9A-Z]{4,12}$/
const EVENTS = new Set(['signup', 'checklist_completed'])

const str = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' ? v.slice(0, max) : undefined
const int = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isSafeInteger(v) ? v : undefined
const bool = (v: unknown): boolean => v === true

/** Keep only the fields the table knows about, with sane sizes. */
function clean(raw: Record<string, unknown>) {
  const products = Array.isArray(raw.selectedProducts) ? raw.selectedProducts.slice(0, 40) : []
  return {
    submissionId: str(raw.submissionId, 16),
    seq: int(raw.seq),
    event: str(raw.event, 24),
    timestamp: str(raw.timestamp, 40),
    name: str(raw.name, 120),
    relationship: str(raw.relationship, 16),
    relationshipOther: str(raw.relationshipOther, 40),
    email: str(raw.email, 254),
    mobile: str(raw.mobile, 20),
    babyStage: str(raw.babyStage, 16),
    dueDate: str(raw.dueDate, 10),
    marketingConsent: bool(raw.marketingConsent),
    selectedProducts: products
      .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
      .map((p) => ({
        id: str(p.id, 64),
        name: str(p.name, 120),
        size: str(p.size, 20),
        gbfSku: str(p.gbfSku, 20),
        price: int(p.price),
        qty: int(p.qty),
        lineTotal: int(p.lineTotal),
      })),
    basketTotal: int(raw.basketTotal) ?? 0,
    rewardUnlocked: bool(raw.rewardUnlocked),
    personalizationName: str(raw.personalizationName, 15),
  }
}

const reply = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  const token = process.env.SUBMIT_TOKEN
  if (!url || !key || !token) return reply(503, { ok: false, error: 'not-configured' })

  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return reply(413, { ok: false, error: 'too-large' })

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return reply(400, { ok: false, error: 'invalid-json' })
  }
  if (!raw || typeof raw !== 'object') return reply(400, { ok: false, error: 'invalid-body' })

  const record = clean(raw as Record<string, unknown>)
  if (
    !record.submissionId ||
    !ID_RE.test(record.submissionId) ||
    record.seq === undefined ||
    !record.event ||
    !EVENTS.has(record.event) ||
    !record.timestamp ||
    !record.name ||
    !record.email ||
    !record.mobile
  ) {
    return reply(400, { ok: false, error: 'missing-fields' })
  }

  try {
    const res = await fetch(`${url}/rest/v1/rpc/upsert_submission`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: record, token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error('[submit] supabase rejected', res.status, (await res.text()).slice(0, 300))
      return reply(502, { ok: false, error: 'store-failed' })
    }
  } catch (err) {
    console.error('[submit] supabase unreachable', err)
    return reply(502, { ok: false, error: 'store-unreachable' })
  }

  return reply(200, { ok: true, submissionId: record.submissionId })
}
