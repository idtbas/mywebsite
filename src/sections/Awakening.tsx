import { useEffect, useRef } from 'react'
import { CHAPTERS, HERO } from '../content/sigmatox'
import { gsap } from '../lib/scroll'
import { story } from '../lib/story'
import { useChapterTimeline } from '../hooks/useChapterTimeline'
import { Letters } from '../components/Type'

interface Props {
  ready: boolean
  entered: boolean
  reduced: boolean
  onAwake: () => void
}

export function Awakening({ ready, entered, reduced, onAwake }: Props) {
  const ref = useRef<HTMLElement>(null)

  // the opening sequence plays once, on its own clock
  useEffect(() => {
    const el = ref.current
    if (!entered || !el) return
    const q = gsap.utils.selector(el)
    const tl = gsap.timeline({
      onComplete: () => {
        story.intro = 1
        story.introDone = true
        onAwake()
      },
    })
    tl.to(story, { intro: 1, duration: reduced ? 1.4 : 4.8, ease: 'none' }, 0)
    if (reduced) {
      tl.fromTo(q('.hero__inner'), { opacity: 0 }, { opacity: 1, duration: 1 }, 0.3)
    } else {
      tl.fromTo(q('.hero__kicker .mline__inner'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out' }, 1.5)
      tl.fromTo(
        q('.hero__title .letter__inner'),
        { yPercent: 118, opacity: 0, filter: 'blur(14px)', scaleY: 1.6 },
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          scaleY: 1,
          duration: 1.7,
          ease: 'expo.out',
          stagger: { each: 0.075, from: 'center' },
        },
        2.0,
      )
      tl.fromTo(q('.hero__scan'), { xPercent: -10, opacity: 0 }, { xPercent: 110, opacity: 1, duration: 1.5, ease: 'power2.inOut' }, 2.3)
      tl.to(q('.hero__scan'), { opacity: 0, duration: 0.3 }, 3.6)
      tl.fromTo(q('.hero__tagline .mline__inner'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, 3.0)
      tl.fromTo(q('.hero__meta-line'), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, 3.0)
      tl.fromTo(q('.hero__coords'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 3.6)
      tl.fromTo(q('.scroll-hint'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 3.9)
    }

    // impatient visitors: scrolling fast-forwards the awakening
    const hurry = () => tl.timeScale(3.5)
    window.addEventListener('wheel', hurry, { passive: true, once: true })
    window.addEventListener('touchmove', hurry, { passive: true, once: true })
    window.addEventListener('keydown', hurry, { once: true })
    return () => {
      tl.kill()
      window.removeEventListener('wheel', hurry)
      window.removeEventListener('touchmove', hurry)
      window.removeEventListener('keydown', hurry)
    }
  }, [entered, reduced, onAwake])

  useChapterTimeline(ref, 0, ready, (tl, q) => {
    tl.to(q('.scroll-hint__inner'), { opacity: 0, y: 20, duration: 0.06 }, 0.01)
    tl.to(q('.hero__kicker, .hero__meta'), { opacity: 0, y: reduced ? 0 : -30, duration: 0.18 }, 0.04)
    if (reduced) {
      tl.to(q('.hero__title'), { opacity: 0, duration: 0.25 }, 0.1)
    } else {
      // letters drift apart and past the camera as it pushes in
      tl.to(
        q('.hero__title .letter'),
        {
          xPercent: (i: number) => (i - 3.5) * 46,
          yPercent: (i: number) => -20 - Math.abs(i - 3.5) * 10,
          opacity: 0,
          duration: 0.34,
          ease: 'power2.in',
        },
        0.06,
      )
      tl.to(q('.hero__title'), { scale: 1.25, duration: 0.34, ease: 'power1.in' }, 0.06)
    }
  })

  const chapter = CHAPTERS[0]

  return (
    <section id={chapter.id} ref={ref} className="chapter chapter--awakening" style={{ ['--len' as string]: chapter.len }}>
      <div className="stage">
        <div className="hero">
          <div className="hero__inner">
            <p className="hero__kicker mono">
              <span className="mline">
                <span className="mline__inner">
                  <span className="hero__index">[{chapter.no}]</span> {HERO.kicker}
                </span>
              </span>
            </p>
            <h1 className="hero__title" aria-label={HERO.title}>
              <Letters text={HERO.title} />
              <span className="hero__scan" aria-hidden="true" />
            </h1>
            <div className="hero__meta">
              <span className="hero__meta-line" />
              <p className="hero__tagline serif">
                {HERO.tagline.map((line, i) => (
                  <span className="mline" key={i}>
                    <span className="mline__inner">{line}</span>
                  </span>
                ))}
              </p>
              <p className="hero__coords mono">Creatures of Sonaria · Fan Experience · Tier 5</p>
            </div>
          </div>
        </div>
        <div className="scroll-hint" aria-hidden="true">
          <div className="scroll-hint__inner">
            <span className="mono">{HERO.scrollHint}</span>
            <span className="scroll-hint__line">
              <i />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
