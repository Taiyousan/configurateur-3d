import { useRef, useState, type KeyboardEvent } from 'react'
import { useStore } from '../store'
import { MaterialPanel } from './MaterialPanel'
import { SceneTree } from './SceneTree'
import { ScenePanel, VariantsPanel } from './SidePanels'

const TABS = [
  { id: 'part', label: 'Pièce' },
  { id: 'tree', label: 'Structure' },
  { id: 'scene', label: 'Scène' },
] as const
type Tab = (typeof TABS)[number]['id']

// On small screens, the side panels share one sheet, one tab at a time.
export function PanelSheet() {
  const [tab, setTab] = useState<Tab>('part')
  const count = useStore((s) => s.selection.length)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const step = e.key === 'ArrowRight' ? 1 : TABS.length - 1
    const next = (TABS.findIndex((t) => t.id === tab) + step) % TABS.length
    setTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <aside className="sheet">
      <div className="sheet-tabs" role="tablist" aria-label="Panneaux" onKeyDown={onTabKey}>
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            role="tab"
            id={`sheet-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="sheet-panel"
            tabIndex={tab === t.id ? 0 : -1}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'part' && count > 1 && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>
      <div className="sheet-body" role="tabpanel" id="sheet-panel" aria-labelledby={`sheet-tab-${tab}`}>
        {tab === 'part' && (
          <>
            <MaterialPanel />
            <VariantsPanel />
          </>
        )}
        {tab === 'tree' && <SceneTree />}
        {tab === 'scene' && <ScenePanel collapsible={false} />}
      </div>
    </aside>
  )
}
