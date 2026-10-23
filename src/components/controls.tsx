import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n'

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { L } = useI18n()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  // Через портал: окно не наследует стили места, где его открыли (например, белый текст шапки).
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label={L.close} onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Stepper({
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  value: number
  min: number
  max: number
  disabled?: boolean
  onChange: (v: number) => void
}) {
  const { L } = useI18n()
  return (
    <div className="stepper">
      <button aria-label={L.less} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="stepper-value">{value}</span>
      <button aria-label={L.more} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  )
}

export function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`toggle ${checked ? 'on' : ''}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  disabled?: boolean
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'active' : ''}
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Текстовое поле с локальным черновиком: в базу пишем при выходе из поля или по Enter.
export function TextField({
  value,
  label,
  disabled,
  onCommit,
}: {
  value: string
  label?: string
  disabled?: boolean
  onCommit: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [focused, setFocused] = useState(false)
  const shown = focused ? draft : value

  const commit = () => {
    setFocused(false)
    const v = draft.trim()
    if (v !== value) onCommit(v)
  }

  return (
    <input
      value={shown}
      aria-label={label}
      disabled={disabled}
      onFocus={() => {
        setDraft(value)
        setFocused(true)
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  )
}

export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <select className="select" aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
