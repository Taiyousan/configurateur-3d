import { useCallback, useEffect, useState } from 'react'
import { useStore } from './store'
import { Viewer } from './components/Viewer'
import { Toolbar } from './components/Toolbar'
import { SceneTree } from './components/SceneTree'
import { MaterialPanel } from './components/MaterialPanel'
import { ScenePanel, VariantsPanel } from './components/SidePanels'
import { ControlsPanel, DropZone, HoverLabel, StatusOverlay } from './components/Overlays'
import { HelpDialog } from './components/HelpDialog'
import { Icon } from './components/Icons'

const HELP_SEEN_KEY = 'configurateur-3d:help-seen'

// Storage can be missing or throw (private mode, blocked site data).
function helpSeen() {
  try {
    return localStorage.getItem(HELP_SEEN_KEY) === '1'
  } catch {
    return false
  }
}
function markHelpSeen() {
  try {
    localStorage.setItem(HELP_SEEN_KEY, '1')
  } catch {
    // Nothing to do: the help will simply show up again next time.
  }
}

function useShortcuts(openHelp: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, select, textarea')) return
      // The help dialog handles its own keys (Escape closes it).
      if (document.querySelector('dialog[open]')) return
      const s = useStore.getState()
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (e.key === '?') openHelp()
      else if (e.key === 'Escape') s.select(null)
      else if (mod && key === 'z' && !e.shiftKey) (e.preventDefault(), s.undo())
      else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) (e.preventDefault(), s.redo())
      else if (!mod && key === 'f') s.focusOn(s.selection.length ? s.selection : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openHelp])
}

export default function App() {
  const hasModel = useStore((s) => !!s.model)
  const [treeOpen, setTreeOpen] = useState(() => window.innerWidth > 860)
  const [helpOpen, setHelpOpen] = useState(() => !helpSeen())

  const closeHelp = () => {
    setHelpOpen(false)
    markHelpSeen()
  }

  const openHelp = useCallback(() => setHelpOpen(true), [])
  useShortcuts(openHelp)
  useEffect(() => {
    // Guard against StrictMode's double mount in dev.
    if (useStore.getState().status === 'idle') useStore.getState().loadSample()
  }, [])

  return (
    <div className="app">
      <Viewer />
      <Toolbar onHelp={openHelp} />

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
          <ControlsPanel />
        </>
      )}

      <HoverLabel />
      <StatusOverlay />
      <DropZone />
      <HelpDialog open={helpOpen} onClose={closeHelp} />
    </div>
  )
}
