import { useRef } from 'react'
import { CHAPTERS, FINALE } from '../content/sigmatox'
import { CONFIG } from '../config'
import { scrollToStory } from '../lib/scroll'
import { useChapterTimeline } from '../hooks/useChapterTimeline'
import { ChapterHead, Letters, MaskLines } from '../components/Type'
import { Magnetic } from '../components/Magnetic'

export function Reveal({ ready, reduced }: { ready: boolean; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const chapter = CHAPTERS[5]

  useChapterTimeline(ref, 5, ready, (tl, q) => {
    tl.fromTo(q('.chead'), { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.06)
    tl.fromTo(
      q('.reveal__title .letter__inner'),
      reduced ? { opacity: 0 } : { yPercent: 60, opacity: 0, filter: 'blur(12px)' },
      { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.12, stagger: { each: 0.018, from: 'edges' }, ease: 'power3.out' },
      0.1,
    )
    if (!reduced) {
      // a shudder through the letters as the creature roars
      tl.fromTo(q('.reveal__title'), { x: 0 }, { x: 6, duration: 0.008, repeat: 9, yoyo: true, ease: 'none' }, 0.29)
      tl.fromTo(q('.reveal__title'), { letterSpacing: '0em' }, { letterSpacing: '0.04em', duration: 0.3, ease: 'power1.out' }, 0.29)
    }
    tl.fromTo(q('.reveal__line'), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.3)
    tl.fromTo(
      q('.reveal__tagline .mline__inner'),
      { yPercent: reduced ? 0 : 110, opacity: reduced ? 0 : 1 },
      { yPercent: 0, opacity: 1, duration: 0.06, stagger: 0.03, ease: 'power3.out' },
      0.36,
    )
    tl.fromTo(q('.reveal__cta'), { opacity: 0, y: reduced ? 0 : 20 }, { opacity: 1, y: 0, duration: 0.06 }, 0.46)
  })

  return (
    <section id={chapter.id} ref={ref} className="chapter chapter--reveal" style={{ ['--len' as string]: chapter.len }}>
      <div className="stage stage--reveal">
        <ChapterHead no={chapter.no} title={chapter.title} />
        <div className="reveal">
          <h2 className="reveal__title" aria-label={FINALE.title}>
            <Letters text={FINALE.title} />
          </h2>
          <p className="reveal__line mono">{FINALE.line}</p>
          <MaskLines as="p" lines={FINALE.tagline} className="reveal__tagline serif" />
          <div className="reveal__cta">
            <Magnetic>
              <button type="button" className="btn btn--primary" onClick={() => scrollToStory(0, 3)} data-cursor>
                <span className="btn__label">{FINALE.restart}</span>
                <span className="btn__icon" aria-hidden="true">↺</span>
              </button>
            </Magnetic>
            <Magnetic>
              <a className="btn btn--ghost" href={CONFIG.wikiUrl} target="_blank" rel="noreferrer" data-cursor>
                <span className="btn__label">{FINALE.wiki}</span>
                <span className="btn__icon" aria-hidden="true">↗</span>
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  )
}
