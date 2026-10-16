import type * as THREE from 'three'
import type { Insets } from './layout'

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

// The view as it is seen: the parts under the panels are cropped out, since the
// model is centred in what remains.
export function takeScreenshot(renderer: THREE.WebGLRenderer, name: string, insets: Insets) {
  const source = renderer.domElement
  const ratio = source.width / source.clientWidth
  const x = Math.round(insets.left * ratio)
  const y = Math.round(insets.top * ratio)
  const width = source.width - x - Math.round(insets.right * ratio)
  const height = source.height - y - Math.round(insets.bottom * ratio)
  const crop = document.createElement('canvas')
  crop.width = width
  crop.height = height
  crop.getContext('2d')!.drawImage(source, x, y, width, height, 0, 0, width, height)
  download(crop.toDataURL('image/png'), `${name}.png`)
}

// The customised model as GLB, hidden parts left out. The exporter loads on first use.
export async function exportGLB(root: THREE.Object3D, name: string) {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const result = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true })
  const url = URL.createObjectURL(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }))
  download(url, `${name}-configure.glb`)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
