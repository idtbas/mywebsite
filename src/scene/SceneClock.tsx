import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { story } from '../lib/story'

/** keeps the shared shader time uniform and the scene fog in sync with the rig */
export function SceneClock({ time }: { time: THREE.IUniform<number> }) {
  const scene = useThree((s) => s.scene)
  useFrame(() => {
    time.value = story.time
    if (scene.fog instanceof THREE.FogExp2) scene.fog.density = story.rig.fog
  }, -2)
  return null
}
