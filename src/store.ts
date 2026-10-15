import * as THREE from 'three'
import { create } from 'zustand'
import { loadModelFromFiles, loadModelFromUrl, type RawModel } from './lib/loadModel'
import { DEFAULT_SAMPLE, SAMPLES, sampleUrl } from './lib/samples'
import {
  applySnapshot,
  collectMaterials,
  disposeObject,
  originalState,
  PALETTE,
  prepareModel,
  snapshot,
  writeState,
  type EditableMaterial,
  type PreparedModel,
  type Snapshot,
} from './lib/materials'

export type EnvPreset = 'studio' | 'city' | 'sunset' | 'dawn' | 'warehouse' | 'forest' | 'night'

const SCENE_DEFAULTS = {
  autoRotate: false,
  envPreset: 'city' as EnvPreset,
  envIntensity: 1,
  showEnvBackground: false,
  background: '#e3dccd',
  shadows: true,
}

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
  /** The example on screen, null for an imported file. */
  sampleId: string | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null

  selection: THREE.Object3D[]
  hovered: THREE.Object3D | null
  /** Bumped on each mutation of the three.js objects, to refresh the UI. */
  revision: number
  /** File stats and technical names, hidden by default. */
  showDetails: boolean
  /** Camera framing request: `targets` null frames the whole model. */
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
  loadSample: (id?: string) => Promise<void>
  select: (obj: THREE.Object3D | null, additive?: boolean) => void
  setSelection: (objs: THREE.Object3D[]) => void
  setHovered: (obj: THREE.Object3D | null) => void
  touch: () => void
  focusOn: (target: THREE.Object3D | THREE.Object3D[] | null) => void

  /** Call before changing materials, so the change can be undone. */
  beginEdit: (materials: EditableMaterial[]) => void
  undo: () => void
  redo: () => void

  saveVariant: () => void
  applyVariant: (id: number) => void
  deleteVariant: (id: number) => void

  resetCamera: () => void
  /** A random palette colour on every material (undoable). */
  randomizeColors: () => void
  /** Every material back to its original state (undoable). */
  resetMaterials: () => void
  /** Materials, hidden parts, scene settings and camera. Selection and saved colourways stay. */
  resetAll: () => void

  set: (partial: Partial<State>) => void
}

let nextId = 1
let loadToken = 0

export const useStore = create<State>((set, get) => {
  const load = async (loader: () => Promise<RawModel>, sampleId: string | null = null) => {
    const token = ++loadToken
    set({ status: 'loading', error: null })
    try {
      const raw = await loader()
      // Another load started in the meantime: the latest one wins.
      if (token !== loadToken) return disposeObject(raw.root)
      const prepared = prepareModel(raw.root)
      if (prepared.stats.meshes === 0) throw new Error('Le fichier ne contient aucun mesh affichable.')
      const previous = get().model
      set({
        model: { ...raw, ...prepared, id: nextId++ },
        sampleId,
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
      if (token !== loadToken) return
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

  // Changes every material of the model, as one undoable step.
  const editAll = (change: (m: EditableMaterial) => void) => {
    const model = get().model
    if (!model) return
    const materials = collectMaterials([model.root])
    get().beginEdit(materials)
    materials.forEach(change)
    get().touch()
  }

  return {
    model: null,
    sampleId: null,
    status: 'idle',
    error: null,
    selection: [],
    hovered: null,
    revision: 0,
    showDetails: false,
    focus: { targets: null, nonce: 0 },
    undoStack: [],
    redoStack: [],
    variants: [],

    ...SCENE_DEFAULTS,

    loadFiles: (files) => load(() => loadModelFromFiles(files)),
    loadSample: (id = DEFAULT_SAMPLE.id) => {
      const sample = SAMPLES.find((s) => s.id === id) ?? DEFAULT_SAMPLE
      return load(() => loadModelFromUrl(sampleUrl(sample)), sample.id)
    },

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

    resetCamera: () => get().focusOn(null),
    randomizeColors: () => editAll((m) => m.color.set(PALETTE[Math.floor(Math.random() * PALETTE.length)])),
    resetMaterials: () => editAll((m) => writeState(m, originalState(m))),
    resetAll: () => {
      const model = get().model
      if (!model) return
      get().resetMaterials()
      model.root.traverse((o) => (o.visible = true))
      set((s) => ({ ...SCENE_DEFAULTS, revision: s.revision + 1 }))
      get().resetCamera()
    },

    set: (partial) => set(partial),
  }
})
