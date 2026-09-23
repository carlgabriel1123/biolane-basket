'use client'

/**
 * Admin form fields: a rounded input with a decorative leading icon, a
 * password field with a show/hide toggle, and the inline error line.
 * Shared by the login, setup and change-password forms.
 */
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertIcon, EyeIcon, EyeOffIcon, LockIcon } from '@/components/icons'
import { IconButton } from '@/components/ui'

const INPUT =
  'peer block w-full min-h-[52px] rounded-2xl border-2 border-ink/10 bg-white py-3 text-[16px] text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-soft/50 focus:border-blue focus:shadow-glow'

const LABEL = 'block text-[13px] font-semibold text-ink'

const LEAD_ICON =
  'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/60 transition-colors peer-focus:text-blue'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  /** Decorative leading icon (already aria-hidden). */
  icon: ReactNode
}

export function TextField({ label, icon, id: idProp, className = '', ...input }: TextFieldProps) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <span className="relative mt-1.5 block">
        <input id={id} className={`${INPUT} pl-11 pr-4`} {...input} />
        <span aria-hidden="true" className={LEAD_ICON}>
          {icon}
        </span>
      </span>
    </div>
  )
}

/** Password input with a LockIcon and a show/hide toggle. */
export function PasswordField({ label, id: idProp, className = '', ...input }: Omit<TextFieldProps, 'icon' | 'type'>) {
  const auto = useId()
  const id = idProp ?? auto
  const [show, setShow] = useState(false)
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <span className="relative mt-1.5 block">
        <input id={id} type={show ? 'text' : 'password'} className={`${INPUT} pl-11 pr-14`} {...input} />
        <span aria-hidden="true" className={LEAD_ICON}>
          <LockIcon size={18} />
        </span>
        <IconButton
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={() => setShow((v) => !v)}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          {show ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </IconButton>
      </span>
    </div>
  )
}

/** Error text next to the form, announced as an alert. */
export function FormError({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={`flex items-start gap-1.5 text-[13px] font-semibold text-danger ${className}`}>
      <AlertIcon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
