import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useStore } from '../store'
import { isMesh, labelOf } from '../lib/materials'
import { formatBytes, formatCount } from '../lib/format'
import { Icon } from './Icons'

export function SceneTree() {
  const model = useStore((s) => s.model)
  const selection = useStore((s) => s.selection)
  useStore((s) => s.revision) // visibility is mutated on the objects
  const [expanded, setExpanded] = useState<Set<THREE.Object3D>>(new Set())
  const [query, setQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // New model: the first two levels open.
  useEffect(() => {
    if (!model) return
    const open = new Set<THREE.Object3D>([model.root])
    model.root.children.forEach((c) => open.add(c))
    setExpanded(open)
    setQuery('')
  }, [model])

  // Picked in the 3D view: open its parents and scroll it into view.
  useEffect(() => {
    if (!selection.length) return
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const o of selection) for (let p = o.parent; p; p = p.parent) next.add(p)
      return next
    })
    requestAnimationFrame(() => {
      const last = selection[selection.length - 1]
      listRef.current?.querySelector(`[data-uuid="${last.uuid}"]`)?.scrollIntoView({ block: 'nearest' })
    })
  }, [selection])

  const matches = useMemo(() => {
    if (!model || !query.trim()) return null
    const q = query.trim().toLowerCase()
    const found: THREE.Object3D[] = []
    model.root.traverse((o) => {
      if (o !== model.root && model.meaningful.has(o) && `${labelOf(o)} ${o.name}`.toLowerCase().includes(q))
        found.push(o)
    })
    return found
  }, [model, query])

  if (!model) return null

  const toggle = (o: THREE.Object3D) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(o)) next.delete(o)
      else next.add(o)
      return next
    })

  const rows: { object: THREE.Object3D; depth: number }[] = []
  if (matches) {
    matches.forEach((object) => rows.push({ object, depth: 0 }))
  } else {
    const walk = (o: THREE.Object3D, depth: number) => {
      rows.push({ object: o, depth })
      if (expanded.has(o)) o.children.filter((c) => model.meaningful.has(c)).forEach((c) => walk(c, depth + 1))
    }
    walk(model.root, 0)
  }

  return (
    <section className="panel tree-panel">
      <header className="tree-head">
        <p className="kicker">Structure</p>
        <h2 title={model.name}>{model.name}</h2>
        <p className="meta">
          {formatBytes(model.fileSize)} · {formatCount(model.stats.triangles)} triangles · {model.stats.meshes} pièce
          {model.stats.meshes > 1 ? 's' : ''}
        </p>
      </header>
      <label className="search">
        <Icon name="search" size={13} />
        <input
          type="search"
          placeholder="Rechercher une pièce…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="tree" ref={listRef} role="tree">
        {rows.map(({ object, depth }) => (
          <TreeRow
            key={object.uuid}
            object={object}
            depth={depth}
            expandable={!matches && object.children.some((c) => model.meaningful.has(c))}
            expanded={expanded.has(object)}
            selected={selection.includes(object)}
            onToggle={() => toggle(object)}
          />
        ))}
        {matches?.length === 0 && <p className="muted small empty">Aucun résultat</p>}
      </div>
    </section>
  )
}

interface RowProps {
  object: THREE.Object3D
  depth: number
  expandable: boolean
  expanded: boolean
  selected: boolean
  onToggle: () => void
}

function TreeRow({ object, depth, expandable, expanded, selected, onToggle }: RowProps) {
  const hovered = useStore((s) => s.hovered === object)
  const { select, setHovered, focusOn, touch } = useStore.getState()
  const label = labelOf(object)
  const secondary = object.name && object.name !== label ? object.name : null

  const onClick = (e: MouseEvent) => select(object, e.shiftKey || e.ctrlKey || e.metaKey)
  const toggleVisibility = (e: MouseEvent) => {
    e.stopPropagation()
    object.visible = !object.visible
    touch()
  }

  return (
    <div
      className={`tree-row${selected ? ' selected' : ''}${hovered ? ' hovered' : ''}${object.visible ? '' : ' hidden'}`}
      style={{ paddingLeft: 6 + depth * 14 }}
      data-uuid={object.uuid}
      role="treeitem"
      aria-selected={selected}
      aria-expanded={expandable ? expanded : undefined}
      onClick={onClick}
      onDoubleClick={() => focusOn(object)}
      onPointerEnter={() => setHovered(object)}
      onPointerLeave={() => setHovered(null)}
    >
      <button
        className={`caret${expanded ? ' open' : ''}`}
        style={{ visibility: expandable ? 'visible' : 'hidden' }}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        aria-label={expanded ? 'Replier' : 'Déplier'}
      >
        <Icon name="chevron" size={12} />
      </button>
      <Icon name={isMesh(object) ? 'box' : 'layers'} size={14} className="row-icon" />
      <span className="row-label" title={label}>
        {label}
      </span>
      {secondary && <span className="row-secondary">{secondary}</span>}
      <button
        className="icon-btn ghost eye"
        onClick={toggleVisibility}
        title={object.visible ? 'Masquer' : 'Afficher'}
        aria-label={object.visible ? 'Masquer' : 'Afficher'}
      >
        <Icon name={object.visible ? 'eye' : 'eyeOff'} size={14} />
      </button>
    </div>
  )
}
