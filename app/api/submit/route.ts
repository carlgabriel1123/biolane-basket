import { NextResponse, after } from 'next/server'
import type { AdminSubmission } from '@/lib/admin-db'
import { sheetConfigured, syncToSheet } from '@/lib/sheets'

/**
 * POST /api/submit — saves one sign-up / finished checklist to Supabase.
 *
 * Runs only on the Vercel server. It validates the record strictly and
 * forwards a cleaned copy to the database function `upsert_submission`,
 * together with SUBMIT_TOKEN. The database refuses any call without that
 * token, refuses any update that lacks the record's own write key, and the
 * public cannot read or write the submissions table directly.
 *
 * Status codes the phone relies on:
 *   200 saved · 4xx never saveable (the phone drops it) ·
 *   429 / 5xx temporary (the phone keeps it and retries).
 *
 * Environment (Vercel → Project → Settings → Environment Variables):
 *   SUPABASE_URL              https://<ref>.supabase.co
 *   SUPABASE_PUBLISHABLE_KEY  sb_publishable_…
 *   SUBMIT_TOKEN              write token; its SHA-256 is in private.write_tokens
 */

const MAX_BODY_BYTES = 16_000

const ID_RE = /^BIO-[0-9A-Z]{4,12}$/
const WRITE_KEY_RE = /^[0-9a-f]{32}$/
const MOBILE_RE = /^\+639\d{9}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/
const MAX_BASKET_TOTAL = 10_000_000
/** Keep seq inside the database's "no more than 10 min ahead" guard. */
const SEQ_AHEAD_LIMIT_MS = 590_000
const EVENTS = new Set(['signup', 'checklist_completed'])
const RELATIONSHIPS = new Set(['dad', 'mom', 'grandparent', 'others'])
const STAGES = new Set(['expecting', 'baby', 'toddler', 'others'])

/* ---- best-effort rate limit (per server instance) ----
 * A whole booth can share one wifi IP, so the limit is generous: it only
 * stops scripted floods, not a busy booth. */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 60
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  if (hits.size > 5_000) {
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k)
  }
  const entry = hits.get(ip)
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_PER_WINDOW
}

/* ---- cleaning ---- */
const str = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' ? v.trim().slice(0, max) : undefined
const int = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isSafeInteger(v) ? v : undefined
const bool = (v: unknown): boolean => v === true

function clean(raw: Record<string, unknown>) {
  const products = Array.isArray(raw.selectedProducts) ? raw.selectedProducts.slice(0, 40) : []
  return {
    submissionId: str(raw.submissionId, 16),
    writeKey: str(raw.writeKey, 32),
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

type Record_ = ReturnType<typeof clean>

/** YYYY-MM-DD that exists on the calendar (JS alone accepts 2026-02-30). */
function isRealDate(d: string): boolean {
  if (!DATE_RE.test(d)) return false
  const t = Date.parse(`${d}T00:00:00Z`)
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === d
}

/** Returns the first problem, or null if the record is valid. */
function problem(r: Record_): string | null {
  if (!r.submissionId || !ID_RE.test(r.submissionId)) return 'submissionId'
  if (!r.writeKey || !WRITE_KEY_RE.test(r.writeKey)) return 'writeKey'
  if (r.seq === undefined || r.seq < 0) return 'seq'
  if (!r.event || !EVENTS.has(r.event)) return 'event'
  if (!r.timestamp || !ISO_TIME_RE.test(r.timestamp) || Number.isNaN(Date.parse(r.timestamp))) return 'timestamp'
  if (!r.name) return 'name'
  if (!r.relationship || !RELATIONSHIPS.has(r.relationship)) return 'relationship'
  if (!r.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return 'email'
  if (!r.mobile || !MOBILE_RE.test(r.mobile)) return 'mobile'
  if (!r.babyStage || !STAGES.has(r.babyStage)) return 'babyStage'
  if (r.dueDate && !isRealDate(r.dueDate)) return 'dueDate'
  if (r.basketTotal < 0 || r.basketTotal > MAX_BASKET_TOTAL) return 'basketTotal'
  for (const p of r.selectedProducts) {
    if (!p.id || p.price === undefined || p.qty === undefined || p.qty < 1 || p.qty > 99) return 'selectedProducts'
  }
  return null
}

const reply = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  const token = process.env.SUBMIT_TOKEN
  if (!url || !key || !token) return reply(503, { ok: false, error: 'not-configured' })

  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(ip)) return reply(429, { ok: false, error: 'slow-down' })

  const buf = await request.arrayBuffer()
  if (buf.byteLength > MAX_BODY_BYTES) return reply(413, { ok: false, error: 'too-large' })

  let raw: unknown
  try {
    raw = JSON.parse(new TextDecoder().decode(buf))
  } catch {
    return reply(400, { ok: false, error: 'invalid-json' })
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return reply(400, { ok: false, error: 'invalid-body' })
  }

  const record = clean(raw as Record<string, unknown>)
  const bad = problem(record)
  if (bad) return reply(422, { ok: false, error: 'invalid-field', field: bad })

  // seq comes from the phone's clock. A booth tablet set a few hours fast
  // would otherwise have every record refused by the database. Clamping
  // keeps the order of that phone's saves, which is all seq is for.
  record.seq = Math.min(record.seq!, Date.now() + SEQ_AHEAD_LIMIT_MS)

  let res: Response
  try {
    res = await fetch(`${url}/rest/v1/rpc/upsert_submission`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: record, token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
  } catch (err) {
    console.error('[submit] supabase unreachable', err)
    return reply(503, { ok: false, error: 'store-unreachable' })
  }

  if (res.ok) {
    // Mirror the stored row to the Google Sheet after the phone has its
    // answer, so a slow sheet never slows the booth.
    if (sheetConfigured()) {
      let stored: AdminSubmission | undefined
      try {
        stored = ((await res.json()) as AdminSubmission[])[0]
      } catch {
        /* the save succeeded either way */
      }
      if (stored) after(() => syncToSheet([stored]).catch((err) => console.error('[submit] sheet sync', err)))
    }
    return reply(200, { ok: true, submissionId: record.submissionId })
  }

  const detail = (await res.text()).slice(0, 300)
  if (res.status === 401 || res.status === 403 || detail.includes('42501')) {
    // Wrong or missing server credentials: our fault, not the record's. Keep it.
    console.error('[submit] supabase refused our credentials', res.status, detail)
    return reply(503, { ok: false, error: 'misconfigured' })
  }
  if (res.status >= 400 && res.status < 500) {
    // The database will never accept this record (bad value, bad seq, …).
    console.error('[submit] supabase rejected the record', res.status, detail)
    return reply(422, { ok: false, error: 'rejected' })
  }
  console.error('[submit] supabase error', res.status, detail)
  return reply(503, { ok: false, error: 'store-failed' })
}
