import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ANATOMY, CHAPTERS } from '../content/sigmatox'
import { gsap, ScrollTrigger, scrollToStory } from '../lib/scroll'
import { anchors } from '../lib/anchors'
import { story } from '../lib/story'
import { ANATOMY_WINDOWS } from '../scene/choreography'
import { useChapterTimeline } from '../hooks/useChapterTimeline'
import { ChapterHead } from '../components/Type'

interface Props {
  ready: boolean
  reduced: boolean
  spatial: boolean
}

function windowIndex(s: number) {
  const local = Math.max(ANATOMY_WINDOWS[0].from, s)
  const i = ANATOMY_WINDOWS.findIndex((w) => local >= w.from && local < w.to)
  return i === -1 ? ANATOMY_WINDOWS.length - 1 : i
}

export function Anatomy({ ready, reduced, spatial }: Props) {
  const ref = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const chapter = CHAPTERS[2]
  const feature = ANATOMY[active]

  // which feature is in focus follows the scroll position
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !ready) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        const i = windowIndex(2 + self.progress)
        anchors.active = i
        setActive((prev) => (prev === i ? prev : i))
      },
    })
    return () => st.kill()
  }, [ready])

  // panel copy swaps with a short masked transition
  useEffect(() => {
    const el = panel.current
    if (!el) return
    const q = gsap.utils.selector(el)
    const tl = gsap.timeline()
    tl.fromTo(q('.mline__inner'), { yPercent: reduced ? 0 : 105, opacity: reduced ? 0 : 1 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05 })
    tl.fromTo(q('.anatomy__text'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.15)
    return () => {
      tl.kill()
    }
  }, [active, reduced])

  // live camera readout (decorative instrument data, not game data)
  useEffect(() => {
    const tick = () => {
      if (story.chapter !== 2 || !readout.current) return
      const r = story.rig
      const dx = r.pos[0] - r.target[0]
      const dz = r.pos[2] - r.target[2]
      const dy = r.pos[1] - r.target[1]
      const az = ((Math.atan2(dx, dz) * 180) / Math.PI + 360) % 360
      const el = (Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI
      const dist = Math.hypot(dx, dy, dz)
      const mm = 18 / Math.tan((r.fov * Math.PI) / 360)
      readout.current.textContent = `AZ ${az.toFixed(0).padStart(3, '0')}°  EL ${el >= 0 ? '+' : '−'}${Math.abs(el).toFixed(1).padStart(4, '0')}°  D ${dist.toFixed(2)}  ${mm.toFixed(0)}MM`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  useChapterTimeline(ref, 2, ready, (tl, q) => {
    tl.fromTo(q('.chead, .anatomy__frame, .anatomy__readout'), { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0)
    tl.fromTo(q('.anatomy__panel'), { opacity: 0, x: reduced ? 0 : -30 }, { opacity: 1, x: 0, duration: 0.05, ease: 'power2.out' }, 0.02)
    tl.fromTo(q('.anatomy__frame'), { scale: 1.15 }, { scale: 1, duration: 0.08, ease: 'power2.out' }, 0)
    tl.to(q('.anatomy__panel, .chead, .anatomy__frame, .anatomy__readout'), { opacity: 0, duration: 0.04 }, 0.77)
  })

  return (
    <section id={chapter.id} ref={ref} className="chapter chapter--anatomy" style={{ ['--len' as string]: chapter.len }}>
      <div className="stage stage--anatomy">
        <ChapterHead no={chapter.no} title={chapter.title} />
        <div className="anatomy__frame" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <p className="anatomy__readout mono" aria-hidden="true">
          <span className="anatomy__rec" /> SCAN <span ref={readout} />
        </p>

        <div className="anatomy__panel" ref={panel} aria-live="polite">
          <span
            className="anatomy__anchor"
            ref={(el) => {
              anchors.target = el
            }}
          />
          <p className="anatomy__fig mono">
            <span className="mline">
              <span className="mline__inner">
                {feature.fig} <span className="anatomy__latin">/ {feature.name}</span>
              </span>
            </span>
          </p>
          <h3 className="display-m anatomy__title">
            <span className="mline">
              <span className="mline__inner">{feature.title}</span>
            </span>
          </h3>
          <p className="body anatomy__text">{feature.text}</p>
          <ol className="anatomy__index">
            {ANATOMY.map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  className={i === active ? 'is-active' : ''}
                  onClick={() => scrollToStory(ANATOMY_WINDOWS[i].center, 1.4)}
                  aria-label={`${f.fig}: ${f.title}`}
                  aria-current={i === active}
                >
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                  <i />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {spatial && (
        <div
          className="anatomy__layer"
          data-on="0"
          ref={(el) => {
            anchors.layer = el
          }}
        >
          <svg className="anatomy__lines" aria-hidden="true">
            <path
              ref={(el) => {
                anchors.line = el
              }}
            />
          </svg>
          {ANATOMY.map((f, i) => (
            <button
              type="button"
              key={f.id}
              className={`hotspot ${i === active ? 'is-active' : ''}`}
              data-cursor
              ref={(el) => {
                anchors.points[i] = { el, pos: f.anchor }
              }}
              onClick={() => scrollToStory(ANATOMY_WINDOWS[i].center, 1.4)}
              aria-label={`Fokus: ${f.title}`}
            >
              <span className="hotspot__ring" />
              <span className="hotspot__core" />
              <span className="hotspot__label mono">{f.fig}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
