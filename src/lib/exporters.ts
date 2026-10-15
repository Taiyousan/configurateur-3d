import type * as THREE from 'three'

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

export function takeScreenshot(renderer: THREE.WebGLRenderer, name: string) {
  download(renderer.domElement.toDataURL('image/png'), `${name}.png`)
}

// The customised model as GLB, hidden parts left out. The exporter loads on first use.
export async function exportGLB(root: THREE.Object3D, name: string) {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const result = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true })
  const url = URL.createObjectURL(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }))
  download(url, `${name}-configure.glb`)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
