/**
 * The soft "nursery wallpaper" behind every public screen (and a quieter
 * version behind /admin): a pastel wash that follows the baby stage,
 * polka dots that fade out toward the content, two slow colour blobs and
 * a scatter of baby motifs — clouds, stars, a moon, hearts, a rubber duck,
 * a rattle, a bottle and little footprints.
 *
 * Purely decorative: aria-hidden, pointer-events none, fixed behind the
 * page (-z-10). All motif colours are light, so ink text on top keeps
 * AA contrast. Motion is slow and switched off by prefers-reduced-motion
 * (globals.css).
 *
 * Render it OUTSIDE any animated wrapper: a transformed ancestor would
 * turn `position: fixed` into "fixed to that element".
 */
import type { CSSProperties } from 'react'
import type { BabyStage } from '@/data/campaign'

type WashKey = BabyStage | 'neutral'

const WASHES: Record<WashKey, string> = {
  neutral:
    'linear-gradient(165deg, var(--color-blush) 0%, var(--color-cream-soft) 30%, var(--color-sky-soft) 60%, var(--color-mint) 100%)',
  expecting:
    'linear-gradient(165deg, var(--color-blush) 0%, var(--color-blush-soft) 30%, var(--color-cream-soft) 65%, var(--color-cream) 100%)',
  baby: 'linear-gradient(165deg, var(--color-sky) 0%, var(--color-sky-soft) 35%, #f6fafd 60%, var(--color-mint) 100%)',
  toddler:
    'linear-gradient(165deg, var(--color-mint) 0%, var(--color-mint-soft) 35%, var(--color-cream-soft) 65%, var(--color-cream) 100%)',
  others:
    'linear-gradient(165deg, var(--color-lilac) 0%, var(--color-lilac-soft) 35%, var(--color-blush-soft) 65%, var(--color-blush) 100%)',
}

const BLOBS: Record<WashKey, [string, string]> = {
  neutral: ['var(--color-blush)', 'var(--color-sky)'],
  expecting: ['var(--color-blush)', 'var(--color-cream)'],
  baby: ['var(--color-sky)', 'var(--color-mint)'],
  toddler: ['var(--color-mint)', 'var(--color-cream)'],
  others: ['var(--color-lilac)', 'var(--color-blush)'],
}

/* ---------------- motifs ---------------- */

function Cloud({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 60" width={size} height={size * 0.6}>
      <g fill="#ffffff">
        <circle cx="30" cy="38" r="16" />
        <circle cx="52" cy="27" r="21" />
        <circle cx="74" cy="38" r="15" />
        <rect x="14" y="36" width="76" height="18" rx="9" />
      </g>
      <path d="M22 54h60" stroke="#d6e6f2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function Star({ size, color = '#f5dc7a' }: { size: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill={color}
        d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
      />
    </svg>
  )
}

function Sparkle({ size, color = '#d9ccf2' }: { size: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path fill={color} d="M12 2c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z" />
    </svg>
  )
}

function Moon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path fill="#f7e7a6" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <circle cx="9" cy="14" r="1" fill="#efd67f" />
      <circle cx="12.5" cy="17.5" r=".8" fill="#efd67f" />
    </svg>
  )
}

function Heart({ size, color = '#ffc9b8' }: { size: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill={color}
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
      />
    </svg>
  )
}

function Duck({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 48 40" width={size} height={size * (40 / 48)}>
      <ellipse cx="22" cy="28" rx="18" ry="10" fill="#f7dc7e" />
      <circle cx="31" cy="15" r="9" fill="#f7dc7e" />
      <path d="M39 14.5l8 2.2-8 2.3z" fill="#f2b47a" />
      <circle cx="33.5" cy="12.5" r="1.4" fill="#3c4770" />
      <path d="M9 25q5-6 11-1.5" stroke="#ecc860" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Rattle({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <path d="M21 21l12 12" stroke="#c9b8ea" strokeWidth="4" strokeLinecap="round" />
      <circle cx="34" cy="34" r="3.5" fill="#c9b8ea" />
      <circle cx="15" cy="15" r="11" fill="#e8e0f7" />
      <path d="M6 13h18M7 18h16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="15" r="11" fill="none" stroke="#c9b8ea" strokeWidth="1.5" />
    </svg>
  )
}

function Bottle({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 40" width={size * 0.6} height={size}>
      <path d="M10 1h4a2 2 0 0 1 2 2v4H8V3a2 2 0 0 1 2-2z" fill="#ffd9cc" />
      <rect x="6" y="7" width="12" height="5" rx="1.5" fill="#9cc7e6" />
      <rect x="5" y="12" width="14" height="26" rx="4" fill="#ffffff" stroke="#9cc7e6" strokeWidth="1.5" />
      <rect x="6.5" y="24" width="11" height="12.5" rx="3" fill="#d6e6f2" />
      <path d="M15 17h3M15 22h3M15 27h3" stroke="#9cc7e6" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function Footprints({ size }: { size: number }) {
  const foot = (x: number, y: number, flip: boolean) => (
    <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`} fill="#ffcfbf">
      <ellipse cx="0" cy="10" rx="5" ry="8" />
      <circle cx="-3.6" cy="-0.5" r="1.7" />
      <circle cx="-0.6" cy="-2.2" r="1.6" />
      <circle cx="2.3" cy="-1.6" r="1.4" />
      <circle cx="4.4" cy="0.4" r="1.2" />
    </g>
  )
  return (
    <svg viewBox="0 0 40 48" width={size} height={size * 1.2}>
      {foot(12, 26, false)}
      {foot(28, 12, true)}
    </svg>
  )
}

function Rainbow({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 38" width={size} height={size * (38 / 64)}>
      <g fill="none" strokeLinecap="round" strokeWidth="5">
        <path d="M7 33a25 25 0 0 1 50 0" stroke="#ffc9b8" />
        <path d="M14 33a18 18 0 0 1 36 0" stroke="#f5dc7a" />
        <path d="M21 33a11 11 0 0 1 22 0" stroke="#bfe5dc" />
      </g>
      <g fill="#ffffff">
        <circle cx="6" cy="33" r="5" />
        <circle cx="12" cy="34" r="4" />
        <circle cx="52" cy="34" r="4" />
        <circle cx="58" cy="33" r="5" />
      </g>
    </svg>
  )
}

function Dot({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size}>
      <circle cx="5" cy="5" r="5" fill={color} />
    </svg>
  )
}

type MotifKind = 'cloud' | 'star' | 'sparkle' | 'moon' | 'heart' | 'duck' | 'rattle' | 'bottle' | 'feet' | 'dot' | 'rainbow'

interface Placement {
  kind: MotifKind
  size: number
  style: CSSProperties
  /** Tailwind visibility, e.g. 'hidden md:block'. Default: always. */
  show?: string
  opacity?: number
  rotate?: number
  float?: 'float' | 'drift'
  delay?: string
  color?: string
}

function renderMotif(p: Placement) {
  switch (p.kind) {
    case 'cloud':
      return <Cloud size={p.size} />
    case 'star':
      return <Star size={p.size} color={p.color} />
    case 'sparkle':
      return <Sparkle size={p.size} color={p.color} />
    case 'moon':
      return <Moon size={p.size} />
    case 'heart':
      return <Heart size={p.size} color={p.color} />
    case 'duck':
      return <Duck size={p.size} />
    case 'rattle':
      return <Rattle size={p.size} />
    case 'bottle':
      return <Bottle size={p.size} />
    case 'feet':
      return <Footprints size={p.size} />
    case 'dot':
      return <Dot size={p.size} color={p.color ?? '#d6e6f2'} />
    case 'rainbow':
      return <Rainbow size={p.size} />
  }
}

/**
 * Phones: a few motifs peeking in at the edges (the content column covers
 * the middle). Tablets and up: the full scatter across the side gutters.
 */
const FULL: Placement[] = [
  // top band (under the bunting)
  { kind: 'cloud', size: 130, style: { top: '9%', left: '-48px' }, float: 'drift', opacity: 1 },
  { kind: 'rainbow', size: 64, style: { top: '11%', right: '-6px' }, show: 'md:hidden', opacity: 0.95 },
  { kind: 'moon', size: 40, style: { top: '12%', right: '9%' }, show: 'hidden md:block', float: 'float', delay: '-2.5s', rotate: -12, opacity: 1 },
  { kind: 'star', size: 26, style: { top: '10%', left: '14%' }, show: 'hidden md:block', float: 'float', delay: '-1s', opacity: 1 },
  { kind: 'sparkle', size: 20, style: { top: '20%', left: '7%' }, show: 'hidden md:block', float: 'float', delay: '-3s' },
  { kind: 'cloud', size: 150, style: { top: '17%', right: '-60px' }, show: 'hidden md:block', float: 'drift', delay: '-6s', opacity: 0.95 },
  { kind: 'dot', size: 10, style: { top: '15%', left: '24%' }, show: 'hidden md:block', color: '#ffcfbf' },
  { kind: 'dot', size: 8, style: { top: '24%', right: '20%' }, show: 'hidden lg:block', color: '#bfe5dc' },

  // middle band
  { kind: 'heart', size: 22, style: { top: '33%', left: '4px' }, opacity: 0.95, rotate: -14, float: 'float', delay: '-1.8s' },
  { kind: 'star', size: 20, style: { top: '40%', right: '4px' }, show: 'md:hidden', float: 'float', delay: '-0.7s', opacity: 1 },
  { kind: 'rattle', size: 64, style: { top: '31%', left: '5%' }, show: 'hidden md:block', rotate: -18, float: 'float', delay: '-4s', opacity: 1 },
  { kind: 'bottle', size: 72, style: { top: '40%', right: '6%' }, show: 'hidden md:block', rotate: 12, float: 'float', delay: '-0.5s', opacity: 1 },
  { kind: 'heart', size: 28, style: { top: '47%', left: '12%' }, show: 'hidden lg:block', color: '#ffc9b8', float: 'float', delay: '-2s' },
  { kind: 'rainbow', size: 96, style: { top: '52%', left: '2%' }, show: 'hidden lg:block', opacity: 0.95 },
  { kind: 'cloud', size: 120, style: { top: '58%', right: '-52px' }, float: 'drift', delay: '-5s', opacity: 0.95 },
  { kind: 'sparkle', size: 18, style: { top: '55%', right: '13%' }, show: 'hidden md:block', color: '#bfe5dc', float: 'float', delay: '-3.5s' },
  { kind: 'dot', size: 9, style: { top: '65%', left: '9%' }, show: 'hidden md:block', color: '#d9ccf2' },

  // bottom band
  { kind: 'feet', size: 54, style: { top: '71%', left: '4%' }, show: 'hidden md:block', rotate: 18, opacity: 1 },
  { kind: 'duck', size: 58, style: { top: '79%', left: '-10px' }, float: 'float', delay: '-1.2s', opacity: 1 },
  { kind: 'heart', size: 18, style: { top: '72%', right: '6px' }, color: '#d9ccf2', rotate: 10, opacity: 1 },
  { kind: 'star', size: 28, style: { top: '84%', right: '8%' }, show: 'hidden md:block', float: 'float', delay: '-2.8s', opacity: 1 },
  { kind: 'moon', size: 30, style: { top: '90%', right: '14px' }, show: 'md:hidden', rotate: -14, opacity: 0.95 },
  { kind: 'cloud', size: 110, style: { top: '88%', left: '16%' }, show: 'hidden lg:block', float: 'drift', delay: '-2s', opacity: 0.9 },
  { kind: 'sparkle', size: 16, style: { top: '94%', right: '22%' }, show: 'hidden md:block', color: '#ffcfbf' },
]

/** A calmer set for the admin screens: soft, but out of the way of data. */
const QUIET: Placement[] = [
  { kind: 'cloud', size: 110, style: { top: '3%', left: '-46px' }, show: 'hidden md:block', opacity: 0.85 },
  { kind: 'star', size: 16, style: { top: '10%', right: '3%' }, show: 'hidden md:block' },
  { kind: 'moon', size: 24, style: { top: '48%', left: '1.5%' }, show: 'hidden xl:block', rotate: -12 },
  { kind: 'cloud', size: 100, style: { top: '70%', right: '-50px' }, show: 'hidden md:block', opacity: 0.8 },
  { kind: 'heart', size: 14, style: { top: '86%', left: '3%' }, show: 'hidden xl:block' },
]

/* ---------------- bunting ---------------- */

const FLAG_COLORS = ['#ffcfbf', '#f7e3a1', '#bcd8ee', '#bfe5dc', '#d9ccf2']
const SPAN = 600 // one swag of string between two pins
const SAG = 26
const STEP = 46

/** y of the string at x: each swag sags SAG px in the middle. */
const stringY = (x: number) => {
  const t = (((x % SPAN) + SPAN) % SPAN) / SPAN
  return 8 + SAG * 4 * t * (1 - t)
}

function buntingPaths() {
  const flags: Array<{ d: string; fill: string }> = []
  let i = 0
  for (let x = 26; x < 2400; x += STEP) {
    if (x % SPAN < 20 || x % SPAN > SPAN - 20) continue // no flag right at a pin
    const x1 = x - 15
    const x2 = x + 15
    const d = 'M' + x1 + ' ' + stringY(x1).toFixed(1) + ' L' + x2 + ' ' + stringY(x2).toFixed(1) + ' L' + x + ' ' + (stringY(x) + 30).toFixed(1) + ' Z'
    flags.push({ d, fill: FLAG_COLORS[i++ % FLAG_COLORS.length] })
  }
  let line = 'M0 ' + stringY(0)
  for (let x = 10; x <= 2400; x += 10) line += ' L' + x + ' ' + stringY(x).toFixed(1)
  return { flags, line }
}

const BUNTING = buntingPaths()

/** A pastel flag garland across the top of the page. Decorative. */
export function Bunting() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-[72px] overflow-hidden">
      <svg viewBox="0 0 2400 72" preserveAspectRatio="xMidYMin slice" className="h-full w-full">
        <path d={BUNTING.line} fill="none" stroke="#3c4770" strokeOpacity="0.28" strokeWidth="1.5" />
        {BUNTING.flags.map((flag, i) => (
          <path key={i} d={flag.d} fill={flag.fill} />
        ))}
        {[0, 600, 1200, 1800, 2400].map((x) => (
          <circle key={x} cx={x} cy={stringY(x)} r="3.5" fill="#ffffff" stroke="#3c4770" strokeOpacity="0.28" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  )
}

export interface NurseryBackdropProps {
  /** Tints the wash and blobs; '' or undefined = the neutral all-pastel mix. */
  stage?: BabyStage | ''
  /** Fewer motifs, no floating — for the admin screens. */
  quiet?: boolean
}

export default function NurseryBackdrop({ stage, quiet = false }: NurseryBackdropProps) {
  const active: WashKey = stage || 'neutral'
  const [blobA, blobB] = BLOBS[active]
  const placements = quiet ? QUIET : FULL

  return (
    <>
      {!quiet && <Bunting />}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Every wash is rendered; only the active one is opaque, so changing
          stage crossfades the whole room. */}
      {(Object.keys(WASHES) as WashKey[]).map((key) => (
        <div
          key={key}
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ background: WASHES[key], opacity: key === active ? 1 : 0 }}
        />
      ))}

      <div className="nursery-dots absolute inset-0" />

      {/* Two big, very soft colour blobs. */}
      <div
        className={`absolute -left-28 -top-28 h-80 w-80 rounded-full opacity-60 blur-3xl transition-colors duration-700 ${quiet ? '' : 'animate-drift'}`}
        style={{ backgroundColor: blobA }}
      />
      <div
        className={`absolute -bottom-32 -right-24 h-96 w-96 rounded-full opacity-50 blur-3xl transition-colors duration-700 ${quiet ? '' : 'animate-drift'}`}
        style={{ backgroundColor: blobB, animationDelay: '-4.5s' }}
      />

      {placements.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.show ?? ''}`}
          style={{ ...p.style, opacity: p.opacity ?? 0.8, transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined }}
        >
          <div
            className={!quiet && p.float ? (p.float === 'float' ? 'animate-float' : 'animate-drift') : ''}
            style={p.delay ? { animationDelay: p.delay } : undefined}
          >
            {renderMotif(p)}
          </div>
        </div>
      ))}
      </div>
    </>
  )
}
