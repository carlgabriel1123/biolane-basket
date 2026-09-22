import type { BabyStage } from '@/data/campaign'

/** Exactly what gets stored for every mom who completes the checklist. */
export interface Submission {
  submissionId: string
  timestamp: string
  name: string
  email: string
  mobile: string
  babyStage: BabyStage
  dueDate?: string
  marketingConsent: boolean
  selectedProducts: Array<{
    id: string
    name: string
    size: string
    gbfSku: string
    price: number
  }>
  basketTotal: number
  rewardUnlocked: boolean
  personalizationName?: string
}

export type SubmitResult =
  | { ok: true; submissionId: string; storedRemotely: boolean }
  | { ok: false; error: string }

const STORAGE_KEY = 'biolane-nesting-submissions'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return 'BIO-' + crypto.randomUUID().slice(0, 8).toUpperCase()
  }
  return 'BIO-' + Math.abs(Date.now() % 100000000).toString(36).toUpperCase()
}

/** Keep a local copy so a dropped connection at the booth never loses a lead. */
function stashLocally(submission: Submission): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all: Submission[] = raw ? JSON.parse(raw) : []
    all.push(submission)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Private mode / blocked storage — the POST below is still attempted.
  }
}

/**
 * Submit a completed checklist.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ TO CONNECT A REAL BACKEND                                        │
 * │                                                                  │
 * │ The POST below already targets /api/submit. Open                 │
 * │   app/api/submit/route.ts                                        │
 * │ and forward the payload to whichever service you choose:         │
 * │   • Google Sheets  — Apps Script web-app URL, or Sheets API      │
 * │   • Airtable       — POST https://api.airtable.com/v0/{base}/... │
 * │   • Supabase       — supabase.from('submissions').insert(...)    │
 * │   • CRM / ESP      — Klaviyo, HubSpot, Mailchimp                 │
 * │                                                                  │
 * │ Put credentials in .env.local (server-side only, never NEXT_     │
 * │ PUBLIC_*). Until then the route accepts and logs the payload,    │
 * │ and every lead is ALSO kept in localStorage as a safety net.     │
 * └──────────────────────────────────────────────────────────────────┘
 */
export async function submitChecklist(
  data: Omit<Submission, 'submissionId' | 'timestamp'>
): Promise<SubmitResult> {
  const submission: Submission = {
    ...data,
    submissionId: newId(),
    timestamp: new Date().toISOString(),
  }

  stashLocally(submission)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      // Lead is already stashed locally, so the mom is not blocked.
      return { ok: true, submissionId: submission.submissionId, storedRemotely: false }
    }
    return { ok: true, submissionId: submission.submissionId, storedRemotely: true }
  } catch {
    // Offline / flaky booth wifi. The local copy means nothing is lost.
    return { ok: true, submissionId: submission.submissionId, storedRemotely: false }
  }
}

/** Dev helper: read back everything captured on this device. */
export function getStashedSubmissions(): Submission[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
