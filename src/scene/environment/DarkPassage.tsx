import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../../lib/math'
import { story } from '../../lib/story'
import { CLS, TubePath, buildTube, keel, profile, segmented, type TubeOptions, type V3 } from '../creature/tube'
import { createOrganicMaterial, createOrganicUniforms, TOXIC } from '../creature/organicMaterial'
import type { Quality } from '../../lib/quality'

export const PASSAGE_START = -13
export const PASSAGE_SPACING = 5.6

interface Props {
  quality: Quality
  time: THREE.IUniform<number>
}

/**
 * "Into the darkness": a passage of fossil-like ribs behind the creature,
 * hung with glowing spore pods and crossed by travelling energy rings.
 */
export function DarkPassage({ quality, time }: Props) {
  const { geometry, pods } = useMemo(() => {
    const rnd = mulberry32(5150)
    const tubes: TubeOptions[] = []
    const podSpots: { p: THREE.Vector3; s: number }[] = []

    for (let i = 0; i < quality.arches; i++) {
      const z = PASSAGE_START - i * PASSAGE_SPACING - rnd() * 1.2
      const w = 3.6 + rnd() * 1.4
      const h = 5.4 + rnd() * 1.6
      const lean = (rnd() - 0.5) * 0.8
      const split = rnd() < 0.4
      const prof = profile([
        [0, 0.5],
        [0.25, 0.32],
        [0.5, 0.2],
        [0.75, 0.32],
        [1, 0.5],
      ])
      const seg = segmented(16, 0.1)
      const radius = (t: number, a: number) => prof(t) * seg(t) * keel(0.25, 6)(a)

      const sides: V3[][] = split
        ? [
            [
              [-w, -0.4, z],
              [-w * 0.95, h * 0.5, z + 0.3],
              [-w * 0.5, h * 0.95, z + 0.8 + lean],
              [-0.7, h * 0.86, z + 1.5 + lean],
            ],
            [
              [w, -0.4, z],
              [w * 0.95, h * 0.5, z + 0.3],
              [w * 0.5, h * 0.92, z + 0.8 - lean],
              [0.8, h * 0.8, z + 1.5 - lean],
            ],
          ]
        : [
            [
              [-w, -0.4, z],
              [-w * 0.93, h * 0.55, z + 0.3],
              [-w * 0.55, h * 0.93, z + 0.6 + lean],
              [0, h, z + 0.8 + lean],
              [w * 0.55, h * 0.92, z + 0.6],
              [w * 0.95, h * 0.5, z + 0.3],
              [w, -0.4, z],
            ],
          ]

      for (const pts of sides) {
        const r = split ? (t: number, a: number) => radius(t * 0.5, a) * (1 - t * 0.8) : radius
        tubes.push({ points: pts, radius: r, tubular: split ? 40 : 70, radial: 12, lump: 0.08, seed: rnd() })
        const path = new TubePath(pts, 60)
        // stalactite spines hanging into the passage
        const spines = 2 + Math.floor(rnd() * 3)
        for (let k = 0; k < spines; k++) {
          const t = 0.2 + rnd() * 0.6
          const a = -Math.PI / 2 + (rnd() - 0.5) * 0.6
          const base = path.surface(t, a, r, [1, 1], 0.8)
          const len = 0.6 + rnd() * 1.1
          const dir = new THREE.Vector3(0, -1, 0).addScaledVector(path.normal(t, a), 0.3)
          const tip = base.clone().addScaledVector(dir.normalize(), len)
          tubes.push({
            points: [
              [base.x, base.y + 0.1, base.z],
              [base.x + dir.x * len * 0.5, base.y - len * 0.5, base.z + (rnd() - 0.5) * 0.2],
              [tip.x, tip.y, tip.z],
            ],
            radius: (u) => Math.max(0.003, 0.09 * Math.pow(1 - u, 1.2)),
            tubular: 10,
            radial: 7,
            cls: CLS.keratin,
          })
        }
        // spore pods clinging to the ribs
        for (let k = 0; k < 9; k++) {
          const t = rnd()
          const a = rnd() * Math.PI * 2
          podSpots.push({ p: path.surface(t, a, r, [1, 1], 1.02), s: 0.025 + rnd() * 0.04 })
        }
      }
    }

    const geos = tubes.map((t) => buildTube(t, quality.detail * 0.85))
    const merged = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    merged.computeBoundingSphere()
    return { geometry: merged, pods: podSpots }
  }, [quality.arches, quality.detail])

  const uniforms = useMemo(() => {
    const u = createOrganicUniforms({ uTime: time })
    u.uHeart.value.set(0, 2.5, PASSAGE_START + 2)
    u.uRevealOrigin.value.set(0, 3, PASSAGE_START)
    u.uSwayAmp.value = 0
    u.uRim.value = 0.4
    return u
  }, [time])
  const material = useMemo(() => createOrganicMaterial(uniforms, false), [uniforms])

  const podMesh = useRef<THREE.InstancedMesh>(null)
  const podGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  const podMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color('#46e00c'), fog: false }),
    [],
  )

  useEffect(() => {
    const mesh = podMesh.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    pods.forEach((pod, i) => {
      m.compose(pod.p, q, new THREE.Vector3(pod.s, pod.s, pod.s))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [pods])

  // travelling energy rings
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const ringGeometry = useMemo(() => new THREE.TorusGeometry(3.6, 0.018, 6, 96), [])
  const ringMaterials = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: TOXIC.clone().multiplyScalar(2.4),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
      ),
    [],
  )
  const passageLength = quality.arches * PASSAGE_SPACING + 4

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      podGeometry.dispose()
      podMaterial.dispose()
      ringGeometry.dispose()
      ringMaterials.forEach((m) => m.dispose())
    },
    [geometry, material, podGeometry, podMaterial, ringGeometry, ringMaterials],
  )

  useFrame(() => {
    const t = story.time
    const rig = story.rig
    uniforms.uPulse.value = rig.pulse * 0.5
    uniforms.uGlow.value = 0.6 + rig.pulse * 0.5
    const speed = story.reducedMotion ? 1.2 : 4.5
    rings.current.forEach((ring, i) => {
      if (!ring) return
      const travel = (t * speed + i * (passageLength / 3)) % passageLength
      const z = PASSAGE_START + 1 - travel
      ring.position.set(0, 2.6, z)
      const k = travel / passageLength
      const s = 0.7 + k * 0.5
      ring.scale.set(s, s * 0.82, s)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = Math.sin(Math.PI * k) * 0.9
    })
  })

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <instancedMesh ref={podMesh} args={[podGeometry, podMaterial, pods.length]} />
      {ringMaterials.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el
          }}
          geometry={ringGeometry}
          material={m}
          renderOrder={4}
        />
      ))}
      <PassageGlow z={PASSAGE_START - passageLength - 6} />
    </group>
  )
}

const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const glowFragment = /* glsl */ `
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - vec2(0.5, 0.5)) * 2.0;
  float g = exp(-dot(p, p) * 4.0) * 0.55 + exp(-dot(p, p) * 40.0) * 0.6;
  // light falls in from above: fade out before it reaches the horizon line
  g *= smoothstep(0.4, 0.6, vUv.y);
  gl_FragColor = vec4(uColor * g, 1.0);
}
`

/** the faint light at the end of the passage – only once you are inside it */
function PassageGlow({ z }: { z: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: TOXIC.clone().multiplyScalar(0.9) } },
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame(({ camera }) => {
    const inside = THREE.MathUtils.smoothstep(-camera.position.z, -PASSAGE_START - 2, -PASSAGE_START + 12)
    material.uniforms.uColor.value.copy(TOXIC).multiplyScalar(0.9 * inside)
  })
  return (
    <mesh position={[0, 6, z]} material={material} renderOrder={1}>
      <planeGeometry args={[34, 34]} />
    </mesh>
  )
}
