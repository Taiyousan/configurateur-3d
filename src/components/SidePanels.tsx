import type { CSSProperties } from 'react'
import { useStore, type EnvPreset } from '../store'
import { collectMaterials } from '../lib/materials'
import { PALETTE } from './MaterialPanel'
import { Icon } from './Icons'

export function VariantsPanel() {
  const model = useStore((s) => s.model)
  const variants = useStore((s) => s.variants)
  const { saveVariant, applyVariant, deleteVariant, beginEdit, touch } = useStore.getState()

  if (!model) return null

  const randomize = () => {
    const materials = collectMaterials([model.root])
    beginEdit(materials)
    for (const m of materials) m.color.set(PALETTE[Math.floor(Math.random() * PALETTE.length)])
    touch()
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <Icon name="sparkles" />
        <h2>Coloris</h2>
        <button className="icon-btn ghost" onClick={randomize} title="Coloris aléatoire" aria-label="Coloris aléatoire">
          <Icon name="dice" />
        </button>
      </header>
      <div className="variants">
        {variants.map((v) => (
          <div key={v.id} className="variant">
            <button className="variant-apply" onClick={() => applyVariant(v.id)} title={`Appliquer « ${v.name} »`}>
              <span className="variant-swatches">
                {v.swatches.map((c) => (
                  <span key={c} style={{ background: c }} />
                ))}
              </span>
              <span>{v.name}</span>
            </button>
            <button className="icon-btn ghost" onClick={() => deleteVariant(v.id)} aria-label={`Supprimer ${v.name}`}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
        <button className="btn ghost full" onClick={saveVariant}>
          <Icon name="plus" size={14} /> Enregistrer le coloris actuel
        </button>
      </div>
    </section>
  )
}

const ENV_PRESETS: { value: EnvPreset; label: string }[] = [
  { value: 'studio', label: 'Studio' },
  { value: 'city', label: 'Ville' },
  { value: 'warehouse', label: 'Entrepôt' },
  { value: 'sunset', label: 'Coucher de soleil' },
  { value: 'dawn', label: 'Aube' },
  { value: 'forest', label: 'Forêt' },
  { value: 'night', label: 'Nuit' },
]

export function ScenePanel() {
  const s = useStore()

  return (
    <section className="panel">
      <header className="panel-header">
        <Icon name="sun" />
        <h2>Scène</h2>
      </header>
      <label className="field">
        <div className="field-label">
          <span>Éclairage</span>
        </div>
        <select value={s.envPreset} onChange={(e) => s.set({ envPreset: e.target.value as EnvPreset })}>
          {ENV_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field slider">
        <div className="field-label">
          <span>Intensité</span>
          <span className="muted small mono">{s.envIntensity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={2.5}
          step={0.05}
          value={s.envIntensity}
          onChange={(e) => s.set({ envIntensity: parseFloat(e.target.value) })}
          style={{ '--progress': `${((s.envIntensity - 0.1) / 2.4) * 100}%` } as CSSProperties}
        />
      </label>
      <div className="field inline">
        <span>Fond</span>
        <div className="inline-controls">
          <input
            type="color"
            value={s.background}
            disabled={s.showEnvBackground}
            onChange={(e) => s.set({ background: e.target.value })}
            aria-label="Couleur de fond"
          />
          <label className="toggle compact">
            <input
              type="checkbox"
              checked={s.showEnvBackground}
              onChange={(e) => s.set({ showEnvBackground: e.target.checked })}
            />
            <span>Panorama</span>
          </label>
        </div>
      </div>
      <label className="toggle">
        <input type="checkbox" checked={s.shadows} onChange={(e) => s.set({ shadows: e.target.checked })} />
        <span>Ombres au sol</span>
      </label>
    </section>
  )
}
