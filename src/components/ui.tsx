import { useState, type CSSProperties, type ReactNode } from 'react'
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
