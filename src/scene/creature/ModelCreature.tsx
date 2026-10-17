import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { story } from '../../lib/story'

interface Props {
  url: string
  height: number
}

/**
 * Optional replacement for the procedural sculpture: loads a GLB/GLTF that
 * you are allowed to use, normalises its size and keeps it reacting to the
 * scroll choreography through its emissive channel.
 */
export function ModelCreature({ url, height }: Props) {
  const gltf = useGLTF(url)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const { actions, names } = useAnimations(gltf.animations, scene)

  const emissive = useMemo(() => {
    const list: THREE.MeshStandardMaterial[] = []
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) list.push(m as THREE.MeshStandardMaterial)
      })
    })
    return list
  }, [scene])

  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const scale = height / Math.max(size.y, 0.0001)
    const center = box.getCenter(new THREE.Vector3())
    return { scale, offset: new THREE.Vector3(-center.x * scale, -box.min.y * scale, -center.z * scale) }
  }, [scene, height])

  useEffect(() => {
    const first = names[0]
    if (first) actions[first]?.reset().fadeIn(0.5).play()
  }, [actions, names])

  useFrame(() => {
    const glow = story.rig.glow * (1 + story.rig.pulse)
    emissive.forEach((m) => {
      m.emissiveIntensity = glow
      m.opacity = 1 - story.rig.dissolve * 0.92
      m.transparent = story.rig.dissolve > 0.01
    })
  })

  return (
    <group position={transform.offset} scale={transform.scale}>
      <primitive object={scene} />
    </group>
  )
}
