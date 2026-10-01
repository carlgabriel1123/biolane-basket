'use client'

import { useEffect, useRef } from 'react'

/**
 * A card that tilts a few degrees toward the mouse, with a soft light
 * following it (styles: `[data-tilt]` in app/globals.css; an attribute
 * rather than a class, because React rewrites className on every change).
 *
 * Only for a real mouse or trackpad: phones and tablets never get it, and
 * neither does anyone whose device asks for reduced motion. Nothing moves
 * until the pointer is over the card, and it settles back when it leaves.
 */
export function useTilt<T extends HTMLElement>(maxDegrees = 3) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reduceMotion.matches) return

    let frame = 0
    const set = (rx: number, ry: number, gx: number, gy: number) => {
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
      el.style.setProperty('--gx', `${gx.toFixed(1)}%`)
      el.style.setProperty('--gy', `${gy.toFixed(1)}%`)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        set(-y * maxDegrees * 2, x * maxDegrees * 2, (x + 0.5) * 100, (y + 0.5) * 100)
      })
    }
    const leave = () => {
      cancelAnimationFrame(frame)
      set(0, 0, 50, 0)
    }

    el.dataset.tilt = ''
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      delete el.dataset.tilt
    }
  }, [maxDegrees])

  return ref
}
