import { useEffect, useRef, useState } from 'react'
import { CHAPTERS } from '../content/sigmatox'
import { gsap, scrollToStory } from '../lib/scroll'
import { onChapterChange, story, CHAPTER_COUNT } from '../lib/story'
import { ambience } from '../lib/ambience'
import { STORY_END } from '../scene/choreography'

/** fixed interface layer: brand, chapter index, navigation, progress, sound */
export function Hud() {
  const [chapter, setChapter] = useState(story.chapter)
  const [sound, setSound] = useState(false)
  const progress = useRef<HTMLSpanElement>(null)

  useEffect(() => onChapterChange(setChapter), [])

  useEffect(() => {
    let last = -1
    let atEnd = false
    const tick = () => {
      const end = story.smooth > 5.72
      if (end !== atEnd) {
        atEnd = end
        document.documentElement.classList.toggle('is-end', end)
      }
      const p = Math.min(1, story.smooth / STORY_END)
      if (Math.abs(p - last) > 0.0005 && progress.current) {
        progress.current.style.transform = `scaleX(${p.toFixed(4)})`
        last = p
      }
      const r = story.rig
      ambience.update(story.time, Math.min(1, r.pulse * 0.6 + (r.glow - 1) * 0.4 + r.sense * 0.08 + story.raw / 12))
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  const toggleSound = () => {
    const next = !sound
    setSound(next)
    void ambience.setEnabled(next)
  }

  const current = CHAPTERS[chapter]

  return (
    <div className="hud">
      <a
        className="hud__brand"
        href="#awakening"
        onClick={(e) => {
          e.preventDefault()
          scrollToStory(0, 2.4)
        }}
        aria-label="Zum Anfang"
      >
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 4 L40 25 L60 32 L40 39 L32 60 L24 39 L4 32 L24 25 Z" />
        </svg>
        <span className="hud__name">SIGMATOX</span>
        <span className="hud__tag mono">Fan Experience</span>
      </a>

      <div className="hud__right">
        <p className="hud__chapter mono" aria-live="polite">
          <span className="hud__chapter-no">{current.no}</span>
          <span className="hud__chapter-sep">/</span>
          <span>{String(CHAPTER_COUNT).padStart(2, '0')}</span>
          <span className="hud__chapter-title">{current.title}</span>
        </p>
        <button
          type="button"
          className={`hud__sound ${sound ? 'is-on' : ''}`}
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={sound ? 'Klang ausschalten' : 'Klang einschalten'}
        >
          <span className="hud__bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="mono">{sound ? 'Ton an' : 'Ton aus'}</span>
        </button>
      </div>

      <nav className="hud__nav" aria-label="Kapitel">
        {CHAPTERS.map((c, i) => (
          <button
            type="button"
            key={c.id}
            className={`hud__navitem ${i === chapter ? 'is-current' : ''} ${i < chapter ? 'is-past' : ''}`}
            onClick={() => scrollToStory(i === 0 ? 0 : i + 0.02, 2.2)}
            aria-current={i === chapter ? 'step' : undefined}
            aria-label={`${c.no} ${c.title}`}
          >
            <span className="hud__navlabel mono">{c.title}</span>
            <span className="hud__navno mono">{c.no}</span>
            <span className="hud__navtick" />
          </button>
        ))}
      </nav>

      <div className="hud__progress" aria-hidden="true">
        <span ref={progress} />
      </div>
    </div>
  )
}
