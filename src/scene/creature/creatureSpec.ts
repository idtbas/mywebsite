import * as THREE from 'three'
import { mulberry32 } from '../../lib/math'
import { CLS, TubePath, belly, keel, profile, segmented, type TubeOptions, type V3 } from './tube'

/**
 * Procedural, Sigmatox-inspired creature.
 *
 * This is an original sculpture built from code – NOT the in-game model. Its
 * anatomy follows the public wiki description: bipedal, a horned eyeless head
 * with jagged teeth, additional pairs of arms (the rear pair being the
 * largest) and a tail that ends in a second toothed head.
 *
 * Units are roughly metres, y is up and the creature faces +z.
 */

export interface PartSpec {
  id: string
  /** creature-space pivot the part rotates around */
  pivot: V3
  tubes: TubeOptions[]
}

export const HEART: V3 = [0, 2.6, 0.5]
export const HEAD_CENTER: V3 = [0, 3.3, 2.0]

const mirror = (p: V3): V3 => [-p[0], p[1], p[2]]
const mirrorAll = (pts: V3[]) => pts.map(mirror)
const v3 = (v: THREE.Vector3): V3 => [v.x, v.y, v.z]
const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

interface SpikeOpts {
  cls?: number
  bend?: THREE.Vector3
  power?: number
  attach?: TubeOptions['attach']
  tubular?: number
  radial?: number
  scale?: [number, number]
  seed?: number
}

/** a tapering cone whose root is buried slightly below the surface */
function spike(base: THREE.Vector3, dir: THREE.Vector3, len: number, r0: number, o: SpikeOpts = {}): TubeOptions {
  const d = dir.clone().normalize()
  const bend = o.bend ?? new THREE.Vector3()
  const root = base.clone().addScaledVector(d, -len * 0.18)
  const mid = base.clone().addScaledVector(d, len * 0.5).addScaledVector(bend, 0.35)
  const tip = base.clone().addScaledVector(d, len).add(bend)
  const power = o.power ?? 1.15
  return {
    points: [v3(root), v3(mid), v3(tip)],
    radius: (t) => {
      const k = Math.max(0, (t - 0.15) / 0.85)
      return Math.max(0.002, r0 * Math.pow(1 - k, power))
    },
    tubular: o.tubular ?? 8,
    radial: o.radial ?? 7,
    cls: o.cls ?? CLS.keratin,
    attach: o.attach,
    scale: o.scale,
    seed: o.seed,
  }
}

/** a curved claw/finger defined by explicit points */
function claw(points: V3[], r0: number, cls: number = CLS.keratin, power = 1.05): TubeOptions {
  return {
    points,
    radius: (t) => Math.max(0.002, r0 * Math.pow(1 - t, power)),
    tubular: 12,
    radial: 7,
    cls,
  }
}

/* ------------------------------------------------------------------ */

export function creatureSpec(): PartSpec[] {
  const rnd = mulberry32(20261017)
  const parts: PartSpec[] = []

  /* ---------------------------------------------------------- torso */
  const spine: V3[] = [
    [0, 1.98, -0.78],
    [0, 2.12, -0.38],
    [0, 2.44, 0.04],
    [0, 2.7, 0.44],
    [0, 2.88, 0.8],
    [0, 2.98, 1.04],
  ]
  const torsoProfile = profile([
    [0, 0.3],
    [0.12, 0.44],
    [0.35, 0.5],
    [0.55, 0.56],
    [0.75, 0.48],
    [0.9, 0.36],
    [1, 0.3],
  ])
  const torsoSeg = segmented(9, 0.05)
  const torsoKeel = keel(0.16, 6)
  const torsoBelly = belly(0.12)
  const torsoRadius = (t: number, a: number) => torsoProfile(t) * torsoSeg(t) * torsoKeel(a) * torsoBelly(a)
  const torsoScale: [number, number] = [0.9, 1.05]
  const torsoPath = new TubePath(spine, 96)

  const torso: TubeOptions[] = [
    { points: spine, radius: torsoRadius, scale: torsoScale, tubular: 72, radial: 36, lump: 0.06, seed: 0.11 },
    {
      points: [
        [0, 2.86, 0.78],
        [0, 3.04, 1.12],
        [0, 3.16, 1.42],
      ],
      radius: (t, a) => profile([[0, 0.34], [0.6, 0.27], [1, 0.24]])(t) * segmented(5, 0.08)(t) * keel(0.2, 8)(a),
      scale: [0.95, 1],
      tubular: 24,
      radial: 28,
      lump: 0.05,
      seed: 0.21,
    },
  ]

  // dorsal spikes along the spine
  for (let i = 0; i < 8; i++) {
    const t = 0.06 + i * 0.105
    const base = torsoPath.surface(t, Math.PI / 2, torsoRadius, torsoScale, 0.9)
    const T = torsoPath.tangent(t)
    const up = torsoPath.normal(t, Math.PI / 2)
    const dir = up.clone().addScaledVector(T, -0.6)
    const s = Math.sin(Math.PI * Math.min(1, t + 0.1))
    torso.push(
      spike(base, dir, 0.24 + 0.28 * s + rnd() * 0.06, 0.06 + 0.035 * s, {
        bend: T.clone().multiplyScalar(-0.12),
        scale: [0.55, 1],
      }),
    )
  }
  // lateral armour spikes on the flanks
  for (const side of [1, -1]) {
    ;[0.28, 0.42, 0.56, 0.68].forEach((t, i) => {
      const a = side > 0 ? 0.32 : Math.PI - 0.32
      const base = torsoPath.surface(t, a, torsoRadius, torsoScale, 0.92)
      const T = torsoPath.tangent(t)
      const n = torsoPath.normal(t, a)
      const dir = n.clone().multiplyScalar(0.55).addScaledVector(T, -0.85)
      torso.push(spike(base, dir, 0.2 + i * 0.03 + rnd() * 0.05, 0.05))
    })
  }
  parts.push({ id: 'torso', pivot: [0, 0, 0], tubes: torso })

  /* ----------------------------------------------------------- head */
  const skull: V3[] = [
    [0, 3.18, 1.3],
    [0, 3.3, 1.62],
    [0, 3.28, 1.98],
    [0, 3.16, 2.34],
    [0, 3.0, 2.7],
  ]
  const skullProfile = profile([
    [0, 0.22],
    [0.16, 0.34],
    [0.36, 0.32],
    [0.6, 0.25],
    [0.84, 0.17],
    [1, 0.07],
  ])
  const skullKeel = keel(0.3, 12)
  const skullBelly = belly(0.22)
  const skullRadius = (t: number, a: number) =>
    skullProfile(t) * skullKeel(a) * skullBelly(a) * (1 + 0.1 * Math.cos(2 * a) * (1 - t))
  const skullScale: [number, number] = [0.84, 0.8]
  const skullPath = new TubePath(skull, 96)

  const head: TubeOptions[] = [
    { points: skull, radius: skullRadius, scale: skullScale, tubular: 54, radial: 32, lump: 0.05, seed: 0.31 },
  ]

  // great horns – swept back, ringed
  const horn: V3[] = [
    [0.15, 3.38, 1.52],
    [0.3, 3.68, 1.32],
    [0.5, 3.92, 0.92],
    [0.6, 4.0, 0.5],
    [0.62, 3.95, 0.2],
  ]
  const hornSeg = segmented(9, 0.12)
  const hornRadius = (t: number) => Math.max(0.004, 0.118 * Math.pow(1 - t, 1.05) * hornSeg(t))
  const smallHorn: V3[] = [
    [0.24, 3.3, 1.66],
    [0.44, 3.42, 1.46],
    [0.6, 3.44, 1.22],
    [0.68, 3.38, 1.0],
  ]
  for (const pts of [horn, mirrorAll(horn)]) {
    head.push({ points: pts, radius: hornRadius, tubular: 40, radial: 14, cls: CLS.keratin, seed: 0.41 })
  }
  for (const pts of [smallHorn, mirrorAll(smallHorn)]) {
    head.push({
      points: pts,
      radius: (t) => Math.max(0.003, 0.066 * Math.pow(1 - t, 1.1)),
      tubular: 22,
      radial: 10,
      cls: CLS.keratin,
    })
  }
  // crest along the skull
  for (let i = 0; i < 4; i++) {
    const t = 0.14 + i * 0.12
    const base = skullPath.surface(t, Math.PI / 2, skullRadius, skullScale, 0.9)
    const T = skullPath.tangent(t)
    const dir = skullPath.normal(t, Math.PI / 2).addScaledVector(T, -0.7)
    head.push(spike(base, dir, 0.2 - i * 0.025, 0.045, { scale: [0.5, 1] }))
  }
  // cheek spikes
  for (const a of [0.08, Math.PI - 0.08]) {
    for (const t of [0.22, 0.34]) {
      const base = skullPath.surface(t, a, skullRadius, skullScale, 0.9)
      const T = skullPath.tangent(t)
      const dir = skullPath.normal(t, a).addScaledVector(T, -1.1)
      head.push(spike(base, dir, 0.2, 0.04))
    }
  }
  // bioluminescent sensory slits (the creature has no visible eyes)
  for (const a of [0.32, Math.PI - 0.32]) {
    ;[0.4, 0.5, 0.6].forEach((t, i) => {
      const c = skullPath.surface(t, a, skullRadius, skullScale, 1.0)
      const T = skullPath.tangent(t)
      const half = 0.08 - i * 0.014
      head.push({
        points: [v3(c.clone().addScaledVector(T, -half)), v3(c), v3(c.clone().addScaledVector(T, half))],
        radius: (u) => 0.017 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.7) + 0.001,
        scale: [1, 0.3],
        tubular: 10,
        radial: 8,
        cls: CLS.sense,
        seed: rnd(),
      })
    })
  }
  // upper teeth – jagged, irregular
  for (const side of [1, -1]) {
    for (let i = 0; i < 8; i++) {
      const t = 0.48 + i * 0.065
      const a = side > 0 ? -0.62 : Math.PI + 0.62
      const base = skullPath.surface(t, a, skullRadius, skullScale, 0.9)
      const T = skullPath.tangent(t)
      const dir = new THREE.Vector3(0, -1, 0).addScaledVector(T, 0.18 + rnd() * 0.2).addScaledVector(skullPath.normal(t, a), 0.15)
      head.push(
        spike(base, dir, 0.1 + rnd() * 0.08, 0.026 + rnd() * 0.008, {
          cls: CLS.bone,
          bend: T.clone().multiplyScalar(-0.03),
          power: 0.95,
          tubular: 6,
          radial: 6,
        }),
      )
    }
  }
  parts.push({ id: 'head', pivot: [0, 3.17, 1.42], tubes: head })

  /* ------------------------------------------------------------ jaw */
  const jawPts: V3[] = [
    [0, 3.02, 1.42],
    [0, 2.94, 1.82],
    [0, 2.87, 2.2],
    [0, 2.86, 2.52],
  ]
  const jawRadius = (t: number) => profile([[0, 0.18], [0.5, 0.15], [0.85, 0.1], [1, 0.045]])(t)
  const jawScale: [number, number] = [1.05, 0.6]
  const jawPath = new TubePath(jawPts, 64)
  const jaw: TubeOptions[] = [{ points: jawPts, radius: jawRadius, scale: jawScale, tubular: 32, radial: 20, lump: 0.05, seed: 0.51 }]
  for (const side of [1, -1]) {
    for (let i = 0; i < 8; i++) {
      const t = 0.3 + i * 0.085
      const a = side > 0 ? 0.62 : Math.PI - 0.62
      const base = jawPath.surface(t, a, jawRadius, jawScale, 0.85)
      const T = jawPath.tangent(t)
      const dir = new THREE.Vector3(0, 1, 0).addScaledVector(T, 0.15 + rnd() * 0.15)
      jaw.push(
        spike(base, dir, 0.08 + rnd() * 0.07, 0.022 + rnd() * 0.008, { cls: CLS.bone, power: 0.95, tubular: 6, radial: 6 }),
      )
    }
  }
  parts.push({ id: 'jaw', pivot: [0, 3.05, 1.48], tubes: jaw })

  /* ----------------------------------------------------------- tail */
  const tailPts: V3[] = [
    [0, 2.02, -0.5],
    [0, 1.78, -1.3],
    [0, 1.48, -2.15],
    [0.14, 1.24, -3.0],
    [0.38, 1.18, -3.78],
    [0.6, 1.38, -4.45],
    [0.7, 1.78, -4.9],
    [0.72, 2.12, -5.08],
  ]
  const tailProfile = profile([
    [0, 0.42],
    [0.18, 0.33],
    [0.45, 0.21],
    [0.7, 0.13],
    [0.83, 0.115],
    [0.88, 0.19],
    [0.93, 0.19],
    [0.97, 0.13],
    [1, 0.05],
  ])
  const tailSeg = segmented(16, 0.07)
  const tailKeel = keel(0.12, 6)
  const tailRadius = (t: number, a: number) => tailProfile(t) * (t < 0.82 ? tailSeg(t) : 1) * tailKeel(a)
  const tailScale: [number, number] = [0.95, 1]
  const tailSway = (t: number) => Math.pow(smooth01(0.06, 1, t), 1.3)
  const tailPath = new TubePath(tailPts, 160)
  const tail: TubeOptions[] = [
    {
      points: tailPts,
      radius: tailRadius,
      scale: tailScale,
      tubular: 120,
      radial: 26,
      lump: 0.05,
      sway: tailSway,
      seed: 0.61,
    },
  ]
  // dorsal tail spikes
  for (let i = 0; i < 12; i++) {
    const t = 0.05 + i * 0.062
    const base = tailPath.surface(t, Math.PI / 2, tailRadius, tailScale, 0.9)
    const T = tailPath.tangent(t)
    const dir = tailPath.normal(t, Math.PI / 2).addScaledVector(T, -0.7)
    tail.push(
      spike(base, dir, 0.08 + 0.3 * (1 - t), 0.03 + 0.04 * (1 - t), {
        attach: { along: t, sway: tailSway(t) },
        scale: [0.5, 1],
      }),
    )
  }
  // the second head: a ring of jagged teeth around the tip …
  for (let i = 0; i < 14; i++) {
    const t = 0.935 + (i % 2) * 0.03
    const a = (i / 14) * Math.PI * 2 + rnd() * 0.2
    const base = tailPath.surface(t, a, tailRadius, tailScale, 0.88)
    const T = tailPath.tangent(t)
    const dir = tailPath.normal(t, a).multiplyScalar(0.55).addScaledVector(T, 0.75)
    tail.push(
      spike(base, dir, 0.08 + rnd() * 0.06, 0.02, {
        cls: CLS.bone,
        attach: { along: t, sway: tailSway(t) },
        tubular: 6,
        radial: 6,
      }),
    )
  }
  // … and backward horns
  for (const a of [Math.PI / 2 - 0.55, Math.PI / 2 + 0.55]) {
    const t = 0.88
    const base = tailPath.surface(t, a, tailRadius, tailScale, 0.9)
    const T = tailPath.tangent(t)
    const dir = tailPath.normal(t, a).multiplyScalar(0.5).addScaledVector(T, -1)
    tail.push(spike(base, dir, 0.26, 0.045, { attach: { along: t, sway: tailSway(t) } }))
  }
  parts.push({ id: 'tail', pivot: [0, 0, 0], tubes: tail })

  /* ----------------------------------------------------------- legs */
  const leg: V3[] = [
    [0.34, 2.08, -0.42],
    [0.58, 1.66, -0.08],
    [0.66, 1.22, 0.16],
    [0.6, 0.86, -0.14],
    [0.56, 0.5, -0.5],
    [0.58, 0.2, -0.32],
    [0.6, 0.08, -0.06],
  ]
  const legProfile = profile([
    [0, 0.38],
    [0.14, 0.32],
    [0.3, 0.21],
    [0.38, 0.19],
    [0.5, 0.15],
    [0.62, 0.11],
    [0.8, 0.1],
    [0.92, 0.1],
    [1, 0.085],
  ])
  const legSeg = segmented(10, 0.04)
  for (const side of [1, -1]) {
    const m = (p: V3): V3 => (side > 0 ? p : mirror(p))
    const tubes: TubeOptions[] = [
      {
        points: leg.map(m),
        radius: (t) => legProfile(t) * legSeg(t),
        scale: [0.9, 1],
        tubular: 70,
        radial: 22,
        lump: 0.05,
        seed: side > 0 ? 0.71 : 0.72,
      },
    ]
    for (const dx of [-0.13, 0, 0.13]) {
      tubes.push(
        claw(
          [m([0.6 + dx * 0.3, 0.1, -0.1]), m([0.6 + dx * 0.7, 0.1, 0.18]), m([0.6 + dx, 0.02, 0.44])],
          0.065,
        ),
      )
    }
    tubes.push(claw([m([0.58, 0.16, -0.24]), m([0.6, 0.1, -0.4]), m([0.62, 0.03, -0.52])], 0.045))
    tubes.push(spike(new THREE.Vector3(...m([0.66, 1.24, 0.2])), new THREE.Vector3(0.15 * side, 0.4, 1), 0.26, 0.06))
    parts.push({ id: side > 0 ? 'legR' : 'legL', pivot: m([0.34, 2.08, -0.42]), tubes })
  }

  /* ----------------------------------------------------------- arms */
  const armSet: { id: string; pts: V3[]; prof: [number, number][]; segs: number; claws: V3[][]; clawR: number; extra?: (m: (p: V3) => V3, side: number) => TubeOptions[] }[] = [
    {
      id: 'armA',
      pts: [
        [0.3, 2.66, 0.7],
        [0.48, 2.4, 0.9],
        [0.53, 2.12, 1.04],
        [0.46, 1.96, 1.34],
        [0.4, 1.92, 1.55],
      ],
      prof: [
        [0, 0.15],
        [0.3, 0.12],
        [0.45, 0.1],
        [0.7, 0.085],
        [1, 0.07],
      ],
      segs: 6,
      claws: [-0.07, 0, 0.07].map((dx) => [
        [0.4 + dx * 0.4, 1.93, 1.5],
        [0.4 + dx, 1.86, 1.72],
        [0.4 + dx * 1.4, 1.68, 1.84],
      ]),
      clawR: 0.04,
    },
    {
      id: 'armB',
      pts: [
        [0.42, 2.82, 0.38],
        [0.8, 2.8, 0.42],
        [1.06, 2.62, 0.46],
        [1.14, 2.5, 0.52],
        [1.12, 2.28, 0.86],
        [1.02, 2.06, 1.22],
      ],
      prof: [
        [0, 0.16],
        [0.3, 0.12],
        [0.44, 0.105],
        [0.5, 0.125],
        [0.56, 0.1],
        [0.8, 0.08],
        [1, 0.065],
      ],
      segs: 8,
      claws: [-0.08, 0, 0.08].map((dx) => [
        [1.02 + dx * 0.4, 2.07, 1.17],
        [1.0 + dx, 2.0, 1.43],
        [0.96 + dx * 1.3, 1.8, 1.56],
      ]),
      clawR: 0.045,
    },
    {
      id: 'armC',
      pts: [
        [0.28, 2.98, 0.02],
        [0.74, 3.6, -0.3],
        [1.22, 4.18, -0.42],
        [1.42, 4.3, -0.36],
        [1.58, 4.22, -0.18],
        [1.9, 3.82, 0.36],
        [2.12, 3.42, 0.78],
        [2.2, 3.12, 1.04],
      ],
      prof: [
        [0, 0.2],
        [0.2, 0.15],
        [0.36, 0.115],
        [0.42, 0.15],
        [0.48, 0.11],
        [0.75, 0.085],
        [1, 0.07],
      ],
      segs: 11,
      claws: [
        [
          [2.24, 3.12, 1.04],
          [2.3, 2.85, 1.35],
          [2.22, 2.72, 1.5],
        ],
      ],
      clawR: 0.045,
      extra: (m, side) => [
        // the scythe blade
        {
          points: [m([2.2, 3.16, 1.0]), m([2.18, 2.62, 1.42]), m([1.98, 2.24, 1.62]), m([1.74, 2.1, 1.62])],
          radius: (t) => Math.max(0.003, 0.085 * Math.pow(1 - t, 0.85)),
          scale: [0.42, 1],
          tubular: 26,
          radial: 10,
          cls: CLS.keratin,
        },
        spike(new THREE.Vector3(...m([1.4, 4.3, -0.4])), new THREE.Vector3(0.15 * side, 1, -0.65), 0.62, 0.08),
        spike(new THREE.Vector3(...m([1.78, 4.0, 0.14])), new THREE.Vector3(0.25 * side, 1, -0.2), 0.26, 0.045),
        spike(new THREE.Vector3(...m([0.98, 3.92, -0.38])), new THREE.Vector3(0.1 * side, 1, -0.8), 0.32, 0.055),
      ],
    },
  ]

  for (const arm of armSet) {
    for (const side of [1, -1]) {
      const m = (p: V3): V3 => (side > 0 ? p : mirror(p))
      const prof = profile(arm.prof)
      const seg = segmented(arm.segs, 0.09)
      const tubes: TubeOptions[] = [
        {
          points: arm.pts.map(m),
          radius: (t, a) => prof(t) * seg(t) * keel(0.12, 6)(a),
          tubular: 48,
          radial: 16,
          lump: 0.05,
          seed: rnd(),
        },
        ...arm.claws.map((c) => claw(c.map(m), arm.clawR)),
        ...(arm.extra ? arm.extra(m, side) : []),
      ]
      parts.push({ id: `${arm.id}${side > 0 ? 'R' : 'L'}`, pivot: m(arm.pts[0]), tubes })
    }
  }

  return parts
}
