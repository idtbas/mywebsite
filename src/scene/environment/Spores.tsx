import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { mulberry32 } from '../../lib/math'
import { story } from '../../lib/story'

interface Props {
  count: number
  /** wrap volume: min corner and size */
  min: [number, number, number]
  size: [number, number, number]
  seed?: number
  sizeRange?: [number, number]
  hotRatio?: number
  intensity?: number
  time: THREE.IUniform<number>
}

const vertex = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform float uPixel;
uniform float uScale;
uniform float uDrift;
uniform vec3 uBoxMin;
uniform vec3 uBoxSize;
attribute float aSize;
attribute float aPhase;
attribute float aHot;
varying float vAlpha;
varying float vHot;

void main() {
  vec3 p = position;
  float t = uTime * uDrift;
  p.y += t * (0.05 + 0.12 * aPhase);
  p.x += sin(t * 0.21 + aPhase * 31.0) * 0.6 + sin(p.y * 0.7 + aPhase * 12.0) * 0.25;
  p.z += cos(t * 0.17 + aPhase * 17.0) * 0.6;
  vec3 rel = mod(p - uBoxMin, uBoxSize);
  p = uBoxMin + rel;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.05);
  gl_PointSize = min(aSize * uScale * uPixel / dist, 34.0 * uPixel);
  gl_Position = projectionMatrix * mv;

  vec3 n = rel / uBoxSize;
  float edge = smoothstep(0.0, 0.06, n.y) * smoothstep(1.0, 0.82, n.y)
    * smoothstep(0.0, 0.05, n.z) * smoothstep(1.0, 0.95, n.z);
  float nearFade = smoothstep(0.35, 1.6, dist);
  float farFade = 1.0 - smoothstep(16.0, 34.0, dist);
  float twinkle = 0.5 + 0.5 * sin(uTime * (1.1 + aPhase * 2.6) + aPhase * 60.0);
  vAlpha = uIntensity * edge * nearFade * farFade * (0.35 + 0.65 * twinkle);
  vHot = aHot;
}
`

const fragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
varying float vHot;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  float core = exp(-d2 * 95.0);
  float halo = exp(-d2 * 15.0) * 0.32;
  float a = (core + halo) * vAlpha;
  if (a < 0.004) discard;
  vec3 col = mix(uColor, vec3(0.78, 1.0, 0.62), core * vHot * 0.6) * (1.0 + vHot * 1.4);
  gl_FragColor = vec4(col, a);
}
`

/**
 * Floating bioluminescent spores. All motion happens in the vertex shader –
 * the CPU never touches the buffers after creation.
 */
export function Spores({ count, min, size, seed = 1, sizeRange = [0.02, 0.075], hotRatio = 0.12, intensity = 1, time }: Props) {
  const viewport = useThree((s) => s.size)
  // value-based key so inline array props don't rebuild the buffers
  const key = [count, seed, hotRatio, ...min, ...size, ...sizeRange].join(',')

  const geometry = useMemo(() => {
    const rnd = mulberry32(seed)
    const pos = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phase = new Float32Array(count)
    const hot = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = min[0] + rnd() * size[0]
      pos[i * 3 + 1] = min[1] + rnd() * size[1]
      pos[i * 3 + 2] = min[2] + rnd() * size[2]
      const r = rnd()
      sizes[i] = sizeRange[0] + Math.pow(r, 3) * (sizeRange[1] - sizeRange[0])
      phase[i] = rnd()
      hot[i] = rnd() < hotRatio ? 1 : 0
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aHot', new THREE.BufferAttribute(hot, 1))
    // the shader wraps particles inside the box, so cull against the box
    g.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(min[0] + size[0] / 2, min[1] + size[1] / 2, min[2] + size[2] / 2),
      Math.hypot(size[0], size[1], size[2]) / 2 + 2,
    )
    return g
  }, [key])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: time,
          uIntensity: { value: 0 },
          uPixel: { value: 1 },
          uScale: { value: 400 },
          uDrift: { value: 1 },
          uBoxMin: { value: new THREE.Vector3(...min) },
          uBoxSize: { value: new THREE.Vector3(...size) },
          uColor: { value: new THREE.Color('#7dff3a') },
        },
      }),
    [time, key],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera
    const u = material.uniforms
    u.uIntensity.value = story.rig.spores * intensity
    u.uPixel.value = state.gl.getPixelRatio()
    u.uScale.value = viewport.height / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)
    u.uDrift.value = story.reducedMotion ? 0.25 : 1
  })

  return <points geometry={geometry} material={material} frustumCulled />
}
