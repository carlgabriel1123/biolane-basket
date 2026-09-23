/**
 * Turning a stored submission into the flat row the Google Sheet and the
 * CSV export show. No server-only imports, so the tests can load it.
 */

import type { AdminSubmission } from './admin-db'

export interface SheetRow {
  claimCode: string
  status: 'Signed up' | 'Finished'
  signedUp: string
  lastUpdate: string
  name: string
  areYou: string
  othersSpecify: string
  email: string
  mobile: string
  babyStage: string
  dueDate: string
  consent: 'Yes' | 'No'
  basketTotal: number
  giftUnlocked: 'Yes' | 'No'
  bagName: string
  products: string
  paid: 'Yes' | 'No'
  paidAt: string
}

/** Column order in the sheet and the CSV. Keep in step with docs/google-sheets/Code.gs. */
export const SHEET_COLUMNS: Array<[keyof SheetRow, string]> = [
  ['claimCode', 'Claim code'],
  ['status', 'Status'],
  ['signedUp', 'Signed up (Manila)'],
  ['lastUpdate', 'Last update (Manila)'],
  ['name', 'Name'],
  ['areYou', 'Are you'],
  ['othersSpecify', 'Others (specify)'],
  ['email', 'Email'],
  ['mobile', 'Mobile'],
  ['babyStage', 'Baby stage'],
  ['dueDate', 'Due date'],
  ['consent', 'Marketing consent'],
  ['basketTotal', 'Basket total (PHP)'],
  ['giftUnlocked', 'Gift unlocked'],
  ['bagName', 'Bag name'],
  ['products', 'Products'],
  ['paid', 'Paid'],
  ['paidAt', 'Paid at (Manila)'],
]

const STAGE_LABEL: Record<string, string> = {
  expecting: 'Expecting',
  baby: 'Baby (0–12 months)',
  toddler: 'Toddler (1–4 years)',
  others: 'Others',
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  dad: 'Dad',
  mom: 'Mom',
  grandparent: 'Grandparent',
  others: 'Others',
}

const manila = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** '2026-10-08 14:05' in Asia/Manila, or '' for null. */
export function formatManila(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return manila.format(d).replace(',', '')
}

export function productLines(products: AdminSubmission['selected_products']): string {
  return (products ?? [])
    .map((p) => `${p.name}${p.size ? ' ' + p.size : ''} ×${p.qty} = ₱${p.lineTotal}`)
    .join('\n')
}

export function toSheetRow(s: AdminSubmission): SheetRow {
  return {
    claimCode: s.submission_id,
    status: s.event === 'checklist_completed' ? 'Finished' : 'Signed up',
    signedUp: formatManila(s.received_at),
    lastUpdate: formatManila(s.updated_at),
    name: s.name,
    areYou: RELATIONSHIP_LABEL[s.relationship] ?? s.relationship,
    othersSpecify: s.relationship_other ?? '',
    email: s.email,
    mobile: s.mobile,
    babyStage: STAGE_LABEL[s.baby_stage] ?? s.baby_stage,
    dueDate: s.due_date ?? '',
    consent: s.marketing_consent ? 'Yes' : 'No',
    basketTotal: s.basket_total,
    giftUnlocked: s.reward_unlocked ? 'Yes' : 'No',
    bagName: s.personalization_name ?? '',
    products: productLines(s.selected_products),
    paid: s.paid_at ? 'Yes' : 'No',
    paidAt: formatManila(s.paid_at),
  }
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel shows ₱ and é correctly. */
export function toCsv(rows: SheetRow[]): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [SHEET_COLUMNS.map(([, label]) => esc(label)).join(',')]
  for (const r of rows) lines.push(SHEET_COLUMNS.map(([key]) => esc(r[key])).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}
