import { catmull, clamp, smoothstep } from '../lib/math'
import type { Rig } from '../lib/story'

/**
 * The whole film as one list of keyframes over continuous story time
 * (chapter index + chapter progress, 0..6). Every value of the 3D scene –
 * camera path, lens, fog, light, shader states – is derived from here, so the
 * page behaves like a single choreographed shot instead of separate sections.
 *
 * Because each chapter's sticky stage is only pinned for the first part of its
 * scroll length (see CHAPTERS[].len), "holds" sit inside that window and the
 * remainder of a chapter is used as the camera move into the next one.
 */

type V3 = [number, number, number]
type Scalars = Omit<Rig, 'pos' | 'target' | 'blackout'>

interface Key {
  s: number
  pos: V3
  target: V3
  /** hard cut hidden under a blackout instead of a camera move */
  cut?: boolean
  p?: Partial<Scalars>
}

const DEFAULTS: Scalars = {
  fov: 32,
  roll: 0,
  shift: 0,
  fog: 0.05,
  key: 1,
  rim: 1,
  env: 1,
  glow: 1,
  veins: 1,
  pulse: 0,
  sense: 1,
  reveal: 1,
  dissolve: 0,
  spores: 1,
  shafts: 1,
  arms: 0,
  jaw: 0,
  scan: 0,
}

const SCALAR_KEYS = Object.keys(DEFAULTS) as (keyof Scalars)[]

const RAW: Key[] = [
  /* 01 — THE AWAKENING */
  { s: 0, pos: [0, 2.55, 12.4], target: [0, 2.45, 0], p: { fov: 30, key: 0.55, env: 0.6, shafts: 0.8, sense: 1.25 } },
  { s: 0.5, pos: [0.9, 3.15, 6.8], target: [0, 3.05, 1.2], p: { fov: 30, key: 0.75, shafts: 0.9 } },

  /* 02 — THE CREATURE: slow orbit from three-quarter to profile */
  { s: 1, pos: [3.6, 3.0, 6.6], target: [0, 2.75, 0.6], p: { fov: 34, shift: 0.15, key: 1, rim: 1.1, env: 0.9, sense: 1 } },
  { s: 1.35, pos: [6.7, 2.45, 3.0], target: [0, 2.55, 0], p: { shift: 0.17 } },
  { s: 1.7, pos: [7.6, 2.1, -1.4], target: [0, 2.35, -0.8], p: { shift: 0.17, rim: 1.4 } },

  /* 03 — ANATOMY: four close-ups with holds */
  { s: 2, pos: [4.6, 3.7, 4.8], target: [0, 3.0, 1.0], p: { fov: 32, shift: 0.13, key: 1.1, rim: 1.1 } },
  { s: 2.07, pos: [3.0, 3.75, 5.4], target: [0, 3.3, 1.75], p: { fov: 30, sense: 1.7 } },
  { s: 2.2, pos: [2.8, 3.7, 5.1], target: [0, 3.3, 1.75] },
  { s: 2.27, pos: [-4.9, 4.7, 3.7], target: [-1.0, 3.6, 0.1], p: { fov: 34, sense: 1 } },
  { s: 2.4, pos: [-4.7, 4.6, 3.5], target: [-1.0, 3.6, 0.1] },
  { s: 2.47, pos: [-3.0, 2.6, -7.4], target: [0.4, 1.75, -4.4], p: { fov: 32, rim: 1.6 } },
  { s: 2.6, pos: [-3.0, 2.6, -7.4], target: [0.4, 1.75, -4.4] },
  { s: 2.67, pos: [3.3, 0.85, 3.1], target: [0.45, 0.85, -0.25], p: { fov: 36, rim: 1.1 } },
  { s: 2.8, pos: [3.3, 0.85, 3.1], target: [0.45, 0.85, -0.25] },

  /* 04 — POWER & PRESENCE */
  { s: 3, pos: [0, 1.1, 8.8], target: [0, 2.8, 0], p: { fov: 36, shift: 0, key: 0.9 } },
  { s: 3.1, pos: [0, 1.25, 7.9], target: [0, 2.8, 0], p: { shift: 0.15, dissolve: 0 } },
  { s: 3.17, pos: [0.2, 1.4, 7.5], target: [0, 2.8, 0], p: { dissolve: 1, glow: 1.25 } },
  { s: 3.27, pos: [0.35, 1.5, 7.2], target: [0, 2.8, 0], p: { dissolve: 1 } },
  { s: 3.33, pos: [-0.6, 1.3, 7.0], target: [0, 2.8, 0], p: { dissolve: 0, glow: 1, roll: 0 } },
  { s: 3.44, pos: [-5.3, 0.7, 4.4], target: [0, 3.0, 0], p: { roll: -0.36, fov: 38 } },
  { s: 3.54, pos: [-5.1, 1.0, 3.3], target: [0, 3.0, 0], p: { roll: -0.36 } },
  { s: 3.62, pos: [0, 3.3, 4.8], target: [0, 3.25, 1.9], p: { roll: 0, fov: 32, sense: 2.2, scan: 0 } },
  { s: 3.77, pos: [0, 3.3, 4.3], target: [0, 3.25, 1.9], p: { sense: 3.2, scan: 1 } },

  /* 05 — INTO THE DARKNESS: over the back, into the passage */
  { s: 4, pos: [0, 4.7, 4.5], target: [0, 3.6, -1], p: { fov: 40, sense: 1, shift: 0, key: 0.8 } },
  { s: 4.1, pos: [0, 5.9, 0.4], target: [0, 3.2, -8], p: { fog: 0.055, shafts: 0.6 } },
  { s: 4.22, pos: [0, 3.4, -8.5], target: [0, 2.7, -20], p: { fov: 46, fog: 0.06, key: 0.35, env: 0.5, spores: 1.4, shafts: 0.2 } },
  { s: 4.42, pos: [1.0, 2.5, -20], target: [-0.6, 2.6, -31], p: { fog: 0.065 } },
  { s: 4.62, pos: [-0.9, 2.9, -30], target: [0.6, 2.4, -41], p: { fog: 0.075, pulse: 0.7 } },
  { s: 4.82, pos: [0, 2.4, -38], target: [0, 2.6, -50], p: { fog: 0.11, pulse: 0.3 } },
  { s: 4.94, pos: [0, 2.5, -42], target: [0, 2.6, -56], p: { fog: 0.17 } },

  /* 06 — FINAL REVEAL: cut through the dark, threat display, pull back */
  {
    s: 5.06,
    cut: true,
    pos: [2.4, 0.8, 6.0],
    target: [0, 3.0, 0.3],
    p: { fov: 42, fog: 0.05, key: 0.5, env: 0.8, glow: 1.4, arms: 0.2, spores: 1, shafts: 0.9, pulse: 0 },
  },
  { s: 5.32, pos: [1.7, 1.3, 8.3], target: [0, 3.0, 0.2], p: { arms: 1, jaw: 1, pulse: 1.2, glow: 2.1, key: 1, rim: 1.6, sense: 2.6 } },
  { s: 5.55, pos: [0.9, 2.1, 11.5], target: [0, 2.85, 0], p: { fov: 34, jaw: 0.1, arms: 0.75, pulse: 0.35, glow: 1.5, sense: 1.6 } },
  { s: 6, pos: [0, 3.1, 16.5], target: [0, 2.6, 0], p: { fov: 32, arms: 0.3, pulse: 0, glow: 1.1, fog: 0.065, spores: 1.2, sense: 1.2 } },
]

/** values carry forward, so every key ends up with a complete scalar set */
const KEYS: (Key & { v: Scalars })[] = (() => {
  let carry: Scalars = { ...DEFAULTS }
  return RAW.map((k) => {
    carry = { ...carry, ...k.p }
    return { ...k, v: { ...carry } }
  })
})()

export const STORY_END = KEYS[KEYS.length - 1].s

/** anatomy feature focus windows in story time (centre used for jumps) */
export const ANATOMY_WINDOWS = [
  { from: 2.0, to: 2.235, center: 2.135 },
  { from: 2.235, to: 2.435, center: 2.335 },
  { from: 2.435, to: 2.635, center: 2.535 },
  { from: 2.635, to: 3.0, center: 2.735 },
]

const same = (a: V3, b: V3) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-4

function neighbour(i: number, field: 'pos' | 'target', dir: -1 | 1): V3 {
  const j = i + dir
  const k = KEYS[i]
  // never let the spline "see" across a cut or past the ends – mirror instead
  const crossesCut = dir === -1 ? k.cut : KEYS[j]?.cut
  if (j < 0 || j >= KEYS.length || crossesCut) {
    const other = KEYS[i - dir]
    if (!other) return k[field]
    const a = k[field]
    const b = other[field]
    return [2 * a[0] - b[0], 2 * a[1] - b[1], 2 * a[2] - b[2]]
  }
  return KEYS[j][field]
}

function splineInto(out: V3, i: number, t: number, field: 'pos' | 'target') {
  const p1 = KEYS[i][field]
  const p2 = KEYS[i + 1][field]
  if (same(p1, p2)) {
    out[0] = p1[0]
    out[1] = p1[1]
    out[2] = p1[2]
    return
  }
  const p0 = neighbour(i, field, -1)
  const p3 = neighbour(i + 1, field, 1)
  for (let c = 0; c < 3; c++) out[c] = catmull(p0[c], p1[c], p2[c], p3[c], t)
}

/** writes the rig state for story time `s` into `out` */
export function sampleRig(s: number, out: Rig) {
  const time = clamp(s, 0, STORY_END)
  let i = 0
  while (i < KEYS.length - 2 && time >= KEYS[i + 1].s) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const t = clamp((time - a.s) / (b.s - a.s))

  if (b.cut) {
    const tt = t < 0.5 ? 0 : 1
    const k = tt ? b : a
    out.pos[0] = k.pos[0]
    out.pos[1] = k.pos[1]
    out.pos[2] = k.pos[2]
    out.target[0] = k.target[0]
    out.target[1] = k.target[1]
    out.target[2] = k.target[2]
    for (const key of SCALAR_KEYS) out[key] = k.v[key]
    out.blackout = smoothstep(0, 0.4, t) * (1 - smoothstep(0.6, 1, t))
    return out
  }

  splineInto(out.pos, i, t, 'pos')
  splineInto(out.target, i, t, 'target')
  const e = t * t * (3 - 2 * t)
  for (const key of SCALAR_KEYS) out[key] = a.v[key] + (b.v[key] - a.v[key]) * e
  out.blackout = 0
  return out
}

/**
 * Reduced motion: no camera flights. The camera holds one still per chapter
 * part and changes under a short fade instead.
 */
const STILLS = [0, 0.5, 1.35, 2.13, 2.33, 2.53, 2.73, 3.0, 3.22, 3.5, 3.7, 4.42, 4.62, 5.32, 5.55]

export function stillFor(s: number) {
  let best = STILLS[0]
  for (const v of STILLS) if (s >= v - 0.06) best = v
  return best
}
