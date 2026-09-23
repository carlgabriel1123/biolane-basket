'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminSubmission } from '@/lib/admin-db'
import { asset } from '@/lib/asset'
import { peso } from '@/lib/format'
import {
  BagIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CloudOffIcon,
  DownloadIcon,
  GiftIcon,
  LogOutIcon,
  PhoneIcon,
  RefreshIcon,
  SearchIcon,
  TagIcon,
  UsersIcon,
} from '@/components/icons'
import { Badge, Button, Skeleton } from '@/components/ui'
import { adminGet, adminPost, describeError } from './api'
import { FormError, PasswordField } from './fields'

interface Props {
  username: string
  sheetConfigured: boolean
}

type Filter = 'all' | 'unpaid' | 'paid' | 'gift' | 'finished' | 'signup' | 'expecting' | 'baby' | 'toddler' | 'others'

const FILTERS: Array<[Filter, string]> = [
  ['all', 'All'],
  ['unpaid', 'Unpaid'],
  ['paid', 'Paid'],
  ['gift', 'Gift unlocked'],
  ['finished', 'Finished'],
  ['signup', 'Signed up only'],
  ['expecting', 'Expecting'],
  ['baby', 'Baby'],
  ['toddler', 'Toddler'],
  ['others', 'Others'],
]

const STAGE: Record<string, string> = { expecting: 'Expecting', baby: 'Baby 0–12 mo', toddler: 'Toddler 1–4 yr', others: 'Others' }
const REL: Record<string, string> = { dad: 'Dad', mom: 'Mom', grandparent: 'Grandparent', others: 'Others' }

const POLL_MS = 30_000
const OVERLAP_MS = 5_000

const timeFmt = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' })
const when = (iso: string | null) => (iso ? timeFmt.format(new Date(iso)) : '')

/* Layout strings shared by real rows and the loading skeleton. */
const CARD = 'rounded-card border border-ink/10 bg-white p-3.5 shadow-soft'
const ROW_GRID = 'md:grid md:grid-cols-[160px_minmax(0,1fr)_170px_150px] md:items-start md:gap-4'
/* Stagger delay, capped so a long list never waits on its tail. */
const at = (i: number) => ({ '--i': Math.min(i, 8) }) as CSSProperties

export default function Dashboard({ username, sheetConfigured }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<Map<string, AdminSubmission>>(new Map())
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const lastServerTime = useRef<string | null>(null)

  const merge = useCallback((incoming: AdminSubmission[]) => {
    if (incoming.length === 0) return
    setRows((prev) => {
      const next = new Map(prev)
      for (const r of incoming) {
        const cur = next.get(r.submission_id)
        if (!cur || cur.updated_at <= r.updated_at) next.set(r.submission_id, r)
      }
      return next
    })
  }, [])

  const load = useCallback(async () => {
    try {
      const since = lastServerTime.current
        ? new Date(new Date(lastServerTime.current).getTime() - OVERLAP_MS).toISOString()
        : null
      const data = await adminGet<{ rows: AdminSubmission[]; serverTime: string }>(
        `/api/admin/submissions${since ? `?since=${encodeURIComponent(since)}` : ''}`
      )
      lastServerTime.current = data.serverTime
      merge(data.rows)
      setLoaded(true)
      setLoadError('')
    } catch (err) {
      const e = err as { error?: string }
      if (e?.error === 'not-logged-in') {
        router.refresh()
        return
      }
      setLoadError(describeError(err))
    }
  }, [merge, router])

  useEffect(() => {
    void load()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  const all = useMemo(
    () => [...rows.values()].sort((a, b) => (a.received_at < b.received_at ? 1 : a.received_at > b.received_at ? -1 : 0)),
    [rows]
  )

  const today = dayFmt.format(new Date())
  const counts = useMemo(
    () => ({
      today: all.filter((r) => dayFmt.format(new Date(r.received_at)) === today).length,
      total: all.length,
      finished: all.filter((r) => r.event === 'checklist_completed').length,
      gift: all.filter((r) => r.reward_unlocked).length,
      paid: all.filter((r) => r.paid_at).length,
    }),
    [all, today]
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Mobiles are stored as +639XXXXXXXXX; let staff type 0917…, 917… or 63917….
    const digits = q.replace(/\D/g, '').replace(/^(0|63)?(9\d*)$/, '$2')
    return all.filter((r) => {
      if (filter === 'unpaid' && r.paid_at) return false
      if (filter === 'paid' && !r.paid_at) return false
      if (filter === 'gift' && !r.reward_unlocked) return false
      if (filter === 'finished' && r.event !== 'checklist_completed') return false
      if (filter === 'signup' && r.event !== 'signup') return false
      if (['expecting', 'baby', 'toddler', 'others'].includes(filter) && r.baby_stage !== filter) return false
      if (!q) return true
      return (
        r.submission_id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (digits.length >= 3 && r.mobile.replace(/\D/g, '').includes(digits)) ||
        (r.personalization_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [all, query, filter])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 4000)
  }

  // Replace a row outright (the server's answer always wins over an
  // optimistic guess, whatever the phone's clock says).
  const setRow = useCallback((row: AdminSubmission) => {
    setRows((prev) => new Map(prev).set(row.submission_id, row))
  }, [])

  const togglePaid = async (r: AdminSubmission) => {
    const paid = !r.paid_at
    if (!paid && !window.confirm(`Mark ${r.submission_id} (${r.name}) as NOT paid?`)) return
    setBusyId(r.submission_id)
    // Optimistic: flip now, put it back if the server says no.
    setRow({ ...r, paid_at: paid ? new Date().toISOString() : null })
    try {
      const data = await adminPost<{ row: AdminSubmission; sheet: string | null }>('/api/admin/paid', { id: r.submission_id, paid })
      setRow(data.row)
      if (sheetConfigured && data.sheet) flash('Saved here. The Google Sheet did not update — use "Sync sheet" later.')
    } catch (err) {
      // Put the row back, then ask the server what it really has: a slow
      // request may have timed out here after the database applied it.
      setRow(r)
      flash(describeError(err))
      void load()
    } finally {
      setBusyId(null)
    }
  }

  const syncSheet = async () => {
    setSyncing(true)
    try {
      const data = await adminPost<{ attempted: number; synced: number; error: string | null }>('/api/admin/sync', {})
      flash(data.attempted === 0 ? 'The sheet is already up to date.' : `Sent ${data.synced} of ${data.attempted} rows to the sheet.`)
      void load()
    } catch (err) {
      const e = err as { error?: string }
      flash(e?.error === 'not-configured' ? 'Google Sheet is not connected yet.' : `Sheet sync failed: ${e?.error ?? 'unknown'}`)
    } finally {
      setSyncing(false)
    }
  }

  const logout = async () => {
    try {
      await adminPost('/api/admin/logout', {})
    } finally {
      router.refresh()
    }
  }

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const stats: Array<{ label: string; n: number; Icon: typeof ClockIcon; chip: string }> = [
    { label: 'Today', n: counts.today, Icon: ClockIcon, chip: 'bg-sky text-blue' },
    { label: 'Sign-ups', n: counts.total, Icon: UsersIcon, chip: 'bg-sky text-blue' },
    { label: 'Finished', n: counts.finished, Icon: CheckCircleIcon, chip: 'bg-blue text-white' },
    { label: 'Gift unlocked', n: counts.gift, Icon: GiftIcon, chip: 'bg-cream text-gold' },
    { label: 'Paid', n: counts.paid, Icon: TagIcon, chip: 'bg-mint-soft text-success' },
  ]

  return (
    <>
      <header className="border-b border-ink/10 bg-white/85 backdrop-blur-md md:sticky md:top-0 md:z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-3">
            <Image src={asset('/images/brand/biolane-logo.png')} alt="Biolane" width={547} height={159} priority className="h-auto w-[110px]" />
            <Badge tone="ink" className="uppercase tracking-wide">
              Admin
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[13px] text-ink-soft">
            <span className="hidden sm:inline">{username}</span>
            <Button variant="ghost" size="sm" className="h-11" aria-expanded={showPassword} onClick={() => setShowPassword((v) => !v)}>
              Change password
            </Button>
            <Button variant="secondary" size="sm" className="h-11" iconLeft={<LogOutIcon size={16} />} onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:px-6">
        {showPassword && <PasswordForm onDone={() => setShowPassword(false)} onNotice={flash} />}

        {/* Counts */}
        <section aria-label="Totals" className="stagger mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {stats.map(({ label, n, Icon, chip }, i) => (
            <div key={label} style={at(i)} className={`${CARD} flex items-center gap-3 ${i === 0 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${chip}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/75">{label}</p>
                <p className="font-display text-[24px] font-extrabold leading-tight tabular-nums text-ink">
                  <span key={n} className="animate-bump inline-block">
                    {n}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Toolbar */}
        <section className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="relative order-1 w-full md:w-auto md:flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search claim code, name, mobile or email"
              aria-label="Search sign-ups"
              className="peer block min-h-[48px] w-full rounded-2xl border-2 border-ink/10 bg-white pl-11 pr-4 text-[16px] text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-soft/50 focus:border-blue focus:shadow-glow"
            />
            <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/60 transition-colors peer-focus:text-blue" />
          </div>
          <div className="order-3 flex w-full gap-2 md:order-2 md:w-auto">
            <a
              href="/api/admin/export"
              className="press inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-pill border-2 border-blue bg-white px-5 text-[14.5px] font-bold text-blue hover:bg-blue hover:text-white md:flex-none"
            >
              <DownloadIcon size={18} />
              <span>Download CSV</span>
            </a>
            <Button
              variant="ghost"
              onClick={syncSheet}
              disabled={syncing}
              aria-busy={syncing || undefined}
              title={sheetConfigured ? 'Send rows the Google Sheet is missing' : 'Google Sheet not connected yet'}
              iconLeft={<RefreshIcon size={18} className={syncing ? 'animate-spin' : ''} />}
              className="flex-1 md:flex-none"
            >
              {syncing ? 'Syncing…' : 'Sync sheet'}
            </Button>
          </div>
          <div
            role="group"
            aria-label="Filter"
            className="no-scrollbar order-2 -mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 md:order-3 md:mx-0 md:w-full md:flex-wrap md:px-0"
          >
            {FILTERS.map(([v, l]) => {
              const active = filter === v
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(v)}
                  className={`press min-h-[44px] shrink-0 rounded-pill border-2 px-4 text-[13.5px] font-bold transition-colors ${
                    active ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink hover:border-ink/30'
                  }`}
                >
                  {l}
                </button>
              )
            })}
          </div>
        </section>

        <p className="mt-2.5 text-[12.5px] text-ink-soft" aria-live="polite">
          {notice || (loadError ? loadError : loaded ? `${visible.length} of ${all.length} shown · refreshes every 30 s · times are Manila` : 'Loading…')}
        </p>

        {/* Loading skeleton: shown only until the first fetch answers. */}
        {!loaded && !loadError && (
          <ul aria-hidden="true" className="mt-3 flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className={`${CARD} ${ROW_GRID} border-l-4 border-l-transparent`}>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="mt-3 flex flex-col gap-2 md:mt-0">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="mt-3 md:mt-0 md:justify-self-end">
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="mt-3 md:mt-0">
                  <Skeleton className="h-11 w-full" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Rows */}
        <ul className="stagger mt-3 flex flex-col gap-2.5">
          {visible.map((r, i) => {
            const paid = Boolean(r.paid_at)
            const finished = r.event === 'checklist_completed'
            const isOpen = open.has(r.submission_id)
            const unsynced = sheetConfigured && (!r.sheet_synced_at || r.sheet_synced_at < r.updated_at)
            return (
              <li
                key={r.submission_id}
                style={at(i)}
                className={`${CARD} ${ROW_GRID} border-l-4 ${paid ? 'border-l-success/50' : 'border-l-transparent'}`}
              >
                <div>
                  <Badge tone="ink" className="font-mono text-[13px]! tracking-wider">
                    {r.submission_id}
                  </Badge>
                  <p className="mt-1 text-[12px] text-ink-soft">{when(r.received_at)}</p>
                  <p className="mt-1.5 flex flex-wrap gap-1">
                    <Badge tone={finished ? 'blue' : 'soft'}>{finished ? 'Finished' : 'Signed up'}</Badge>
                    {r.reward_unlocked && (
                      <Badge tone="gold" icon={<GiftIcon size={12} />}>
                        Gift
                      </Badge>
                    )}
                    {unsynced && (
                      <span title="Not in the Google Sheet yet">
                        <Badge tone="soft" icon={<CloudOffIcon size={12} />}>
                          Sheet pending
                        </Badge>
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-2.5 min-w-0 md:mt-0">
                  <p className="text-[15px] font-bold text-ink">
                    {r.name} <span className="font-normal text-ink-soft">· {REL[r.relationship] ?? r.relationship}{r.relationship_other ? ` (${r.relationship_other})` : ''}</span>
                  </p>
                  <p className="text-[13px] text-ink-soft">
                    <a href={`tel:${r.mobile}`} className="-my-3 inline-flex items-center gap-1 py-3 font-semibold text-blue">
                      <PhoneIcon size={13} />
                      {r.mobile}
                    </a>{' '}
                    · {r.email}
                  </p>
                  <p className="text-[13px] text-ink-soft">
                    {STAGE[r.baby_stage] ?? r.baby_stage}
                    {r.due_date ? ` · due ${r.due_date}` : ''}
                    {r.marketing_consent ? (
                      <>
                        {' · consent '}
                        <CheckIcon size={12} strokeWidth={3} className="-mt-0.5 inline text-success" />
                      </>
                    ) : (
                      ' · no marketing'
                    )}
                    {r.personalization_name ? ` · bag: ${r.personalization_name}` : ''}
                  </p>
                  {r.selected_products.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleOpen(r.submission_id)}
                      aria-expanded={isOpen}
                      className="press -ml-1 mt-0.5 inline-flex min-h-[44px] items-center gap-1 rounded-pill px-1 text-[13px] font-semibold text-blue"
                    >
                      {isOpen ? 'Hide products' : `${r.selected_products.length} product${r.selected_products.length === 1 ? '' : 's'}`}
                      <ChevronDownIcon size={16} className={`transition-transform duration-(--duration-base) ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  {isOpen && (
                    <ul className="animate-rise mt-1 rounded-xl bg-sky-soft px-3 py-2 text-[13px] text-ink">
                      {r.selected_products.map((p) => (
                        <li key={p.id} className="flex justify-between gap-3 py-0.5">
                          <span>
                            {p.name}
                            {p.size ? ` ${p.size}` : ''} × {p.qty}
                            <span className="text-ink-soft"> · SKU {p.gbfSku}</span>
                          </span>
                          <span className="tabular-nums">{peso(p.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-2.5 md:mt-0 md:text-right">
                  <p className="font-display text-[20px] font-extrabold tabular-nums text-ink">{peso(r.basket_total)}</p>
                  <p className="text-[12px] text-ink-soft">{finished ? 'basket total' : 'no basket yet'}</p>
                </div>

                <div className="mt-3 md:mt-0">
                  <Button
                    variant={paid ? 'success' : 'secondary'}
                    full
                    loading={busyId === r.submission_id}
                    aria-pressed={paid}
                    onClick={() => togglePaid(r)}
                    iconLeft={paid ? <CheckIcon size={16} strokeWidth={3} /> : <TagIcon size={16} />}
                  >
                    {paid ? 'Paid' : 'Mark paid'}
                  </Button>
                  {paid && <p className="mt-1 text-center text-[11.5px] text-ink-soft md:text-right">{when(r.paid_at)}</p>}
                </div>
              </li>
            )
          })}
        </ul>

        {loaded && visible.length === 0 && (
          <div className="animate-rise mt-8 flex flex-col items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-sky text-blue">
              <BagIcon size={26} />
            </span>
            <p className="text-[14px] text-ink-soft">{all.length === 0 ? 'No sign-ups yet.' : 'Nothing matches that search.'}</p>
          </div>
        )}
      </main>
    </>
  )
}

function PasswordForm({ onDone, onNotice }: { onDone: () => void; onNotice: (m: string) => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (next !== confirm) return setError('The two new passwords do not match.')
    setBusy(true)
    try {
      await adminPost('/api/admin/password', { current, next })
      onNotice('Password changed. Other devices are logged out.')
      onDone()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="animate-rise mt-3 grid gap-3 rounded-card border border-ink/10 bg-white p-4 shadow-soft sm:grid-cols-3 sm:items-end">
      <PasswordField label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      <PasswordField label="New password (10+ characters)" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={10} />
      <PasswordField label="Repeat new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required minLength={10} />
      {error && <FormError className="sm:col-span-3">{error}</FormError>}
      <div className="flex flex-wrap gap-2 sm:col-span-3">
        <Button type="submit" loading={busy}>
          {busy ? 'Saving…' : 'Save new password'}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
