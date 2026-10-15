import type { CSSProperties, ReactNode } from 'react'

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h3>{title}</h3>
        {aside && <span className="section-aside">{aside}</span>}
      </div>
      {children}
    </section>
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
