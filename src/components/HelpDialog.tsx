import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { site } from '../site'
import { SAMPLES } from '../lib/samples'
import { Icon } from './Icons'

const TABS = [
  { id: 'usage', label: 'Utilisation' },
  { id: 'about', label: 'À propos' },
] as const
type Tab = (typeof TABS)[number]['id']

const STEPS = [
  { title: 'Importer', text: 'Glissez un fichier 3D sur la page.' },
  { title: 'Sélectionner', text: 'Cliquez sur une pièce.' },
  { title: 'Personnaliser', text: 'Couleur et finition, à droite.' },
  { title: 'Exporter', text: 'En image PNG ou en .glb.' },
]

const SHORTCUTS = [
  { keys: ['Maj', 'Clic'], action: 'Sélection multiple' },
  { keys: ['Double-clic'], action: 'Zoomer sur la pièce' },
  { keys: ['Ctrl', 'Z'], action: 'Annuler' },
  { keys: ['Échap'], action: 'Désélectionner' },
]

// Native modal dialog: focus trap, Escape and the backdrop come for free.
export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [tab, setTab] = useState<Tab>('usage')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // The heading rather than the first button, so nothing looks pressed on open.
      headingRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next = (TABS.findIndex((t) => t.id === tab) + 1) % TABS.length
    setTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <dialog
      ref={ref}
      className="help"
      aria-labelledby="help-title"
      onClose={onClose}
      // A click on the backdrop lands on the dialog itself.
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <header className="card-head">
        <div className="card-head-row">
          <div className="title-block">
            <p className="kicker">Configurateur 3D</p>
            <h2 id="help-title" ref={headingRef} tabIndex={-1}>
              Mode d'emploi
            </h2>
          </div>
          <button className="icon-btn on-ink" onClick={onClose} aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>
        <div className="tabs" role="tablist" aria-label="Rubriques" onKeyDown={onTabKey}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              role="tab"
              id={`help-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="help-panel"
              tabIndex={tab === t.id ? 0 : -1}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="card-body help-body" role="tabpanel" id="help-panel" aria-labelledby={`help-tab-${tab}`}>
        {tab === 'usage' ? <Usage /> : <About />}
      </div>

      <footer className="help-foot">
        <p>
          <strong>{site.author}</strong>
          <span>{site.role}</span>
        </p>
        <nav aria-label="Liens">
          <a href={site.links.portfolio} target="_blank" rel="noreferrer">
            Portfolio
          </a>
          <a href={site.links.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </footer>
    </dialog>
  )
}

function Usage() {
  return (
    <>
      <ol className="steps">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <span className="step-number">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <ul className="shortcuts">
        {SHORTCUTS.map((s) => (
          <li key={s.action}>
            <span>
              {s.keys.map((k, i) => (
                <span key={k}>
                  {i > 0 && ' + '}
                  <kbd>{k}</kbd>
                </span>
              ))}
            </span>
            <span>{s.action}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function About() {
  return (
    <>
      <section className="section">
        <div className="section-head">
          <h3>Stack</h3>
        </div>
        <p className="mono-list">React · TypeScript · Vite · React Three Fiber · drei · postprocessing · zustand</p>
      </section>

      <section className="section">
        <div className="section-head">
          <h3>Crédits</h3>
        </div>
        <ul className="credits small">
          {SAMPLES.map((s) => (
            <li key={s.id}>
              {s.name} :{' '}
              <a href={s.credit.source} target="_blank" rel="noreferrer">
                {s.credit.author}
              </a>{' '}
              ({s.credit.license})
            </li>
          ))}
          <li>
            Éclairages :{' '}
            <a href="https://polyhaven.com" target="_blank" rel="noreferrer">
              Poly Haven
            </a>{' '}
            (CC0)
          </li>
        </ul>
      </section>
    </>
  )
}
