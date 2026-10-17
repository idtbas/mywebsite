import { useEffect, useRef } from 'react'
import { CHAPTERS, DARKNESS } from '../content/sigmatox'
import { gsap } from '../lib/scroll'
import { story } from '../lib/story'
import { useChapterTimeline } from '../hooks/useChapterTimeline'
import { ChapterHead } from '../components/Type'

export function Darkness({ ready, reduced }: { ready: boolean; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const depth = useRef<HTMLSpanElement>(null)
  const chapter = CHAPTERS[4]

  useEffect(() => {
    let last = ''
    const tick = () => {
      if (story.chapter !== 4 || !depth.current) return
      // distance travelled since the dive began (decorative instrument)
      const d = Math.max(0, 4.5 - story.rig.pos[2])
      const text = d.toFixed(1).replace('.', ',').padStart(5, '0')
      if (text !== last) {
        depth.current.textContent = text
        last = text
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  useChapterTimeline(ref, 4, ready, (tl, q) => {
    tl.fromTo(q('.chead, .depth'), { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.02)
    const frags = q('.frag')
    const span = 0.17
    frags.forEach((frag, i) => {
      const start = 0.04 + i * 0.145
      if (reduced) {
        tl.fromTo(frag, { opacity: 0 }, { opacity: 1, duration: span * 0.3 }, start)
        tl.to(frag, { opacity: 0, duration: span * 0.3 }, start + span * 0.7)
        return
      }
      // each line drifts toward the camera and past it, like the spores
      tl.fromTo(
        frag,
        { opacity: 0, scale: 0.55, filter: 'blur(10px)', z: 0 },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: span * 0.42, ease: 'power2.out' },
        start,
      )
      tl.to(frag, { opacity: 0, scale: 1.9, filter: 'blur(14px)', duration: span * 0.4, ease: 'power2.in' }, start + span * 0.6)
    })
    tl.to(q('.chead, .depth'), { opacity: 0, duration: 0.03 }, 0.76)
  })

  return (
    <section id={chapter.id} ref={ref} className="chapter chapter--darkness" style={{ ['--len' as string]: chapter.len }}>
      <div className="stage stage--dark">
        <ChapterHead no={chapter.no} title={chapter.title} />
        <p className="depth mono" aria-hidden="true">
          <span className="depth__label">Tiefe</span>
          <span className="depth__value">
            −<span ref={depth}>000,0</span> m
          </span>
        </p>
        <div className="frags">
          {DARKNESS.fragments.map((f, i) => (
            <p className={`frag frag--${i} serif`} key={i}>
              {f}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
