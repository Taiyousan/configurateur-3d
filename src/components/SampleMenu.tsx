import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { SAMPLES } from '../lib/samples'
import { Icon } from './Icons'

// The example models, in a list that drops down under the toolbar button.
export function SampleMenu() {
  const sampleId = useStore((s) => s.sampleId)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  const pick = (id: string) => {
    setOpen(false)
    useStore.getState().loadSample(id)
  }

  return (
    <div
      ref={root}
      className="menu"
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !open) return
        // Keeps the global shortcut (clear the selection) out of it.
        e.stopPropagation()
        setOpen(false)
        button.current?.focus()
      }}
    >
      <button
        ref={button}
        className="btn"
        aria-expanded={open}
        aria-label="Modèles d'exemple"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="box" size={15} /> <span className="hide-sm">Exemples</span>
        <Icon name="chevronDown" size={13} />
      </button>
      {open && (
        <div className="menu-list">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              aria-current={s.id === sampleId}
              className="menu-item"
              onClick={() => pick(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
