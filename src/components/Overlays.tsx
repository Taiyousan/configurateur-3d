import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { filesFromDataTransfer, MODEL_EXTENSIONS } from '../lib/loadModel'
import { labelOf } from '../lib/materials'
import { Icon } from './Icons'

/** Zone de dépôt plein écran, active dès qu'on glisse des fichiers sur la page. */
export function DropZone() {
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)

  useEffect(() => {
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files')
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth.current++
      setDragging(true)
    }
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      if (--depth.current <= 0) {
        depth.current = 0
        setDragging(false)
      }
    }
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      e.dataTransfer!.dropEffect = 'copy'
    }
    const drop = async (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth.current = 0
      setDragging(false)
      const files = await filesFromDataTransfer(e.dataTransfer!)
      if (files.length) useStore.getState().loadFiles(files)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [])

  if (!dragging) return null
  return (
    <div className="dropzone">
      <div className="dropzone-inner">
        <Icon name="upload" size={40} />
        <p className="dropzone-title">Déposez votre modèle 3D</p>
        <p className="muted">
          {MODEL_EXTENSIONS.map((e) => '.' + e).join(' · ')} — un dossier .gltf avec ses textures fonctionne aussi
        </p>
      </div>
    </div>
  )
}

/** Nom de la pièce survolée, qui suit le curseur. */
export function HoverLabel() {
  const hovered = useStore((s) => s.hovered)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <div ref={ref} className={`hover-label${hovered ? ' visible' : ''}`} aria-hidden>
      {hovered && labelOf(hovered)}
    </div>
  )
}

export function StatusOverlay() {
  const status = useStore((s) => s.status)
  const error = useStore((s) => s.error)
  const hasModel = useStore((s) => !!s.model)
  const set = useStore((s) => s.set)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => set({ error: null }), 6000)
    return () => clearTimeout(t)
  }, [error, set])

  return (
    <>
      {status === 'loading' && (
        <div className="loading">
          <div className="spinner" />
          <span>Chargement du modèle…</span>
        </div>
      )}
      {!hasModel && status !== 'loading' && (
        <div className="welcome">
          <Icon name="upload" size={36} />
          <h2>Glissez-déposez un modèle 3D</h2>
          <p className="muted">GLB, glTF, FBX, OBJ ou STL</p>
          <button className="btn primary" onClick={() => useStore.getState().loadDemo()}>
            Essayer avec la chaussure
          </button>
        </div>
      )}
      {error && (
        <div className="toast" role="alert">
          <span>{error}</span>
          <button className="icon-btn ghost" onClick={() => set({ error: null })} aria-label="Fermer">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
    </>
  )
}
