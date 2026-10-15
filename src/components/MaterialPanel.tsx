import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { HexColorPicker } from 'react-colorful'
import { useStore } from '../store'
import {
  collectMaterials,
  collectMeshes,
  hasTexture,
  labelOf,
  materialsOf,
  originalState,
  readState,
  sourceIdOf,
  writeState,
  type EditableMaterial,
  type MaterialState,
} from '../lib/materials'
import { Icon } from './Icons'

export const PALETTE = [
  '#ffffff', '#e8e2d6', '#b9b4ab', '#6f6c68', '#2f2f31', '#111111',
  '#d7263d', '#f46036', '#ffb400', '#f6e27f', '#2e8b57', '#a3d9a5',
  '#1b98e0', '#13315c', '#7c5cff', '#d6b4fc', '#f4a5ae', '#8b5a2b',
]

const FINISHES = [
  { label: 'Mat', roughness: 0.95, metalness: 0 },
  { label: 'Satiné', roughness: 0.55, metalness: 0 },
  { label: 'Brillant', roughness: 0.12, metalness: 0 },
  { label: 'Métal', roughness: 0.25, metalness: 1 },
]

const HEX_RE = /^#?([0-9a-f]{6})$/i

export function MaterialPanel() {
  const model = useStore((s) => s.model)
  const selection = useStore((s) => s.selection)
  useStore((s) => s.revision)
  const { beginEdit, touch, setSelection, select, focusOn } = useStore.getState()

  const materials = useMemo(() => collectMaterials(selection), [selection])
  const meshes = useMemo(() => collectMeshes(selection), [selection])

  // Pièces qui partageaient un des matériaux d'origine de la sélection (avant clonage).
  const siblings = useMemo(() => {
    if (!model || !meshes.length) return []
    const ids = new Set(materials.map(sourceIdOf))
    return collectMeshes([model.root]).filter((m) => materialsOf(m).some((mat) => ids.has(sourceIdOf(mat))))
  }, [model, meshes, materials])

  if (!model) return null

  if (!selection.length) {
    return (
      <section className="panel material-panel empty-state">
        <Icon name="sparkles" size={22} />
        <p>
          <strong>Cliquez sur une pièce</strong> du modèle pour la sélectionner et personnaliser son matériau.
        </p>
        <p className="muted small">Maj + clic pour en sélectionner plusieurs.</p>
      </section>
    )
  }

  const state = materials.length ? readState(materials[0]) : null
  const mixed = materials.some((m) => '#' + m.color.getHexString() !== state?.color)
  const textured = materials.some(hasTexture)

  /** Applique une modification à tous les matériaux sélectionnés. */
  const apply = (partial: Partial<MaterialState>, record = true) => {
    if (record) beginEdit(materials)
    materials.forEach((m) => writeState(m, partial))
    touch()
  }
  const reset = () => {
    beginEdit(materials)
    materials.forEach((m: EditableMaterial) => writeState(m, originalState(m)))
    touch()
  }

  const single = selection.length === 1 ? selection[0] : null
  const parent = single?.parent && model.meaningful.has(single.parent) ? single.parent : null
  const title = single ? labelOf(single) : `${selection.length} éléments`

  return (
    <section className="panel material-panel">
      <header className="panel-header">
        <span className="swatch-dot" style={{ background: mixed ? 'conic-gradient(#f46036,#ffb400,#2e8b57,#1b98e0,#7c5cff,#f46036)' : state?.color }} />
        <div className="title-block">
          <h2 title={title}>{title}</h2>
          <span className="muted small">
            {meshes.length} mesh{meshes.length > 1 ? 'es' : ''} · {materials.length} matériau{materials.length > 1 ? 'x' : ''}
          </span>
        </div>
        <button className="icon-btn ghost" title="Désélectionner (Échap)" aria-label="Désélectionner" onClick={() => select(null)}>
          <Icon name="x" />
        </button>
      </header>

      <div className="chip-row">
        {parent && (
          <button className="chip" onClick={() => setSelection([parent])} title="Sélectionner le groupe parent">
            <Icon name="arrowUp" size={13} /> {labelOf(parent)}
          </button>
        )}
        {siblings.length > meshes.length && (
          <button className="chip" onClick={() => setSelection(siblings)} title="Sélectionner toutes les pièces qui partagent ce matériau">
            <Icon name="link" size={13} /> Même matériau ({siblings.length})
          </button>
        )}
        <button className="chip" onClick={() => focusOn(selection)} title="Cadrer la sélection (F)">
          <Icon name="focus" size={13} /> Cadrer
        </button>
      </div>

      {!state ? (
        <p className="muted small">Cette sélection ne contient aucun matériau modifiable.</p>
      ) : (
        <>
          <div className="field">
            <div className="field-label">
              <span>Couleur</span>
              {mixed && <span className="muted small">valeurs multiples</span>}
            </div>
            <div onPointerDownCapture={() => beginEdit(materials)} onKeyDownCapture={() => beginEdit(materials)}>
              <HexColorPicker color={state.color} onChange={(color) => apply({ color }, false)} />
            </div>
            <HexInput value={state.color} onCommit={(color) => apply({ color })} />
            <div className="palette">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  className={`palette-swatch${!mixed && c === state.color ? ' active' : ''}`}
                  style={{ background: c }}
                  onClick={() => apply({ color: c })}
                  title={c}
                  aria-label={`Couleur ${c}`}
                />
              ))}
            </div>
          </div>

          {state.roughness != null && (
            <>
              <div className="field">
                <div className="field-label">
                  <span>Finition</span>
                </div>
                <div className="segmented">
                  {FINISHES.map((f) => (
                    <button
                      key={f.label}
                      className={
                        Math.abs(f.roughness - state.roughness!) < 0.02 && f.metalness === state.metalness ? 'active' : ''
                      }
                      onClick={() => apply({ roughness: f.roughness, metalness: f.metalness })}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="Rugosité" value={state.roughness} onBegin={() => beginEdit(materials)} onChange={(roughness) => apply({ roughness }, false)} />
              <Slider label="Métallique" value={state.metalness ?? 0} onBegin={() => beginEdit(materials)} onChange={(metalness) => apply({ metalness }, false)} />
            </>
          )}

          {textured && (
            <label className="toggle">
              <input type="checkbox" checked={state.textured} onChange={(e) => apply({ textured: e.target.checked })} />
              <span>Texture d'origine</span>
            </label>
          )}

          <button className="btn ghost full" onClick={reset}>
            <Icon name="reset" size={14} /> Réinitialiser
          </button>
        </>
      )}
    </section>
  )
}

function HexInput({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const commit = () => {
    const m = HEX_RE.exec(text.trim())
    if (m && '#' + m[1].toLowerCase() !== value) onCommit('#' + m[1].toLowerCase())
    else setText(value)
  }
  return (
    <input
      className="hex-input"
      value={text}
      spellCheck={false}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      aria-label="Code hexadécimal"
    />
  )
}

interface SliderProps {
  label: string
  value: number
  onBegin: () => void
  onChange: (v: number) => void
}

function Slider({ label, value, onBegin, onChange }: SliderProps) {
  return (
    <label className="field slider">
      <div className="field-label">
        <span>{label}</span>
        <span className="muted small mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onPointerDown={onBegin}
        onKeyDown={onBegin}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ '--progress': `${value * 100}%` } as CSSProperties}
      />
    </label>
  )
}
