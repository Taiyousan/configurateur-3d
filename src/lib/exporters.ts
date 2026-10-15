import type * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

export function takeScreenshot(renderer: THREE.WebGLRenderer, name: string) {
  download(renderer.domElement.toDataURL('image/png'), `${name}.png`)
}

/** Exporte le modèle personnalisé (pièces masquées exclues) en GLB. */
export async function exportGLB(root: THREE.Object3D, name: string) {
  const result = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true })
  const url = URL.createObjectURL(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }))
  download(url, `${name}-configure.glb`)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
