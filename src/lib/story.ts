import { CHAPTERS } from '../content/sigmatox'

/**
 * Shared, mutable runtime state. Scroll handlers, the GSAP ticker and the
 * WebGL render loop all read and write this object directly so that nothing
 * scroll-related ever triggers a React re-render.
 */

export interface Rig {
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
  roll: number
  /** horizontal lens shift as a fraction of the frame width (landscape only) */
  shift: number
  fog: number
  key: number
  rim: number
  env: number
  glow: number
  veins: number
  pulse: number
  sense: number
  reveal: number
  dissolve: number
  spores: number
  shafts: number
  arms: number
  jaw: number
  scan: number
  blackout: number
}

export const createRig = (): Rig => ({
  pos: [0, 2.6, 10.5],
  target: [0, 2.6, 0],
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
  blackout: 0,
})

export const story = {
  /** continuous story time 0..CHAPTERS.length driven by scroll */
  raw: 0,
  /** damped story time used for rendering */
  smooth: 0,
  /** story time units per second, signed */
  velocity: 0,
  chapter: 0,
  /** per-chapter progress while its sticky stage is pinned (0..1) */
  stage: new Array<number>(CHAPTERS.length).fill(0),
  /** 0..1 progression of the opening "awakening" sequence */
  intro: 0,
  introDone: false,
  /** normalised pointer, -1..1, y up */
  pointer: { x: 0, y: 0, active: false, lastMove: 0 },
  reducedMotion: false,
  rig: createRig(),
  time: 0,
}

export const CHAPTER_COUNT = CHAPTERS.length

type Listener = (chapter: number) => void
const chapterListeners = new Set<Listener>()

export function onChapterChange(fn: Listener) {
  chapterListeners.add(fn)
  return () => {
    chapterListeners.delete(fn)
  }
}

export function setChapter(index: number) {
  if (index === story.chapter) return
  story.chapter = index
  chapterListeners.forEach((fn) => fn(index))
}
