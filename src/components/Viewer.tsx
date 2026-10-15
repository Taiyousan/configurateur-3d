import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, type RootState, type ThreeEvent } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment } from '@react-three/drei'
import { EffectComposer, Outline, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useStore } from '../store'
import { collectMeshes } from '../lib/materials'

// The renderer, for screenshots.
export const rendererRef: { current: THREE.WebGLRenderer | null } = { current: null }

// Portfolio palette: the board's yellow ink for the selection, the stamp red on hover.
const SELECTED = 0xf5c542
const SELECTED_HIDDEN = 0x8a6d1f
const HOVERED = 0xa63d2a

const isShown = (o: THREE.Object3D) => {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false
  return true
}

const onCreated = ({ gl, clock }: RootState) => {
  rendererRef.current = gl
  // Frames are rendered on demand: the first one after a pause would see the whole
  // pause as its delta and skip the camera's transition. Capped at two 60 Hz frames.
  const getDelta = clock.getDelta.bind(clock)
  clock.getDelta = () => Math.min(getDelta(), 1 / 30)
}

export function Viewer() {
  const background = useStore((s) => s.background)
  const envPreset = useStore((s) => s.envPreset)
  const envIntensity = useStore((s) => s.envIntensity)
  const showEnvBackground = useStore((s) => s.showEnvBackground)
  const shadows = useStore((s) => s.shadows)

  return (
    <Canvas
      className="viewer"
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [2.6, 1.8, 3.4], fov: 35, near: 0.01, far: 200 }}
      gl={{ preserveDrawingBuffer: true, antialias: false }}
      onCreated={onCreated}
      onPointerMissed={(e) => {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) useStore.getState().select(null)
      }}
    >
      {!showEnvBackground && <color attach="background" args={[background]} />}
      <Environment
        preset={envPreset}
        background={showEnvBackground}
        backgroundBlurriness={0.5}
        environmentIntensity={envIntensity}
        backgroundIntensity={envIntensity}
      />
      <Model />
      {shadows && (
        <ContactShadows position={[0, -0.001, 0]} opacity={0.55} scale={7} blur={2.2} far={2.5} resolution={1024} />
      )}
      <Controls />
      <Effects />
      <RenderOnChange />
    </Canvas>
  )
}

// Colours and visibility are changed on the three.js objects directly: any store
// change (revision, selection, hover, settings) asks for a new frame.
function RenderOnChange() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => useStore.subscribe(() => invalidate()), [invalidate])
  return null
}

function Model() {
  const model = useStore((s) => s.model)
  const { select, setHovered, focusOn } = useStore.getState()

  if (!model) return null

  // Handlers sit on the root: R3F calls them for each hit, nearest first,
  // until propagation is stopped.
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isShown(e.object)) return
    e.stopPropagation()
    setHovered(e.object)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isShown(e.object)) return
    e.stopPropagation()
    if (e.delta > 4) return // a drag to orbit, not a click
    const additive = e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey || e.nativeEvent.metaKey
    select(e.object, additive)
  }
  const onDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isShown(e.object)) return
    e.stopPropagation()
    focusOn(e.object)
  }

  return (
    <group scale={model.scale}>
      <group position={model.offset}>
        <primitive
          key={model.id}
          object={model.root}
          onPointerMove={onPointerMove}
          onPointerOut={() => setHovered(null)}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        />
      </group>
    </group>
  )
}

function Controls() {
  const ref = useRef<CameraControls>(null)
  const focus = useStore((s) => s.focus)
  const autoRotate = useStore((s) => s.autoRotate)
  const invalidate = useThree((s) => s.invalidate)
  const interacting = useRef(false)

  useEffect(() => {
    const controls = ref.current
    if (!controls) return
    const start = () => (interacting.current = true)
    const end = () => {
      interacting.current = false
      invalidate() // resumes the auto-rotation
    }
    controls.addEventListener('controlstart', start)
    controls.addEventListener('controlend', end)
    return () => {
      controls.removeEventListener('controlstart', start)
      controls.removeEventListener('controlend', end)
    }
  }, [invalidate])

  useEffect(() => {
    const controls = ref.current
    const root = useStore.getState().model?.root
    const targets = focus.targets ?? (root ? [root] : [])
    if (!controls || !targets.length || !focus.nonce) return
    targets.forEach((t) => t.updateWorldMatrix(true, true))
    if (!focus.targets) controls.rotateTo(Math.PI / 5, Math.PI / 2.6, true)
    // The bounding box's sphere (looser than the exact one), plus room for the panels.
    const box = new THREE.Box3()
    targets.forEach((t) => box.expandByObject(t, true))
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    sphere.radius *= 1.15
    controls.fitToSphere(sphere, true)
  }, [focus])

  useFrame((state, delta) => {
    if (!autoRotate || interacting.current) return
    ref.current?.rotate(delta * 0.35, 0, true)
    state.invalidate() // keeps the on-demand loop going
  })

  return <CameraControls ref={ref} makeDefault minDistance={0.2} maxDistance={25} dollyToCursor smoothTime={0.3} />
}

function Effects() {
  const selection = useStore((s) => s.selection)
  const hovered = useStore((s) => s.hovered)

  const selected = useMemo(() => collectMeshes(selection), [selection])
  const hover = useMemo(
    () => (hovered && !selected.includes(hovered as THREE.Mesh) ? collectMeshes([hovered]) : []),
    [hovered, selected],
  )

  return (
    <EffectComposer autoClear={false} multisampling={4}>
      <Outline
        selection={hover}
        selectionLayer={11}
        visibleEdgeColor={HOVERED}
        hiddenEdgeColor={HOVERED}
        edgeStrength={3}
        xRay={false}
        blur
      />
      <Outline
        selection={selected}
        selectionLayer={10}
        visibleEdgeColor={SELECTED}
        hiddenEdgeColor={SELECTED_HIDDEN}
        edgeStrength={5}
        blur
      />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}
