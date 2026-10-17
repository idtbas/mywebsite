import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { story } from '../../lib/story'
import { damp } from '../../lib/math'

const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _target = new THREE.Vector3()

/**
 * A fixed light rig (the light count never changes, so shaders never
 * recompile) whose intensities are animated by the scroll choreography.
 */
export function Lights() {
  const scene = useThree((s) => s.scene)
  const key = useRef<THREE.SpotLight>(null)
  const rimA = useRef<THREE.PointLight>(null)
  const rimB = useRef<THREE.PointLight>(null)
  const under = useRef<THREE.PointLight>(null)
  const hand = useRef<THREE.PointLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const handPos = useRef(new THREE.Vector3(2, 3, 4))

  useFrame((state, delta) => {
    const rig = story.rig
    const dt = Math.min(delta, 0.1)
    if (key.current) {
      key.current.intensity = 190 * rig.key
      if (key.current.target.position.y === 0) {
        key.current.target.position.set(0, 2.4, 0.4)
        key.current.target.updateMatrixWorld()
      }
    }
    if (rimA.current) rimA.current.intensity = 26 * rig.rim
    if (rimB.current) rimB.current.intensity = 30 * rig.rim
    if (under.current) under.current.intensity = 2.6 * rig.glow * (1 + rig.pulse * 2) * rig.reveal
    if (hemi.current) hemi.current.intensity = 0.22 * rig.env
    scene.environmentIntensity = 0.5 * rig.env

    // the "hand" light follows pointer / touch across the armour
    if (hand.current) {
      const cam = state.camera
      cam.matrixWorld.extractBasis(_right, _up, _fwd)
      const p = story.pointer
      const idle = !p.active || performance.now() - p.lastMove > 2600
      const px = idle ? Math.sin(story.time * 0.35) * 0.7 : p.x
      const py = idle ? Math.cos(story.time * 0.27) * 0.4 : p.y
      _target
        .set(rig.target[0], rig.target[1], rig.target[2])
        .addScaledVector(_right, px * 3.2)
        .addScaledVector(_up, py * 2.2 + 0.4)
        .addScaledVector(_fwd, 2.4)
      handPos.current.x = damp(handPos.current.x, _target.x, 4, dt)
      handPos.current.y = damp(handPos.current.y, _target.y, 4, dt)
      handPos.current.z = damp(handPos.current.z, _target.z, 4, dt)
      hand.current.position.copy(handPos.current)
      hand.current.intensity = (idle ? 7 : 18) * Math.max(rig.key, 0.35)
    }
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#1d2624', '#000000', 0.22]} />
      <spotLight
        ref={key}
        position={[3.5, 10, 6.5]}
        angle={0.42}
        penumbra={1}
        distance={30}
        decay={2}
        color="#e3ecff"
        intensity={160}
      />
      <pointLight ref={rimA} position={[-3.2, 4.6, -3.4]} color="#7dff3a" distance={16} decay={2} intensity={42} />
      <pointLight ref={rimB} position={[3.8, 3.2, -3.4]} color="#c4d8ff" distance={14} decay={2} intensity={30} />
      <pointLight ref={under} position={[0, 0.5, 1.8]} color="#8dff2f" distance={6} decay={2} intensity={5} />
      <pointLight ref={hand} color="#d4ffc0" distance={7.5} decay={2} intensity={12} />

      {/* a tiny studio rendered once into a cube map for reflections */}
      <Environment frames={1} resolution={128} background={false}>
        <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#7dff3a" position={[-6, 2, -5]} rotation-y={Math.PI / 4} scale={[1.2, 9, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#d6e4ff" position={[5, 3, -6]} rotation-y={-Math.PI / 4} scale={[0.8, 9, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#9fc6ff" position={[6, 2.5, 3]} rotation-y={-Math.PI / 2.5} scale={[1, 7, 1]} />
        <Lightformer form="ring" intensity={0.5} color="#e8f4ee" position={[0, 2, 8]} scale={4} />
      </Environment>
    </>
  )
}
