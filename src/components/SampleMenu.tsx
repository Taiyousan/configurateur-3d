import { useStore } from '../store'
import { SAMPLES } from '../lib/samples'
import { Icon } from './Icons'
import { Menu } from './ui'

// The example models, in a list that drops down under the toolbar button.
export function SampleMenu({ compact = false }: { compact?: boolean }) {
  const sampleId = useStore((s) => s.sampleId)

  return (
    <Menu
      label="Modèles d'exemple"
      className={compact ? 'icon-btn floating' : 'btn'}
      button={
        compact ? (
          <Icon name="box" />
        ) : (
          <>
            <Icon name="box" size={15} /> Exemples
            <Icon name="chevronDown" size={13} />
          </>
        )
      }
    >
      {(close) =>
        SAMPLES.map((s) => (
          <button
            key={s.id}
            aria-current={s.id === sampleId}
            className="menu-item"
            onClick={() => {
              close()
              useStore.getState().loadSample(s.id)
            }}
          >
            {s.name}
          </button>
        ))
      }
    </Menu>
  )
}
