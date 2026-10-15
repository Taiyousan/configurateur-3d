import { useEffect, useMemo, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { useStore } from '../store'
import {
  collectMaterials,
  collectMeshes,
  hasTexture,
  labelOf,
  materialsOf,
  originalState,
  PALETTE,
  readState,
  sourceIdOf,
  writeState,
  type MaterialState,
} from '../lib/materials'
import { Icon } from './Icons'
import { Section, Slider } from './ui'

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

  // Parts that shared one of the selection's source materials (before cloning).
  const siblings = useMemo(() => {
    if (!model || !meshes.length) return []
    const ids = new Set(materials.map(sourceIdOf))
    return collectMeshes([model.root]).filter((m) => materialsOf(m).some((mat) => ids.has(sourceIdOf(mat))))
  }, [model, meshes, materials])

  if (!model) return null

  if (!selection.length) {
    return (
      <section className="panel material-panel">
        <header className="card-head">
          <p className="kicker">Aucune sélection</p>
          <h2>Choisissez une pièce</h2>
        </header>
        <div className="card-body empty-state">
          <Icon name="pointer" size={20} />
          <p>Cliquez sur une pièce du modèle, ou dans la structure, pour changer sa couleur et sa finition.</p>
          <p className="muted small">Maj + clic pour en sélectionner plusieurs.</p>
        </div>
      </section>
    )
  }

  const state = materials.length ? readState(materials[0]) : null
  const mixed = materials.some((m) => '#' + m.color.getHexString() !== state?.color)
  const textured = materials.some(hasTexture)

  /** Applies a change to every selected material. */
  const apply = (partial: Partial<MaterialState>, record = true) => {
    if (record) beginEdit(materials)
    materials.forEach((m) => writeState(m, partial))
    touch()
  }
  const reset = () => {
    beginEdit(materials)
    materials.forEach((m) => writeState(m, originalState(m)))
    touch()
  }

  const single = selection.length === 1 ? selection[0] : null
  const parent = single?.parent && model.meaningful.has(single.parent) ? single.parent : null
  const title = single ? labelOf(single) : `${selection.length} pièces`

  return (
    <section className="panel material-panel">
      <header className="card-head">
        <div className="card-head-row">
          <div className="title-block">
            <p className="kicker">
              {meshes.length} mesh{meshes.length > 1 ? 'es' : ''} · {materials.length} matériau{materials.length > 1 ? 'x' : ''}
            </p>
            <h2 title={title}>{title}</h2>
          </div>
          <button className="icon-btn on-ink" title="Désélectionner (Échap)" aria-label="Désélectionner" onClick={() => select(null)}>
            <Icon name="x" />
          </button>
        </div>
        <div className="chip-row">
          {parent && (
            <button className="chip" onClick={() => setSelection([parent])} title="Sélectionner le groupe parent">
              <Icon name="arrowUp" size={12} /> {labelOf(parent)}
            </button>
          )}
          {siblings.length > meshes.length && (
            <button className="chip" onClick={() => setSelection(siblings)} title="Sélectionner toutes les pièces qui partagent ce matériau">
              <Icon name="link" size={12} /> Même matériau ({siblings.length})
            </button>
          )}
          <button className="chip" onClick={() => focusOn(selection)} title="Cadrer la sélection (F)">
            <Icon name="focus" size={12} /> Cadrer
          </button>
        </div>
      </header>

      <div className="card-body">
        {!state ? (
          <p className="muted small">Cette sélection ne contient aucun matériau modifiable.</p>
        ) : (
          <>
            <Section title="Couleur" aside={<span className="mono">{mixed ? 'Plusieurs' : state.color.toUpperCase()}</span>}>
              <div className="chips" role="radiogroup" aria-label="Couleurs">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    role="radio"
                    aria-checked={!mixed && color === state.color}
                    aria-label={color}
                    className="chip-color"
                    style={{ background: color }}
                    onClick={() => apply({ color })}
                  />
                ))}
              </div>
              <div onPointerDownCapture={() => beginEdit(materials)} onKeyDownCapture={() => beginEdit(materials)}>
                <HexColorPicker color={state.color} onChange={(color) => apply({ color }, false)} />
              </div>
              <HexInput value={state.color} onCommit={(color) => apply({ color })} />
            </Section>

            {state.roughness != null && (
              <Section title="Finition">
                <div className="segmented">
                  {FINISHES.map((f) => (
                    <button
                      key={f.label}
                      className={Math.abs(f.roughness - state.roughness!) < 0.02 && f.metalness === state.metalness ? 'active' : ''}
                      onClick={() => apply({ roughness: f.roughness, metalness: f.metalness })}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <Slider label="Rugosité" value={state.roughness} onBegin={() => beginEdit(materials)} onChange={(roughness) => apply({ roughness }, false)} />
                <Slider label="Métal" value={state.metalness ?? 0} onBegin={() => beginEdit(materials)} onChange={(metalness) => apply({ metalness }, false)} />
              </Section>
            )}

            {textured && (
              <label className="toggle">
                <input type="checkbox" checked={state.textured} onChange={(e) => apply({ textured: e.target.checked })} />
                <span>Texture d'origine</span>
              </label>
            )}

            <button className="btn ghost full" onClick={reset}>
              <Icon name="reset" size={14} /> D'origine
            </button>
          </>
        )}
      </div>
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
