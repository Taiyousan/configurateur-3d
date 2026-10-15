import * as THREE from 'three'
import { create } from 'zustand'
import { loadModelFromFiles, loadModelFromUrl, type RawModel } from './lib/loadModel'
import {
  applySnapshot,
  collectMaterials,
  disposeObject,
  prepareModel,
  snapshot,
  type EditableMaterial,
  type PreparedModel,
  type Snapshot,
} from './lib/materials'

export const DEMO_MODEL_URL = `${import.meta.env.BASE_URL}models/shoe-draco.glb`

export type EnvPreset = 'studio' | 'city' | 'sunset' | 'dawn' | 'warehouse' | 'forest' | 'night'

export interface LoadedModel extends RawModel, PreparedModel {
  id: number
}

export interface Variant {
  id: number
  name: string
  snapshot: Snapshot
  swatches: string[]
}

interface State {
  model: LoadedModel | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null

  selection: THREE.Object3D[]
  hovered: THREE.Object3D | null
  /** Incrémenté à chaque mutation des objets three.js pour rafraîchir l'UI. */
  revision: number
  /** Demande de cadrage caméra : `targets` null = tout le modèle. */
  focus: { targets: THREE.Object3D[] | null; nonce: number }

  undoStack: Snapshot[]
  redoStack: Snapshot[]
  variants: Variant[]

  autoRotate: boolean
  envPreset: EnvPreset
  envIntensity: number
  showEnvBackground: boolean
  background: string
  shadows: boolean

  loadFiles: (files: File[]) => Promise<void>
  loadDemo: () => Promise<void>
  select: (obj: THREE.Object3D | null, additive?: boolean) => void
  setSelection: (objs: THREE.Object3D[]) => void
  setHovered: (obj: THREE.Object3D | null) => void
  touch: () => void
  focusOn: (target: THREE.Object3D | THREE.Object3D[] | null) => void

  /** À appeler avant une modification de matériaux pour pouvoir l'annuler. */
  beginEdit: (materials: EditableMaterial[]) => void
  undo: () => void
  redo: () => void

  saveVariant: () => void
  applyVariant: (id: number) => void
  deleteVariant: (id: number) => void

  set: (partial: Partial<State>) => void
}

let nextId = 1

export const useStore = create<State>((set, get) => {
  const load = async (loader: () => Promise<RawModel>) => {
    set({ status: 'loading', error: null })
    try {
      const raw = await loader()
      const prepared = prepareModel(raw.root)
      if (prepared.stats.meshes === 0) throw new Error('Le fichier ne contient aucun mesh affichable.')
      const previous = get().model
      set({
        model: { ...raw, ...prepared, id: nextId++ },
        status: 'ready',
        selection: [],
        hovered: null,
        undoStack: [],
        redoStack: [],
        variants: [],
        focus: { targets: null, nonce: Date.now() },
      })
      if (previous) disposeObject(previous.root)
    } catch (e) {
      console.error(e)
      set({ status: get().model ? 'ready' : 'error', error: e instanceof Error ? e.message : String(e) })
    }
  }

  const swap = (from: 'undoStack' | 'redoStack', to: 'undoStack' | 'redoStack') => {
    const stack = get()[from]
    const entry = stack[stack.length - 1]
    if (!entry) return
    const current = snapshot([...entry.keys()])
    applySnapshot(entry)
    set((s) => ({
      [from]: stack.slice(0, -1),
      [to]: [...s[to], current],
      revision: s.revision + 1,
    }))
  }

  return {
    model: null,
    status: 'idle',
    error: null,
    selection: [],
    hovered: null,
    revision: 0,
    focus: { targets: null, nonce: 0 },
    undoStack: [],
    redoStack: [],
    variants: [],

    autoRotate: false,
    envPreset: 'city',
    envIntensity: 1,
    showEnvBackground: false,
    background: '#e9e7e3',
    shadows: true,

    loadFiles: (files) => load(() => loadModelFromFiles(files)),
    loadDemo: () => load(() => loadModelFromUrl(DEMO_MODEL_URL)),

    select: (obj, additive = false) => {
      if (!obj) return set({ selection: [] })
      const current = get().selection
      if (!additive) return set({ selection: [obj] })
      set({ selection: current.includes(obj) ? current.filter((o) => o !== obj) : [...current, obj] })
    },
    setSelection: (objs) => set({ selection: objs }),
    setHovered: (obj) => get().hovered !== obj && set({ hovered: obj }),
    touch: () => set((s) => ({ revision: s.revision + 1 })),
    focusOn: (target) =>
      set({ focus: { targets: target && (Array.isArray(target) ? target : [target]), nonce: Date.now() } }),

    beginEdit: (materials) => {
      if (!materials.length) return
      set((s) => ({ undoStack: [...s.undoStack.slice(-99), snapshot(materials)], redoStack: [] }))
    },
    undo: () => swap('undoStack', 'redoStack'),
    redo: () => swap('redoStack', 'undoStack'),

    saveVariant: () => {
      const { model, variants } = get()
      if (!model) return
      const materials = collectMaterials([model.root])
      const snap = snapshot(materials)
      const swatches = [...new Set([...snap.values()].map((s) => s.color))].slice(0, 6)
      const id = nextId++
      set({ variants: [...variants, { id, name: `Coloris ${variants.length + 1}`, snapshot: snap, swatches }] })
    },
    applyVariant: (id) => {
      const variant = get().variants.find((v) => v.id === id)
      if (!variant) return
      get().beginEdit([...variant.snapshot.keys()])
      applySnapshot(variant.snapshot)
      get().touch()
    },
    deleteVariant: (id) => set((s) => ({ variants: s.variants.filter((v) => v.id !== id) })),

    set: (partial) => set(partial),
  }
})
