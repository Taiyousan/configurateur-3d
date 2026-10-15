import * as THREE from 'three'

export type EditableMaterial = THREE.Material & { color: THREE.Color }

export interface MaterialState {
  color: string
  roughness: number | null
  metalness: number | null
  textured: boolean
}

export type Snapshot = Map<EditableMaterial, MaterialState>

// A strip of paint chips: neutrals on the first row, colours by hue on the second.
export const PALETTE = [
  '#ffffff', '#f1e8d4', '#e6d3ae', '#c9ced6', '#7d8088', '#34353b', '#1d1e22', '#7b5b3e', '#a4493a',
  '#b8433a', '#d9713a', '#d29a3a', '#e2b54c', '#3f7a4a', '#2e4a36', '#2f7f82', '#2f4f7f', '#6b3f63',
]

// Each material's original state, for resets.
const originals = new WeakMap<THREE.Material, MaterialState>()
// Textures the user turned off, to put them back.
const removedMaps = new WeakMap<THREE.Material, THREE.Texture>()
// Source material (before cloning): finds the parts that shared it.
const sourceIds = new WeakMap<THREE.Material, string>()

export const isMesh = (o: THREE.Object3D): o is THREE.Mesh => (o as THREE.Mesh).isMesh === true

export const isEditable = (m: THREE.Material): m is EditableMaterial =>
  (m as Partial<EditableMaterial>).color instanceof THREE.Color

const isStandard = (m: THREE.Material): m is THREE.MeshStandardMaterial =>
  (m as THREE.MeshStandardMaterial).isMeshStandardMaterial === true

export const materialsOf = (mesh: THREE.Mesh): THREE.Material[] =>
  Array.isArray(mesh.material) ? mesh.material : [mesh.material]

// Unique editable materials of every mesh under the given objects.
export function collectMaterials(objects: THREE.Object3D[]): EditableMaterial[] {
  const set = new Set<EditableMaterial>()
  for (const obj of objects) {
    obj.traverse((o) => {
      if (isMesh(o)) materialsOf(o).filter(isEditable).forEach((m) => set.add(m))
    })
  }
  return [...set]
}

export function collectMeshes(objects: THREE.Object3D[]): THREE.Mesh[] {
  const set = new Set<THREE.Mesh>()
  for (const obj of objects) obj.traverse((o) => isMesh(o) && set.add(o))
  return [...set]
}

export function readState(m: EditableMaterial): MaterialState {
  return {
    color: '#' + m.color.getHexString(),
    roughness: isStandard(m) ? m.roughness : null,
    metalness: isStandard(m) ? m.metalness : null,
    textured: !removedMaps.has(m),
  }
}

export function writeState(m: EditableMaterial, state: Partial<MaterialState>) {
  if (state.color) m.color.set(state.color)
  if (isStandard(m)) {
    if (state.roughness != null) m.roughness = state.roughness
    if (state.metalness != null) m.metalness = state.metalness
  }
  if (state.textured !== undefined) setTextured(m, state.textured)
}

function setTextured(m: EditableMaterial, textured: boolean) {
  const mat = m as EditableMaterial & { map?: THREE.Texture | null }
  if (!textured && mat.map) {
    removedMaps.set(m, mat.map)
    mat.map = null
    m.needsUpdate = true
  } else if (textured && removedMaps.has(m)) {
    mat.map = removedMaps.get(m)!
    removedMaps.delete(m)
    m.needsUpdate = true
  }
}

export const hasTexture = (m: EditableMaterial) =>
  removedMaps.has(m) || !!(m as EditableMaterial & { map?: THREE.Texture | null }).map

export const originalState = (m: EditableMaterial) => originals.get(m) ?? readState(m)

export const sourceIdOf = (m: THREE.Material) => sourceIds.get(m) ?? m.uuid

export const snapshot = (materials: EditableMaterial[]): Snapshot =>
  new Map(materials.map((m) => [m, readState(m)]))

export const applySnapshot = (snap: Snapshot) => snap.forEach((state, m) => writeState(m, state))

// OBJ/FBX loaders give Phong/Lambert materials: turned into PBR.
function toStandard(m: THREE.Material): THREE.Material {
  if (!(m instanceof THREE.MeshPhongMaterial || m instanceof THREE.MeshLambertMaterial)) return m.clone()
  const std = new THREE.MeshStandardMaterial({
    name: m.name,
    color: m.color,
    map: m.map,
    normalMap: m.normalMap,
    emissive: m.emissive,
    emissiveMap: m.emissiveMap,
    transparent: m.transparent,
    opacity: m.opacity,
    side: m.side,
    vertexColors: m.vertexColors,
    roughness: m instanceof THREE.MeshPhongMaterial ? 1 - Math.min(m.shininess / 100, 0.9) : 0.9,
    metalness: 0,
  })
  return std
}

export interface ModelStats {
  meshes: number
  materials: number
  triangles: number
  vertices: number
}

export interface PreparedModel {
  /** Objects holding at least one mesh: the ones the scene tree lists. */
  meaningful: Set<THREE.Object3D>
  stats: ModelStats
  /** Scale and offset so the model fits in ~2 units, standing on the ground. */
  scale: number
  offset: THREE.Vector3
}

// Clones each mesh's materials so every part can be edited on its own,
// keeps their original state, and works out stats and framing.
export function prepareModel(root: THREE.Object3D): PreparedModel {
  const meaningful = new Set<THREE.Object3D>()
  const sourceMaterials = new Set<string>()
  let triangles = 0
  let vertices = 0
  let meshes = 0

  root.updateMatrixWorld(true)
  root.traverse((o) => {
    if (!isMesh(o)) return
    meshes++
    o.castShadow = true
    o.receiveShadow = true

    const cloned = materialsOf(o).map((src) => {
      sourceMaterials.add(src.uuid)
      const m = toStandard(src)
      sourceIds.set(m, sourceIds.get(src) ?? src.uuid)
      if (isEditable(m)) originals.set(m, readState(m))
      return m
    })
    o.material = Array.isArray(o.material) ? cloned : cloned[0]

    const g = o.geometry
    const pos = g.getAttribute('position')
    if (pos) {
      vertices += pos.count
      triangles += (g.index ? g.index.count : pos.count) / 3
    }
    for (let p: THREE.Object3D | null = o; p; p = p.parent) {
      meaningful.add(p)
      if (p === root) break
    }
  })

  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1

  return {
    meaningful,
    stats: { meshes, materials: sourceMaterials.size, triangles: Math.round(triangles), vertices },
    scale: 2 / maxDim,
    offset: new THREE.Vector3(-center.x, -box.min.y, -center.z),
  }
}

export function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    if (!isMesh(o)) return
    o.geometry.dispose()
    for (const m of materialsOf(o)) {
      for (const value of Object.values(m)) {
        if (value instanceof THREE.Texture) value.dispose()
      }
      removedMaps.get(m)?.dispose()
      m.dispose()
    }
  })
}

// Display name: for a mesh, its material's name usually says more.
export function labelOf(o: THREE.Object3D): string {
  if (isMesh(o)) {
    const mats = materialsOf(o)
    if (mats.length === 1 && mats[0].name) return mats[0].name
  }
  return o.name || (isMesh(o) ? 'Mesh sans nom' : 'Groupe')
}
