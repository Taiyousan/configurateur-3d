import { useShallow } from 'zustand/react/shallow'
import { useStore, type EnvPreset } from '../store'
import { Icon } from './Icons'
import { Section, Slider } from './ui'

export function VariantsPanel() {
  const model = useStore((s) => s.model)
  const variants = useStore((s) => s.variants)
  const { saveVariant, applyVariant, deleteVariant, randomizeColors } = useStore.getState()

  if (!model) return null

  return (
    <section className="panel card-body">
      <Section
        title="Coloris"
        aside={
          <button className="text-btn" onClick={randomizeColors} title="Une couleur au hasard pour chaque pièce">
            <Icon name="dice" size={13} /> Au hasard
          </button>
        }
      >
        {variants.length > 0 && (
          <ul className="variants">
            {variants.map((v) => (
              <li key={v.id} className="variant">
                <button className="variant-apply" onClick={() => applyVariant(v.id)} title={`Appliquer « ${v.name} »`}>
                  <span className="variant-swatches">
                    {v.swatches.map((c) => (
                      <span key={c} style={{ background: c }} />
                    ))}
                  </span>
                  <span>{v.name}</span>
                </button>
                <button className="icon-btn small" onClick={() => deleteVariant(v.id)} aria-label={`Supprimer ${v.name}`}>
                  <Icon name="x" size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className="btn ghost full" onClick={saveVariant}>
          <Icon name="plus" size={14} /> Garder ce coloris
        </button>
      </Section>
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

export function ScenePanel({ collapsible = true }: { collapsible?: boolean }) {
  // Only the settings: the whole store would re-render the panel on every hover.
  const s = useStore(
    useShallow(({ envPreset, envIntensity, background, showEnvBackground, shadows, set }) => ({
      envPreset,
      envIntensity,
      background,
      showEnvBackground,
      shadows,
      set,
    })),
  )

  return (
    <section className="panel card-body">
      <Section title="Scène" collapsible={collapsible}>
        <label className="field-row">
          <span>Éclairage</span>
          <select value={s.envPreset} onChange={(e) => s.set({ envPreset: e.target.value as EnvPreset })}>
            {ENV_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <Slider label="Intensité" value={s.envIntensity} min={0.1} max={2.5} step={0.05} onChange={(envIntensity) => s.set({ envIntensity })} />
        <div className="field-row">
          <span>Fond</span>
          <div className="inline-controls">
            <input
              type="color"
              value={s.background}
              disabled={s.showEnvBackground}
              onChange={(e) => s.set({ background: e.target.value })}
              aria-label="Couleur de fond"
            />
            <label className="toggle">
              <input type="checkbox" checked={s.showEnvBackground} onChange={(e) => s.set({ showEnvBackground: e.target.checked })} />
              <span>Panorama</span>
            </label>
          </div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={s.shadows} onChange={(e) => s.set({ shadows: e.target.checked })} />
          <span>Ombre au sol</span>
        </label>
      </Section>
    </section>
  )
}

