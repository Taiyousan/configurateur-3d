import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import dracoWasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url'
import dracoWrapper from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url'

export const MODEL_EXTENSIONS = ['glb', 'gltf', 'fbx', 'obj', 'stl'] as const
export const ACCEPTED_EXTENSIONS = [...MODEL_EXTENSIONS, 'bin', 'png', 'jpg', 'jpeg', 'webp']

export interface RawModel {
  root: THREE.Object3D
  name: string
  fileSize: number
  format: string
}

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''
const baseName = (path: string) => decodeURIComponent(path).split(/[\\/]/).pop() ?? path

// three's own decoder (glTF build), served by Vite. Imported explicitly: three's
// built-in URLs break in dev, once Vite has pre-bundled it.
let dracoLoader: DRACOLoader | null = null
const getDracoLoader = () => (dracoLoader ??= new DRACOLoader().setDecoderPath({ js: dracoWrapper, wasm: dracoWasm }))

// Loads a model from a list of files. A .gltf may come with its external
// resources (.bin, textures): they are resolved by file name.
export async function loadModelFromFiles(files: File[]): Promise<RawModel> {
  const main = MODEL_EXTENSIONS.map((ext) => files.find((f) => extOf(f.name) === ext)).find(Boolean)
  if (!main) {
    throw new Error(`Aucun modèle reconnu. Formats acceptés : ${MODEL_EXTENSIONS.map((e) => '.' + e).join(', ')}`)
  }

  const blobUrls = new Map<string, string>()
  for (const f of files) {
    if (f !== main) blobUrls.set(f.name, URL.createObjectURL(f))
  }
  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) => blobUrls.get(baseName(url)) ?? url)

  const format = extOf(main.name)
  try {
    const buffer = await main.arrayBuffer()
    const root = await parse(format, buffer, manager)
    root.name ||= main.name.replace(/\.[^.]+$/, '')
    return { root, name: main.name, fileSize: files.reduce((s, f) => s + f.size, 0), format }
  } finally {
    // Textures are decoded once loaded: the blobs can go.
    blobUrls.forEach((url) => URL.revokeObjectURL(url))
  }
}

export async function loadModelFromUrl(url: string): Promise<RawModel> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Impossible de télécharger ${url} (${res.status})`)
  const blob = await res.blob()
  return loadModelFromFiles([new File([blob], baseName(url))])
}

// Only glTF is bundled up front (the demo needs it): the other loaders come on demand.
async function parse(format: string, buffer: ArrayBuffer, manager: THREE.LoadingManager): Promise<THREE.Object3D> {
  switch (format) {
    case 'glb':
    case 'gltf': {
      const loader = new GLTFLoader(manager)
      loader.setDRACOLoader(getDracoLoader())
      loader.setMeshoptDecoder(MeshoptDecoder)
      const gltf = await loader.parseAsync(buffer, '')
      return gltf.scene
    }
    case 'fbx': {
      const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js')
      return new FBXLoader(manager).parse(buffer, '')
    }
    case 'obj': {
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')
      return new OBJLoader(manager).parse(new TextDecoder().decode(buffer))
    }
    case 'stl': {
      const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js')
      const geometry = new STLLoader(manager).parse(buffer)
      geometry.computeVertexNormals()
      const material = new THREE.MeshStandardMaterial({
        color: '#b8bcc6',
        roughness: 0.5,
        vertexColors: geometry.hasAttribute('color'),
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.name = 'STL'
      const group = new THREE.Group()
      group.add(mesh)
      return group
    }
    default:
      throw new Error(`Format non pris en charge : .${format}`)
  }
}

// The files of a drop, folders included.
export async function filesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const entries = Array.from(dt.items)
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e)
  if (!entries.length) return Array.from(dt.files)

  const files: File[] = []
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      files.push(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)))
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      let batch: FileSystemEntry[]
      do {
        batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej))
        await Promise.all(batch.map(walk))
      } while (batch.length)
    }
  }
  await Promise.all(entries.map(walk))
  return files
}
