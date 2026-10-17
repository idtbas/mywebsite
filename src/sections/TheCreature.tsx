import { useRef } from 'react'
import { CHAPTERS, PROFILE } from '../content/sigmatox'
import { SplitText } from '../lib/scroll'
import { useChapterTimeline } from '../hooks/useChapterTimeline'
import { ChapterHead, MaskLines } from '../components/Type'

export function TheCreature({ ready, reduced }: { ready: boolean; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const chapter = CHAPTERS[1]

  useChapterTimeline(ref, 1, ready, (tl, q) => {
    const rise = reduced ? 0 : 110
    tl.fromTo(q('.chead'), { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0)
    tl.fromTo(q('.creature__headline .mline__inner'), { yPercent: rise, opacity: reduced ? 0 : 1 }, { yPercent: 0, opacity: 1, duration: 0.09, stagger: 0.025, ease: 'power3.out' }, 0.01)

    tl.fromTo(q('.facts__rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.1, ease: 'power2.inOut' }, 0.1)
    tl.fromTo(
      q('.fact'),
      { opacity: 0, y: reduced ? 0 : 18 },
      { opacity: 1, y: 0, duration: 0.06, stagger: 0.022, ease: 'power2.out' },
      0.13,
    )

    const body = q('.creature__body')[0]
    if (body) {
      const split = SplitText.create(body, { type: 'words', wordsClass: 'word' })
      tl.fromTo(split.words, { opacity: 0.08 }, { opacity: 1, duration: 0.12, stagger: 0.006 }, 0.22)
    }
    tl.fromTo(q('.creature__status'), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.36)

    // the profile steps back, a single statement takes the frame
    tl.to(q('.creature__profile'), { opacity: 0, y: reduced ? 0 : -50, duration: 0.08, ease: 'power2.in' }, 0.44)
    tl.fromTo(
      q('.creature__statement .mline__inner'),
      { yPercent: rise, opacity: reduced ? 0 : 1 },
      { yPercent: 0, opacity: 1, duration: 0.08, stagger: 0.05, ease: 'power3.out' },
      0.48,
    )
    tl.to(q('.creature__statement'), { opacity: 0, y: reduced ? 0 : -40, duration: 0.07, ease: 'power2.in' }, 0.64)
    tl.to(q('.chead'), { opacity: 0, duration: 0.04 }, 0.66)
  })

  return (
    <section id={chapter.id} ref={ref} className="chapter chapter--creature" style={{ ['--len' as string]: chapter.len }}>
      <div className="stage stage--left">
        <ChapterHead no={chapter.no} title={chapter.title} />
        <div className="creature__profile">
          <MaskLines as="h2" lines={PROFILE.headline} className="display-l creature__headline" />
          <dl className="facts">
            <span className="facts__rule" />
            {PROFILE.facts.map((f) => (
              <div className="fact" key={f.label}>
                <dt className="mono">{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="body creature__body">{PROFILE.body}</p>
          <p className="note mono creature__status">{PROFILE.status}</p>
        </div>
        <MaskLines as="p" lines={PROFILE.statement} className="statement serif creature__statement" />
      </div>
    </section>
  )
}
