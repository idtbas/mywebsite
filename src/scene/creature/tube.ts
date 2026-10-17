import * as THREE from 'three'
import { valueNoise3 } from '../../lib/math'

export type V3 = [number, number, number]

/** material classes understood by the organic shader */
export const CLS = {
  armour: 0,
  bone: 1,
  sense: 2,
  keratin: 3,
} as const

export interface TubeOptions {
  points: V3[]
  /** radius at curve parameter t (0 root, 1 tip) and ring angle a (π/2 = "up") */
  radius: (t: number, a: number) => number
  tubular?: number
  radial?: number
  /** cross-section scale along the side / up axes */
  scale?: [number, number]
  cls?: number
  /** surface noise amplitude (relative to radius) */
  lump?: number
  /** tail-style sway weight along the tube (vertex shader) */
  sway?: (t: number) => number
  /**
   * Parts glued onto a swaying tube (teeth on the tail head …) must move with
   * the parent: they inherit its curve parameter and sway weight.
   */
  attach?: { along: number; sway: number }
  /** reference "up" for the initial frame */
  up?: V3
  seed?: number
}

const _v = new THREE.Vector3()
const _q = new THREE.Quaternion()

/**
 * A sampled curve with parallel-transport frames. Shared by the mesh builder
 * and by the spec helpers that need to place details onto a surface.
 */
export class TubePath {
  readonly P: THREE.Vector3[] = []
  readonly T: THREE.Vector3[] = []
  readonly S: THREE.Vector3[] = []
  readonly U: THREE.Vector3[] = []
  readonly steps: number

  constructor(points: V3[], steps: number, up: V3 = [0, 1, 0]) {
    const vecs = points.map((p) => new THREE.Vector3(...p))
    const curve =
      vecs.length === 2
        ? new THREE.LineCurve3(vecs[0], vecs[1])
        : new THREE.CatmullRomCurve3(vecs, false, 'centripetal')
    this.steps = steps
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      this.P.push(curve.getPointAt(t))
      this.T.push(curve.getTangentAt(t).normalize())
    }
    const ref = new THREE.Vector3(...up).normalize()
    if (Math.abs(this.T[0].dot(ref)) > 0.92) ref.set(0, 0, 1)
    const s0 = new THREE.Vector3().crossVectors(this.T[0], ref).normalize()
    this.S.push(s0)
    this.U.push(new THREE.Vector3().crossVectors(s0, this.T[0]).normalize())
    for (let i = 1; i <= steps; i++) {
      _q.setFromUnitVectors(this.T[i - 1], this.T[i])
      const s = this.S[i - 1].clone().applyQuaternion(_q)
      s.addScaledVector(this.T[i], -s.dot(this.T[i])).normalize()
      this.S.push(s)
      this.U.push(new THREE.Vector3().crossVectors(s, this.T[i]).normalize())
    }
  }

  private index(t: number) {
    return Math.min(this.steps, Math.max(0, Math.round(t * this.steps)))
  }

  point(t: number) {
    return this.P[this.index(t)].clone()
  }

  tangent(t: number) {
    return this.T[this.index(t)].clone()
  }

  /** point on the surface at (t, a), pushed out by factor k */
  surface(t: number, a: number, radius: TubeOptions['radius'], scale: [number, number] = [1, 1], k = 1) {
    const i = this.index(t)
    const r = radius(t, a) * k
    return this.P[i]
      .clone()
      .addScaledVector(this.S[i], Math.cos(a) * r * scale[0])
      .addScaledVector(this.U[i], Math.sin(a) * r * scale[1])
  }

  /** outward direction at (t, a) */
  normal(t: number, a: number) {
    const i = this.index(t)
    return new THREE.Vector3()
      .addScaledVector(this.S[i], Math.cos(a))
      .addScaledVector(this.U[i], Math.sin(a))
      .normalize()
  }
}

/** builds an indexed tube with the custom attributes used by the organic shader */
export function buildTube(o: TubeOptions, detail = 1): THREE.BufferGeometry {
  const tub = Math.max(3, Math.round((o.tubular ?? 24) * detail))
  const rad = Math.max(5, Math.round((o.radial ?? 12) * Math.sqrt(detail)))
  const path = new TubePath(o.points, tub, o.up)
  const [sx, sy] = o.scale ?? [1, 1]
  const cls = o.cls ?? CLS.armour
  const lump = o.lump ?? 0
  const seed = o.seed ?? Math.random()

  const count = (tub + 1) * rad
  const position = new Float32Array(count * 3)
  const data = new Float32Array(count * 4)

  for (let i = 0; i <= tub; i++) {
    const t = i / tub
    const P = path.P[i]
    const S = path.S[i]
    const U = path.U[i]
    const along = o.attach ? o.attach.along : t
    const sway = o.attach ? o.attach.sway : o.sway ? o.sway(t) : 0
    // class + local t packed into one float: integer part = class, fraction = t
    const clsPacked = cls + Math.min(t, 0.999) * 0.9
    for (let j = 0; j < rad; j++) {
      const a = (j / rad) * Math.PI * 2
      let r = o.radius(t, a)
      _v.copy(P)
        .addScaledVector(S, Math.cos(a) * r * sx)
        .addScaledVector(U, Math.sin(a) * r * sy)
      if (lump > 0) {
        r *= 1 + lump * valueNoise3(_v.x * 2.3 + seed * 13, _v.y * 2.3, _v.z * 2.3)
        _v.copy(P)
          .addScaledVector(S, Math.cos(a) * r * sx)
          .addScaledVector(U, Math.sin(a) * r * sy)
      }
      const k = i * rad + j
      position[k * 3] = _v.x
      position[k * 3 + 1] = _v.y
      position[k * 3 + 2] = _v.z
      data[k * 4] = along
      data[k * 4 + 1] = sway
      data[k * 4 + 2] = clsPacked
      data[k * 4 + 3] = seed
    }
  }

  const index: number[] = []
  for (let i = 0; i < tub; i++) {
    for (let j = 0; j < rad; j++) {
      const a = i * rad + j
      const b = i * rad + ((j + 1) % rad)
      const c = (i + 1) * rad + j
      const d = (i + 1) * rad + ((j + 1) % rad)
      index.push(a, c, b, b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geo.setAttribute('aRest', new THREE.BufferAttribute(position.slice(), 3))
  geo.setAttribute('aData', new THREE.BufferAttribute(data, 4))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

/* ------------------------------------------------------------------ */
/* radius helpers                                                      */
/* ------------------------------------------------------------------ */

/** smooth piecewise profile through [t, r] stops */
export function profile(stops: [number, number][]) {
  return (t: number) => {
    if (t <= stops[0][0]) return stops[0][1]
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, r0] = stops[i]
      const [t1, r1] = stops[i + 1]
      if (t <= t1) {
        const x = (t - t0) / (t1 - t0)
        const s = x * x * (3 - 2 * x)
        return r0 + (r1 - r0) * s
      }
    }
    return stops[stops.length - 1][1]
  }
}

/** armour segmentation: narrow grooves between n plates */
export const segmented = (n: number, depth: number) => (t: number) => {
  const s = Math.sin(Math.PI * n * t)
  return 1 - depth * Math.exp(-s * s * 38)
}

/** dorsal keel along the "up" side of the cross section */
export const keel = (amount: number, sharp = 6) => (a: number) =>
  1 + amount * Math.pow(Math.max(0, Math.sin(a)), sharp)

/** flattened underside */
export const belly = (amount: number) => (a: number) => 1 - amount * Math.pow(Math.max(0, -Math.sin(a)), 2)

/** tapering cone radius r0 → 0 */
export const taper = (r0: number, power = 1, min = 0.003) => (t: number) =>
  Math.max(min, r0 * Math.pow(1 - t, power))
