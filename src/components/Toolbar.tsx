import { useRef, useState } from 'react'
import { useStore } from '../store'
import { site } from '../site'
import { ACCEPTED_EXTENSIONS } from '../lib/loadModel'
import { exportGLB, takeScreenshot } from '../lib/exporters'
import { rendererRef } from './Viewer'
import { Icon, type IconName } from './Icons'
import { SampleMenu } from './SampleMenu'

interface IconAction {
  id: string
  icon: IconName
  label: string
  /** What the hint next to the buttons says about it. */
  hint: string
  keys?: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}

// The hint of the button under the pointer or with the focus, disabled ones included.
const hintIdOf = (target: EventTarget) =>
  (target instanceof Element && target.closest<HTMLElement>('[data-hint]')?.dataset.hint) || null

export function Toolbar({ onHelp }: { onHelp: () => void }) {
  const model = useStore((s) => s.model)
  const canUndo = useStore((s) => s.undoStack.length > 0)
  const canRedo = useStore((s) => s.redoStack.length > 0)
  const autoRotate = useStore((s) => s.autoRotate)
  const { loadFiles, undo, redo, resetCamera, resetMaterials, resetAll, set } = useStore.getState()
  const input = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [hintId, setHintId] = useState<string | null>(null)

  const baseName = model?.name.replace(/\.[^.]+$/, '') ?? 'modele'

  const onExport = async () => {
    if (!model) return
    setExporting(true)
    try {
      await exportGLB(model.root, baseName)
    } catch (e) {
      set({ error: `Export impossible : ${e instanceof Error ? e.message : e}` })
    } finally {
      setExporting(false)
    }
  }

  const groups: IconAction[][] = [
    [
      {
        id: 'undo',
        icon: 'undo',
        label: 'Annuler',
        hint: 'Revient sur la dernière modification de couleur ou de finition.',
        keys: 'Ctrl+Z',
        onClick: undo,
        disabled: !canUndo,
      },
      { id: 'redo', icon: 'redo', label: 'Rétablir', hint: "Refait ce qui vient d'être annulé.", keys: 'Ctrl+Y', onClick: redo, disabled: !canRedo },
    ],
    [
      {
        id: 'rotate',
        icon: 'orbit',
        label: 'Rotation automatique',
        hint: 'Fait tourner la caméra autour du modèle, en continu.',
        onClick: () => set({ autoRotate: !autoRotate }),
        active: autoRotate,
      },
      {
        id: 'capture',
        icon: 'camera',
        label: 'Capture PNG',
        hint: 'Enregistre la vue actuelle en image.',
        onClick: () => rendererRef.current && takeScreenshot(rendererRef.current, baseName),
        disabled: !model,
      },
      {
        id: 'export',
        icon: 'download',
        label: 'Exporter en GLB',
        hint: 'Télécharge le modèle avec ses nouvelles couleurs, sans les pièces masquées.',
        onClick: onExport,
        disabled: !model || exporting,
      },
    ],
    [
      {
        id: 'resetCamera',
        icon: 'focus',
        label: 'Réinitialiser la caméra',
        hint: "Revient à l'angle et au cadrage de départ.",
        onClick: resetCamera,
        disabled: !model,
      },
      {
        id: 'resetMaterials',
        icon: 'palette',
        label: 'Réinitialiser les couleurs',
        hint: "Remet toutes les pièces à leurs couleurs et finitions d'origine.",
        onClick: resetMaterials,
        disabled: !model,
      },
      {
        id: 'resetAll',
        icon: 'reset',
        label: 'Tout réinitialiser',
        hint: 'Couleurs, pièces masquées, éclairage et caméra reviennent au départ.',
        onClick: resetAll,
        disabled: !model,
      },
    ],
    [{ id: 'help', icon: 'help', label: "Mode d'emploi", hint: 'Les étapes et les raccourcis.', keys: '?', onClick: onHelp }],
  ]
  const hint = groups.flat().find((a) => a.id === hintId)

  return (
    <header className="toolbar">
      <div className="name-card">
        <h1>Configurateur 3D</h1>
        <a href={site.links.portfolio} target="_blank" rel="noreferrer">
          par {site.author}
        </a>
      </div>

      <p className={`toolbar-hint${hint ? ' visible' : ''}`} aria-live="polite">
        {hint && (
          <>
            <span className="toolbar-hint-title">
              {hint.label}
              {hint.keys && <kbd>{hint.keys}</kbd>}
            </span>
            <span>{hint.hint}</span>
          </>
        )}
      </p>

      <div
        className="toolbar-actions"
        onPointerOver={(e) => setHintId(hintIdOf(e.target))}
        onPointerLeave={() => setHintId(null)}
        onFocus={(e) => setHintId(hintIdOf(e.target))}
        onBlur={() => setHintId(null)}
      >
        {groups.map((group, i) => (
          <div key={i} className="btn-group">
            {group.map((action) => (
              <button
                key={action.id}
                data-hint={action.id}
                className={`icon-btn${action.active ? ' active' : ''}`}
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.label}
                aria-pressed={action.active}
              >
                <Icon name={action.icon} />
              </button>
            ))}
          </div>
        ))}
        <SampleMenu />
        <button className="btn primary" onClick={() => input.current?.click()}>
          <Icon name="upload" size={15} /> <span className="hide-sm">Importer</span>
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ACCEPTED_EXTENSIONS.map((e) => '.' + e).join(',')}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            if (files.length) loadFiles(files)
          }}
        />
      </div>
    </header>
  )
}
