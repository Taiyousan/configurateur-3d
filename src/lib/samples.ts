// Example models, served from public/models. The four Khronos ones were
// compressed with gltf-transform (Draco geometry, WebP textures ≤ 1024 px).
export interface Sample {
  id: string
  name: string
  file: string
  credit: { author: string; license: string; source: string }
}

const khronos = (model: string) =>
  `https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/${model}`

export const SAMPLES: Sample[] = [
  {
    id: 'shoe',
    name: 'Chaussure',
    file: 'shoe-draco.glb',
    credit: {
      author: 'Poimandres',
      license: 'MIT',
      source: 'https://github.com/pmndrs/examples/tree/main/examples/shoe-configurator',
    },
  },
  {
    id: 'chair',
    name: 'Fauteuil',
    file: 'sheen-chair.glb',
    credit: { author: 'Eric Chadwick, Wayfair', license: 'CC0', source: khronos('SheenChair') },
  },
  {
    id: 'sofa',
    name: 'Canapé en velours',
    file: 'velvet-sofa.glb',
    credit: { author: 'Eric Chadwick, Wayfair', license: 'CC BY 4.0', source: khronos('GlamVelvetSofa') },
  },
  {
    id: 'car',
    name: 'Voiture concept',
    file: 'concept-car.glb',
    credit: { author: 'Eric Chadwick, DGG', license: 'CC BY 4.0', source: khronos('CarConcept') },
  },
  {
    id: 'sunglasses',
    name: 'Lunettes de soleil',
    file: 'sunglasses.glb',
    credit: { author: 'Eric Chadwick, DGG', license: 'CC BY 4.0', source: khronos('SunglassesKhronos') },
  },
]

export const DEFAULT_SAMPLE = SAMPLES[0]

export const sampleUrl = (sample: Sample) => `${import.meta.env.BASE_URL}models/${sample.file}`
