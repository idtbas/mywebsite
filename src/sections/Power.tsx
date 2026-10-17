import { useRef } from 'react'
import { ABILITIES, CHAPTERS, POWER } from '../content/sigmatox'
import { useChapterTimeline } from '../hooks/useChapterTimeline'
import { ChapterHead, MaskLines } from '../components/Type'

/** local story-time windows, aligned with the camera keys in choreography.ts */
const WINDOWS = [
  { from: 0.04, to: 0.33 },
  { from: 0.35, to: 0.56 },
  { from: 0.58, to: 0.78 },
]

export function Power({ ready, reduced }: { ready: boolean; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const chapter = CHAPTERS[3]

  useChapterTimeline(ref, 3, ready, (tl, q) => {
    const words = q('.kinetic')
    const panels = q('.ability')
    tl.fromTo(q('.chead, .power__kicker'), { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0)

    WINDOWS.forEach((w, i) => {
      const word = words[i]
      const panel = panels[i]
      const span = w.to - w.from
      // the giant word travels through the frame for the whole window
      tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 0.03 }, w.from)
      tl.to(word, { opacity: 0, duration: 0.03 }, w.to - 0.03)
      if (!reduced) {
        if (i === 1) {
          tl.fromTo(word, { yPercent: 35, rotate: -90 }, { yPercent: -35, rotate: -90, duration: span }, w.from)
        } else if (i === 2) {
          tl.fromTo(word, { scale: 0.82, letterSpacing: '0.18em' }, { scale: 1.06, letterSpacing: '-0.02em', duration: span }, w.from)
        } else {
          tl.fromTo(word, { xPercent: 22 }, { xPercent: -22, duration: span }, w.from)
        }
      }
      // ability panel
      tl.fromTo(
        panel.querySelectorAll('.mline__inner'),
        { yPercent: reduced ? 0 : 110, opacity: reduced ? 0 : 1 },
        { yPercent: 0, opacity: 1, duration: 0.04, stagger: 0.01, ease: 'power3.out' },
        w.from + 0.03,
      )
      tl.fromTo(panel.querySelectorAll('.ability__rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.05, ease: 'power2.inOut' }, w.from + 0.03)
      tl.fromTo(panel.querySelectorAll('.ability__fade'), { opacity: 0 }, { opacity: 1, duration: 0.04 }, w.from + 0.05)
      tl.set(panel, { visibility: 'visible' }, w.from)
      tl.to(panel, { opacity: 0, duration: 0.025 }, w.to - 0.03)
      tl.set(panel, { visibility: 'hidden' }, w.to)
    })

    // invisibility: the word's fill drains away while the creature vanishes
    tl.fromTo(q('.kinetic--0 .kinetic__fill'), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.08 }, 0.06)
    tl.to(q('.kinetic--0 .kinetic__fill'), { opacity: 0, duration: 0.05 }, 0.15)
    tl.fromTo(
      q('.power__scent .mline__inner'),
      { yPercent: reduced ? 0 : 110, opacity: reduced ? 0 : 1 },
      { yPercent: 0, opacity: 1, duration: 0.04, stagger: 0.02, ease: 'power3.out' },
      0.19,
    )
    tl.fromTo(q('.power__scent-note'), { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.23)
    tl.to(q('.power__scent'), { opacity: 0, duration: 0.03 }, 0.3)

    tl.to(q('.chead, .power__kicker'), { opacity: 0, duration: 0.03 }, 0.77)
  })

  return (
    <section id={chapter.id} ref={ref} className="chapter chapter--power" style={{ ['--len' as string]: chapter.len }}>
      <div className="stage stage--power">
        <ChapterHead no={chapter.no} title={chapter.title} />
        <p className="power__kicker mono">{POWER.kicker}</p>

        <div className="power__words" aria-hidden="true">
          {ABILITIES.map((a, i) => (
            <div className={`kinetic kinetic--${i}`} key={a.id}>
              <span className="kinetic__outline">{a.word}</span>
              <span className="kinetic__fill">{a.word}</span>
            </div>
          ))}
        </div>

        <div className="power__abilities">
          {ABILITIES.map((a, i) => (
            <article className="ability" key={a.id}>
              <p className="ability__head mono">
                <span className="mline">
                  <span className="mline__inner">
                    <span className="ability__no">{String(i + 1).padStart(2, '0')}</span> {a.kind}
                  </span>
                </span>
              </p>
              <span className="ability__rule" />
              <h3 className="ability__name">
                <span className="mline">
                  <span className="mline__inner">{a.name}</span>
                </span>
              </h3>
              <p className="body ability__fade">{a.text}</p>
              {a.meta && <p className="note mono ability__fade">{a.meta}</p>}
            </article>
          ))}
        </div>

        <div className="power__scent">
          <MaskLines as="p" lines={POWER.scent} className="statement serif" />
          <p className="note mono power__scent-note">{POWER.scentNote}</p>
        </div>
      </div>
    </section>
  )
}
