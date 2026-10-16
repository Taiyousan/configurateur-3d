import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Icon } from './Icons'

interface SectionProps {
  title: string
  aside?: ReactNode
  /** Folds behind its title, closed at first. */
  collapsible?: boolean
  children: ReactNode
}

export function Section({ title, aside, collapsible = false, children }: SectionProps) {
  const [open, setOpen] = useState(!collapsible)
  return (
    <section className="section">
      <div className="section-head">
        <h3>
          {collapsible ? (
            <button className="section-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {title}
              <Icon name="chevronDown" size={12} className={`flip${open ? ' open' : ''}`} />
            </button>
          ) : (
            title
          )}
        </h3>
        {aside && open && <span className="section-aside">{aside}</span>}
      </div>
      {open && children}
    </section>
  )
}

// Chevron in a section head that shows or hides extra controls; the label is only announced.
export function FoldButton({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button className="text-btn" aria-expanded={open} aria-label={label} title={label} onClick={onToggle}>
      <Icon name="chevronDown" size={12} className={`flip${open ? ' open' : ''}`} />
    </button>
  )
}

interface SliderProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onBegin?: () => void
  onChange: (v: number) => void
}

export function Slider({ label, value, min = 0, max = 1, step = 0.01, onBegin, onChange }: SliderProps) {
  return (
    <label className="slider">
      <span className="slider-head">
        <span>{label}</span>
        <span className="mono">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onBegin}
        onKeyDown={onBegin}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ '--progress': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
      />
    </label>
  )
}

interface MenuProps {
  label: string
  /** The button's content. */
  button: ReactNode
  className?: string
  /** Receives a function that closes the list. */
  children: (close: () => void) => ReactNode
}

// A list that drops down under a button, closed by a click elsewhere or Escape.
export function Menu({ label, button, className = 'btn', children }: MenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div
      ref={root}
      className="menu"
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !open) return
        // Keeps the global shortcut (clear the selection) out of it.
        e.stopPropagation()
        setOpen(false)
        buttonRef.current?.focus()
      }}
    >
      <button
        ref={buttonRef}
        className={className}
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        {button}
      </button>
      {open && <div className="menu-list">{children(() => setOpen(false))}</div>}
    </div>
  )
}
