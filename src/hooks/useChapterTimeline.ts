import { useLayoutEffect, type RefObject } from 'react'
import { gsap } from '../lib/scroll'
import { CHAPTER_COUNT } from '../lib/story'

/**
 * Builds a scroll-scrubbed timeline for one chapter. Positions inside the
 * timeline are expressed in local story time (0..1), exactly like the camera
 * keyframes in choreography.ts – text and 3D stay frame-locked.
 */
export function useChapterTimeline(
  ref: RefObject<HTMLElement | null>,
  index: number,
  ready: boolean,
  build: (tl: gsap.core.Timeline, q: (selector: string) => HTMLElement[]) => void,
) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!ready || !el) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: index === CHAPTER_COUNT - 1 ? 'max' : 'bottom top',
          scrub: 0.35,
        },
      })
      const q = gsap.utils.selector(el) as (s: string) => HTMLElement[]
      build(tl, q)
      // pad the timeline so 1 unit always equals the full chapter
      tl.to({}, { duration: 0.0001 }, 0.9999)
    }, el)
    return () => ctx.revert()
    // build is intentionally excluded: timelines are created once per readiness
  }, [ready, index])
}
