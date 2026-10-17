import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { setChapter, story, CHAPTER_COUNT } from './story'

gsap.registerPlugin(ScrollTrigger, SplitText)
// iOS Safari resizes the viewport when its toolbars collapse – ignore that
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, SplitText }

let lenis: Lenis | null = null
const progress = new Array<number>(CHAPTER_COUNT).fill(0)
const ranges: { start: number; end: number }[] = []

function recompute() {
  let s = 0
  for (const p of progress) s += p
  story.raw = s
  setChapter(Math.min(CHAPTER_COUNT - 1, Math.floor(s)))
}

const raf = (time: number) => lenis?.raf(time * 1000)

/**
 * Smooth scrolling (Lenis, wheel/trackpad only – touch keeps native iOS
 * momentum) plus one ScrollTrigger per chapter that turns the page position
 * into continuous story time.
 */
export function initScroll(sections: HTMLElement[], reduced: boolean) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  if (!reduced) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
  }

  const triggers = sections.map((el, i) => {
    const last = i === sections.length - 1
    return ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: last ? 'max' : 'bottom top',
      onUpdate: (self) => {
        progress[i] = self.progress
        recompute()
      },
      onRefresh: (self) => {
        ranges[i] = { start: self.start, end: self.end }
        progress[i] = self.progress
        recompute()
      },
    })
  })

  return () => {
    triggers.forEach((t) => t.kill())
    if (lenis) {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenis = null
    }
  }
}

/** scroll position (px) that corresponds to a story time */
export function scrollForStory(s: number) {
  const i = Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor(s)))
  const r = ranges[i]
  if (!r) return 0
  const local = Math.min(1, Math.max(0, s - i))
  return r.start + (r.end - r.start) * local
}

export function scrollToStory(s: number, duration = 1.8) {
  const y = scrollForStory(s)
  if (lenis) {
    lenis.scrollTo(y, { duration, easing: (t) => 1 - Math.pow(1 - t, 4) })
  } else {
    window.scrollTo({ top: y, behavior: story.reducedMotion ? 'auto' : 'smooth' })
  }
}

export function lockScroll(lock: boolean) {
  document.documentElement.classList.toggle('is-locked', lock)
  if (lock) lenis?.stop()
  else lenis?.start()
}

export function isSmooth() {
  return lenis !== null
}
