import { useRef, useState } from 'react'
import { useStore } from '../store'
import { ACCEPTED_EXTENSIONS } from '../lib/loadModel'
import { exportGLB, takeScreenshot } from '../lib/exporters'
import { rendererRef } from './Viewer'
import { Icon } from './Icons'

const formatBytes = (n: number) =>
  n > 1e6 ? `${(n / 1e6).toFixed(1)} Mo` : n > 1e3 ? `${Math.round(n / 1e3)} Ko` : `${n} o`

const formatCount = (n: number) => (n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)} k` : String(n))

export function Toolbar() {
  const model = useStore((s) => s.model)
  const canUndo = useStore((s) => s.undoStack.length > 0)
  const canRedo = useStore((s) => s.redoStack.length > 0)
  const autoRotate = useStore((s) => s.autoRotate)
  const { loadFiles, loadDemo, undo, redo, focusOn, set } = useStore.getState()
  const input = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)

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

  return (
    <header className="toolbar">
      <div className="brand">
        <div className="logo" aria-hidden>
          <Icon name="box" size={18} />
        </div>
        <div>
          <h1>Configurateur 3D</h1>
          {model && (
            <p className="muted small model-meta" title={model.name}>
              <span className="model-name">{model.name}</span>
              <span>·</span>
              <span>{formatBytes(model.fileSize)}</span>
              <span>·</span>
              <span>{formatCount(model.stats.triangles)} triangles</span>
            </p>
          )}
        </div>
      </div>

      <div className="toolbar-actions">
        <div className="btn-group">
          <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Annuler (Ctrl+Z)" aria-label="Annuler">
            <Icon name="undo" />
          </button>
          <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Rétablir (Ctrl+Y)" aria-label="Rétablir">
            <Icon name="redo" />
          </button>
        </div>
        <div className="btn-group">
          <button
            className={`icon-btn${autoRotate ? ' active' : ''}`}
            onClick={() => set({ autoRotate: !autoRotate })}
            title="Rotation automatique"
            aria-pressed={autoRotate}
            aria-label="Rotation automatique"
          >
            <Icon name="rotate" />
          </button>
          <button className="icon-btn" onClick={() => focusOn(null)} title="Recadrer le modèle" aria-label="Recadrer">
            <Icon name="focus" />
          </button>
          <button
            className="icon-btn"
            onClick={() => rendererRef.current && takeScreenshot(rendererRef.current, baseName)}
            disabled={!model}
            title="Capture PNG"
            aria-label="Capture PNG"
          >
            <Icon name="camera" />
          </button>
          <button className="icon-btn" onClick={onExport} disabled={!model || exporting} title="Exporter en GLB" aria-label="Exporter en GLB">
            <Icon name="download" />
          </button>
        </div>
        <button className="btn ghost hide-sm" onClick={loadDemo}>
          Chaussure démo
        </button>
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
