import { useEffect, useState } from 'react'
import { useStore } from './store'
import { Viewer } from './components/Viewer'
import { Toolbar } from './components/Toolbar'
import { SceneTree } from './components/SceneTree'
import { MaterialPanel } from './components/MaterialPanel'
import { ScenePanel, VariantsPanel } from './components/SidePanels'
import { DropZone, HoverLabel, StatusOverlay } from './components/Overlays'
import { Icon } from './components/Icons'

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, select, textarea')) return
      const s = useStore.getState()
      const mod = e.ctrlKey || e.metaKey
      if (e.key === 'Escape') s.select(null)
      else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) (e.preventDefault(), s.undo())
      else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)))
        (e.preventDefault(), s.redo())
      else if (!mod && e.key.toLowerCase() === 'f') s.focusOn(s.selection.length ? s.selection : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  const hasModel = useStore((s) => !!s.model)
  const [treeOpen, setTreeOpen] = useState(() => window.innerWidth > 860)

  useShortcuts()
  useEffect(() => {
    // Garde contre le double montage du StrictMode en dev.
    if (useStore.getState().status === 'idle') useStore.getState().loadDemo()
  }, [])

  return (
    <div className="app">
      <Viewer />
      <Toolbar />

      {hasModel && (
        <>
          <aside className={`sidebar left${treeOpen ? ' open' : ''}`}>
            <SceneTree />
          </aside>
          <button
            className="icon-btn floating tree-toggle"
            onClick={() => setTreeOpen((o) => !o)}
            aria-label={treeOpen ? 'Masquer la structure' : 'Afficher la structure'}
            title={treeOpen ? 'Masquer la structure' : 'Afficher la structure'}
          >
            <Icon name="layers" />
          </button>
          <aside className="sidebar right">
            <MaterialPanel />
            <VariantsPanel />
            <ScenePanel />
          </aside>
          <footer className="hints">
            <span><kbd>Clic</kbd> sélectionner</span>
            <span><kbd>Maj</kbd>+<kbd>Clic</kbd> multi</span>
            <span><kbd>Double-clic</kbd> zoomer</span>
            <span><kbd>F</kbd> cadrer</span>
            <span><kbd>Échap</kbd> désélectionner</span>
          </footer>
        </>
      )}

      <HoverLabel />
      <StatusOverlay />
      <DropZone />
    </div>
  )
}
