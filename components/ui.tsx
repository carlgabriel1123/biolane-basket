'use client'

/**
 * Shared "Nursery Soft" building blocks. Every screen composes these, so
 * buttons, chips, cards and badges look and move the same everywhere.
 */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import type { BabyStage } from '@/data/campaign'
import { BabyIcon, CheckIcon, HeartIcon, SparklesIcon, SpinnerIcon, SunIcon } from './icons'

/* ---------------- stage tones ---------------- */

export interface StageTone {
  /** Soft wash for surfaces. */
  bg: string
  /** Stronger tint for chips / image wells. */
  tint: string
  /** Border / icon accent. */
  accent: string
  /** Accent text class (AA on white). */
  text: string
  Icon: typeof HeartIcon
}

export const STAGE_TONES: Record<BabyStage, StageTone> = {
  expecting: { bg: 'bg-blush-soft', tint: 'bg-blush', accent: 'border-blush-deep', text: 'text-blush-deep', Icon: HeartIcon },
  baby: { bg: 'bg-sky-soft', tint: 'bg-sky', accent: 'border-blue', text: 'text-blue', Icon: BabyIcon },
  toddler: { bg: 'bg-mint-soft', tint: 'bg-mint', accent: 'border-mint-deep', text: 'text-mint-deep', Icon: SunIcon },
  others: { bg: 'bg-lilac-soft', tint: 'bg-lilac', accent: 'border-lilac-deep', text: 'text-lilac-deep', Icon: SparklesIcon },
}

export const stageTone = (stage: BabyStage | ''): StageTone => STAGE_TONES[stage || 'others']

/* ---------------- buttons ---------------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'success' | 'danger-ghost'
type Size = 'md' | 'lg' | 'sm'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-blue text-white shadow-lift hover:bg-blue-deep',
  secondary: 'border-2 border-blue bg-white text-blue hover:bg-blue hover:text-white',
  ghost: 'text-blue hover:bg-white',
  gold: 'bg-gold text-white shadow-lift hover:bg-[#ad7b14]',
  success: 'bg-success text-white hover:bg-[#256628]',
  'danger-ghost': 'text-danger hover:bg-blush-soft',
}
const SIZE: Record<Size, string> = {
  sm: 'min-h-[40px] px-4 text-[13.5px]',
  md: 'min-h-[48px] px-5 text-[14.5px]',
  lg: 'min-h-[54px] px-6 text-[15.5px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  full?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, iconLeft, iconRight, full, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`press inline-flex items-center justify-center gap-2 rounded-pill font-bold disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${SIZE[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <SpinnerIcon size={18} /> : iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  )
}

/** Round icon-only button; always pass aria-label. */
export function IconButton({ className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`press grid h-11 w-11 shrink-0 place-items-center rounded-pill text-ink-soft transition-colors hover:bg-sky-soft hover:text-blue disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------------- choice chips (radio / checkbox cards) ---------------- */

export interface ChoiceChipProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: StageTone
  /** 'radio' (default) or 'checkbox'. */
  kind?: 'radio' | 'checkbox'
}

/** A tappable card wrapping a native radio/checkbox, so keyboards and screen readers just work. */
export function ChoiceChip({ label, hint, icon, tone, kind = 'radio', className = '', checked, ...input }: ChoiceChipProps) {
  const t = tone ?? STAGE_TONES.baby
  return (
    <label
      className={`press flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2.5 transition-colors has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-blue ${
        checked ? `${t.accent} ${t.bg} shadow-soft` : 'border-ink/10 bg-white hover:border-ink/25'
      } ${className}`}
    >
      <input type={kind} className="sr-only" checked={checked} {...input} />
      {icon && (
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${checked ? `${t.tint} ${t.text}` : 'bg-sky-soft text-ink-soft'}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-ink">{label}</span>
        {hint && <span className="block text-[12px] leading-snug text-ink-soft">{hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          checked ? 'border-ink bg-ink text-white' : 'border-ink/25 bg-white text-transparent'
        }`}
      >
        <CheckIcon size={14} strokeWidth={3} />
      </span>
    </label>
  )
}

/* ---------------- surfaces & badges ---------------- */

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-card border border-ink/10 bg-white shadow-soft ${className}`}>{children}</div>
}

type BadgeTone = 'ink' | 'blue' | 'gold' | 'success' | 'danger' | 'soft'
const BADGE: Record<BadgeTone, string> = {
  ink: 'bg-ink text-white',
  blue: 'bg-blue text-white',
  gold: 'bg-cream text-gold',
  success: 'bg-[#e6f4ea] text-success',
  danger: 'bg-blush-soft text-danger',
  soft: 'bg-sky-soft text-ink-soft',
}

export function Badge({ tone = 'soft', icon, children, className = '' }: { tone?: BadgeTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11.5px] font-bold ${BADGE[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  )
}

/** "Step 1 of 2 · About you" — the two-screen flow made visible. */
export function StepIndicator({ step, total, label, className = '' }: { step: number; total: number; label: string; className?: string }) {
  return (
    <p className={`flex items-center gap-2 text-[12px] font-semibold text-ink-soft ${className}`} aria-label={`Step ${step} of ${total}: ${label}`}>
      <span className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 rounded-pill transition-all ${i < step ? 'w-6 bg-blue' : 'w-3 bg-ink/15'}`} />
        ))}
      </span>
      <span aria-hidden="true">
        Step {step} of {total} · {label}
      </span>
    </p>
  )
}

/** Loading placeholder block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

/* ---------------- the reward bottle ---------------- */

/**
 * A baby bottle that fills as the basket grows. `pct` 0–100; turns gold
 * when the gift is unlocked. Decorative: the caller renders the numbers.
 */
export function BottleMeter({ pct, unlocked, className = '' }: { pct: number; unlocked: boolean; className?: string }) {
  const level = Math.max(0, Math.min(100, pct))
  // Liquid area spans y=34..86 inside the bottle body.
  const top = 86 - (52 * level) / 100
  const fill = unlocked ? '#c8901b' : '#1f79b3'
  const fillSoft = unlocked ? '#f2d456' : '#7cb8de'
  return (
    <svg viewBox="0 0 48 96" width="48" height="96" aria-hidden="true" className={className}>
      <defs>
        <clipPath id="bottle-body">
          <path d="M12 30h24a4 4 0 0 1 4 4v50a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V34a4 4 0 0 1 4-4z" />
        </clipPath>
        <linearGradient id="bottle-liquid" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={fillSoft} />
          <stop offset="1" stopColor={fill} />
        </linearGradient>
      </defs>
      {/* teat + collar */}
      <path d="M20 4h8a3 3 0 0 1 3 3v6H17V7a3 3 0 0 1 3-3z" fill={unlocked ? '#f2d456' : '#d6e6f2'} />
      <rect x="12" y="13" width="24" height="10" rx="3" fill={unlocked ? '#c8901b' : '#1f79b3'} />
      <rect x="10" y="23" width="28" height="8" rx="2" fill={unlocked ? '#e0b64a' : '#7cb8de'} />
      {/* body */}
      <path d="M12 30h24a4 4 0 0 1 4 4v50a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V34a4 4 0 0 1 4-4z" fill="#ffffff" stroke="#003b61" strokeOpacity="0.18" strokeWidth="1.5" />
      <g clipPath="url(#bottle-body)">
        <rect className="meter-fill" x="8" y={top} width="32" height={96 - top} fill="url(#bottle-liquid)" />
        {level > 0 && level < 100 && <rect x="8" y={top} width="32" height="2" fill="#ffffff" fillOpacity="0.55" />}
      </g>
      {/* measure marks */}
      {[46, 58, 70, 82].map((y) => (
        <path key={y} d={`M31 ${y}h5`} stroke="#003b61" strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" />
      ))}
    </svg>
  )
}
