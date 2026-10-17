import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import type { Quality } from '../lib/quality'
import { CONFIG } from '../config'
import { CameraRig } from './CameraRig'
import { SceneClock } from './SceneClock'
import { PostFX } from './PostFX'
import { AnchorProjector } from './AnchorProjector'
import { Creature } from './creature/Creature'
import { ModelCreature } from './creature/ModelCreature'
import { Lights } from './environment/Lights'
import { Spores } from './environment/Spores'
import { FogSheets, type Sheet } from './environment/FogSheets'
import { LightShafts } from './environment/LightShafts'
import { Ground } from './environment/Ground'
import { DarkPassage, PASSAGE_SPACING, PASSAGE_START } from './environment/DarkPassage'

interface Props {
  quality: Quality
  onReady: () => void
  onLost: () => void
}

const BACKGROUND = '#020303'
const FOG = '#030504'

const CREATURE_SHEETS: Sheet[] = [
  { pos: [-3, 3.4, -6.5], size: [17, 8], opacity: 0.6, color: '#070c0a', seed: 0.1 },
  { pos: [0, 1.0, -2.6], size: [15, 3.6], opacity: 0.38, color: '#0f1a14', seed: 0.5 },
  { pos: [0, 4.6, -4.2], size: [15, 7], opacity: 0.05, color: '#3c7a2c', seed: 1.1, additive: true },
  { pos: [4.5, 2.8, -10], size: [20, 9], opacity: 0.55, color: '#060a08', seed: 0.3 },
  { pos: [-5.5, 1.2, 4.5], size: [10, 3.6], opacity: 0.28, color: '#101a15', seed: 0.7 },
  { pos: [5.5, 1.4, 3], size: [10, 3.6], opacity: 0.24, color: '#101a15', seed: 0.9 },
]

function passageSheets(count: number): Sheet[] {
  const out: Sheet[] = []
  for (let i = 0; i < count; i++) {
    const z = PASSAGE_START - 3 - i * 6.2
    const green = i % 3 === 1
    out.push({
      pos: [i % 2 ? 1.6 : -1.4, 2.6 + (i % 3) * 0.4, z],
      size: [13, 8],
      opacity: green ? 0.07 : 0.4,
      color: green ? '#3c7a2c' : '#08100c',
      additive: green,
      seed: 2 + i * 0.37,
    })
  }
  return out
}

/** signals readiness once the first frames (and shader compiles) are done */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    frames.current++
    if (frames.current > 3) {
      done.current = true
      onReady()
    }
  })
  return null
}

export default function Experience({ quality, onReady, onLost }: Props) {
  const time = useMemo<THREE.IUniform<number>>(() => ({ value: 0 }), [])
  const [scale, setScale] = useState(1)
  const [postfx, setPostfx] = useState(quality.postfx)
  const [lowPower, setLowPower] = useState(false)

  const dpr = useMemo(() => {
    const native = Math.min(window.devicePixelRatio || 1, 3)
    return THREE.MathUtils.clamp(native * scale, quality.dpr[0], quality.dpr[1])
  }, [scale, quality.dpr])

  const sheets = useMemo(() => {
    const creatureCount = Math.min(CREATURE_SHEETS.length, Math.ceil(quality.fogSheets * 0.6))
    return [...CREATURE_SHEETS.slice(0, creatureCount), ...passageSheets(Math.max(3, Math.round(quality.fogSheets * 0.8)))]
  }, [quality.fogSheets])

  const passageLength = quality.arches * PASSAGE_SPACING + 8
  const sporeBoxes = useMemo(
    () => ({
      creature: { min: [-9, 0, -9] as [number, number, number], size: [18, 8, 18] as [number, number, number] },
      passage: {
        min: [-5, 0, PASSAGE_START - passageLength] as [number, number, number],
        size: [10, 7, passageLength] as [number, number, number],
      },
    }),
    [passageLength],
  )

  useEffect(() => {
    document.documentElement.dataset.quality = `${quality.tier}${postfx ? '' : '-nofx'}`
  }, [quality.tier, postfx])

  return (
    <Canvas
      dpr={dpr}
      flat={false}
      gl={{
        antialias: !postfx,
        alpha: false,
        stencil: false,
        powerPreference: 'high-performance',
      }}
      camera={{ fov: 30, near: 0.1, far: 170, position: [0, 2.7, 11] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(BACKGROUND, 1)
        scene.background = new THREE.Color(BACKGROUND)
        scene.fog = new THREE.FogExp2(FOG, 0.05)
        gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault()
            onLost()
          },
          { once: true },
        )
      }}
    >
      <PerformanceMonitor
        factor={1}
        flipflops={3}
        onChange={({ factor }) => setScale(0.55 + 0.45 * factor)}
        onDecline={() => {
          // first give up bloom, then resolution (handled by onChange)
          if (postfx) setPostfx(false)
        }}
        onFallback={() => {
          setPostfx(false)
          setLowPower(true)
          setScale(0.55)
        }}
      />
      <SceneClock time={time} />
      <CameraRig />
      <Lights />

      {CONFIG.creatureModelUrl ? (
        <Suspense fallback={<Creature quality={quality} time={time} />}>
          <ModelCreature url={`${import.meta.env.BASE_URL}${CONFIG.creatureModelUrl}`} height={CONFIG.creatureModelHeight} />
        </Suspense>
      ) : (
        <Creature quality={quality} time={time} />
      )}

      <Ground time={time} />
      <DarkPassage quality={quality} time={time} />
      <Spores count={lowPower ? Math.round(quality.spores * 0.5) : quality.spores} {...sporeBoxes.creature} seed={7} time={time} />
      <Spores
        count={lowPower ? Math.round(quality.tunnelSpores * 0.5) : quality.tunnelSpores}
        {...sporeBoxes.passage}
        seed={11}
        sizeRange={[0.015, 0.06]}
        hotRatio={0.2}
        intensity={1.2}
        time={time}
      />
      <FogSheets sheets={sheets} time={time} />
      <LightShafts time={time} />
      <AnchorProjector />
      {postfx && <PostFX chromatic={quality.chromatic} msaa={quality.msaa} />}
      <ReadySignal onReady={onReady} />
    </Canvas>
  )
}
