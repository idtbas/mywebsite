import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { story } from '../../lib/story'
import { damp } from '../../lib/math'
import type { Quality } from '../../lib/quality'
import { buildCreature } from './buildCreature'
import { createOrganicMaterial, createOrganicUniforms } from './organicMaterial'
import { HEART, HEAD_CENTER } from './creatureSpec'

interface Props {
  quality: Quality
  time: THREE.IUniform<number>
}

const _cam = new THREE.Vector3()

export function Creature({ quality, time }: Props) {
  const parts = useMemo(() => buildCreature(quality.detail), [quality.detail])
  const uniforms = useMemo(() => {
    const u = createOrganicUniforms({ uTime: time })
    u.uHeart.value.set(...HEART)
    u.uRevealOrigin.value.set(...HEAD_CENTER)
    return u
  }, [time])
  const material = useMemo(() => createOrganicMaterial(uniforms, quality.physical), [uniforms, quality.physical])

  const root = useRef<THREE.Group>(null)
  const groups = useRef<Record<string, THREE.Group | null>>({})

  useEffect(
    () => () => {
      parts.forEach((p) => p.geometry.dispose())
    },
    [parts],
  )
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const t = story.time
    const rig = story.rig
    const calm = story.reducedMotion ? 0.35 : 1

    uniforms.uGlow.value = rig.glow
    uniforms.uVeins.value = rig.veins
    uniforms.uPulse.value = rig.pulse
    uniforms.uSense.value = rig.sense
    uniforms.uReveal.value = rig.reveal
    uniforms.uDissolve.value = rig.dissolve
    uniforms.uRim.value = rig.rim * 0.9
    uniforms.uSwayAmp.value = calm

    const g = groups.current
    if (root.current) {
      root.current.position.y = Math.sin(t * 0.9) * 0.018 * calm
      root.current.rotation.x = Math.sin(t * 0.9 + 0.6) * 0.006 * calm
    }

    // the eyeless head keeps turning toward the viewer
    const head = g.head
    if (head) {
      _cam.copy(state.camera.position)
      const yaw = Math.atan2(_cam.x - head.position.x, _cam.z - head.position.z)
      const pitch = Math.atan2(_cam.y - head.position.y, Math.hypot(_cam.x - head.position.x, _cam.z - head.position.z))
      const p = story.pointer
      const targetYaw = THREE.MathUtils.clamp(yaw * 0.35, -0.45, 0.45) + p.x * 0.12 + Math.sin(t * 0.37) * 0.04 * calm
      const targetPitch = THREE.MathUtils.clamp(-pitch * 0.3, -0.25, 0.3) - p.y * 0.06 - rig.jaw * 0.18
      head.rotation.y = damp(head.rotation.y, targetYaw, 2.2, dt)
      head.rotation.x = damp(head.rotation.x, targetPitch, 2.2, dt)
      if (g.jaw) g.jaw.rotation.x = rig.jaw * 0.62 + (Math.sin(t * 1.25) * 0.5 + 0.5) * 0.035 * calm
    }

    const sway = (phase: number, speed = 0.8) => Math.sin(t * speed + phase) * calm
    const raise = rig.arms
    if (g.armCR) {
      g.armCR.rotation.z = raise * 0.32 + sway(0.2, 0.7) * 0.035
      g.armCR.rotation.y = -raise * 0.3 + sway(1.1, 0.5) * 0.03
      g.armCR.rotation.x = -raise * 0.12
    }
    if (g.armCL) {
      g.armCL.rotation.z = -raise * 0.32 - sway(0.9, 0.7) * 0.035
      g.armCL.rotation.y = raise * 0.3 - sway(2.1, 0.5) * 0.03
      g.armCL.rotation.x = -raise * 0.12
    }
    if (g.armBR) g.armBR.rotation.x = sway(0.4, 0.9) * 0.06 - raise * 0.2
    if (g.armBL) g.armBL.rotation.x = sway(2.4, 0.9) * 0.06 - raise * 0.2
    if (g.armAR) g.armAR.rotation.x = sway(1.4, 1.1) * 0.05 - raise * 0.25
    if (g.armAL) g.armAL.rotation.x = sway(3.1, 1.1) * 0.05 - raise * 0.25
  })

  const jaw = parts.find((p) => p.id === 'jaw')
  const setRef = (id: string) => (el: THREE.Group | null) => {
    groups.current[id] = el
  }

  return (
    <group ref={root}>
      {parts
        .filter((part) => part.id !== 'jaw')
        .map((part) => (
          <group key={part.id} position={part.pivot} ref={setRef(part.id)}>
            <mesh geometry={part.geometry} material={material} />
            {part.id === 'head' && jaw && (
              // the jaw hangs from the head so both always move together
              <group
                position={[jaw.pivot[0] - part.pivot[0], jaw.pivot[1] - part.pivot[1], jaw.pivot[2] - part.pivot[2]]}
                ref={setRef('jaw')}
              >
                <mesh geometry={jaw.geometry} material={material} />
              </group>
            )}
          </group>
        ))}
    </group>
  )
}
