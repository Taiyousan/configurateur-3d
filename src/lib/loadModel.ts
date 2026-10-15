import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

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

let dracoLoader: DRACOLoader | null = null
function getDracoLoader() {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`)
  }
  return dracoLoader
}

/**
 * Charge un modèle à partir d'une liste de fichiers. Un .gltf peut être accompagné
 * de ses ressources externes (.bin, textures) : elles sont résolues par nom de fichier.
 */
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
    // Les textures sont décodées une fois chargées : on peut libérer les blobs.
    blobUrls.forEach((url) => URL.revokeObjectURL(url))
  }
}

export async function loadModelFromUrl(url: string): Promise<RawModel> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Impossible de télécharger ${url} (${res.status})`)
  const blob = await res.blob()
  return loadModelFromFiles([new File([blob], baseName(url))])
}

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
    case 'fbx':
      return new FBXLoader(manager).parse(buffer, '')
    case 'obj':
      return new OBJLoader(manager).parse(new TextDecoder().decode(buffer))
    case 'stl': {
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

/** Récupère les fichiers d'un drop, y compris le contenu des dossiers. */
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
