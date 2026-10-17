import gsap from 'gsap'
import { story, type Rig } from '../lib/story'
import { damp, lerp, smoothstep } from '../lib/math'
import { sampleRig, stillFor } from './choreography'

/**
 * Runs every frame on the GSAP ticker (independent of WebGL, so the DOM side
 * keeps working in the fallback): smooths story time, samples the
 * choreography, layers the opening sequence on top and drives the veil.
 */
export function startDirector(veil: HTMLElement | null) {
  let last = performance.now()
  let shownStill = stillFor(story.raw)
  let fade = 0
  let phase: 'idle' | 'out' | 'in' = 'idle'
  let lastVeil = -1

  const tick = () => {
    const now = performance.now()
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    story.time += dt

    const prev = story.smooth
    story.smooth = damp(story.smooth, story.raw, story.reducedMotion ? 12 : 5.2, dt)
    if (Math.abs(story.smooth - story.raw) < 1e-5) story.smooth = story.raw
    story.velocity = dt > 0 ? (story.smooth - prev) / dt : 0

    const rig = story.rig
    if (story.reducedMotion) {
      const target = stillFor(story.raw)
      if (target !== shownStill && phase === 'idle') phase = 'out'
      if (phase === 'out') {
        fade = Math.min(1, fade + dt / 0.22)
        if (fade >= 1) {
          shownStill = stillFor(story.raw)
          phase = 'in'
        }
      } else if (phase === 'in') {
        fade = Math.max(0, fade - dt / 0.4)
        if (fade <= 0) phase = 'idle'
      }
      sampleRig(shownStill, rig)
      rig.blackout = Math.max(rig.blackout, fade * 0.92)
    } else {
      sampleRig(story.smooth, rig)
    }

    applyIntro(rig, story.intro, story.reducedMotion)

    if (veil) {
      const v = Math.round(rig.blackout * 1000) / 1000
      if (v !== lastVeil) {
        veil.style.opacity = String(v)
        lastVeil = v
      }
    }
  }

  gsap.ticker.add(tick)
  return () => gsap.ticker.remove(tick)
}

/** neon-tube style ignition for the sensory slits */
function ignite(x: number) {
  if (x < 0.1) return 0
  if (x > 0.3) return 1
  const f = smoothstep(0.1, 0.3, x)
  const flicker = Math.sin(x * 190) > 0.15 || x > 0.26 ? 1 : 0.12
  return f * flicker
}

/** the opening "awakening" sequence, 0 = black, 1 = fully lit */
function applyIntro(r: Rig, x: number, reduced: boolean) {
  if (x >= 1) return
  const light = smoothstep(0.38, 1, x)
  r.spores *= smoothstep(0.02, 0.32, x)
  r.sense *= ignite(x)
  r.reveal = Math.min(r.reveal, smoothstep(0.26, 0.92, x))
  r.key *= light
  r.env *= light
  r.rim *= smoothstep(0.22, 0.85, x)
  r.shafts *= smoothstep(0.5, 1, x)
  r.fog = lerp(0.12, r.fog, smoothstep(0.15, 1, x))
  if (reduced) return
  const e = 1 - Math.pow(1 - smoothstep(0, 1, x), 3)
  r.pos[2] = lerp(r.pos[2] - 3.4, r.pos[2], e)
  r.pos[1] = lerp(r.pos[1] + 0.35, r.pos[1], e)
  r.fov = lerp(r.fov - 3, r.fov, e)
}
