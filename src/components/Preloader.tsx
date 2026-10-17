import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/scroll'

interface Props {
  fontsReady: boolean
  sceneReady: boolean
  reduced: boolean
  onDone: () => void
}

const STEPS = ['Synthetisiere Organismus', 'Kompiliere Shader', 'Erwachen']

/**
 * Covers the page while fonts load and shaders compile. The counter follows
 * real milestones (fonts → first rendered frames) instead of a fake timer.
 */
export function Preloader({ fontsReady, sceneReady, reduced, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const shown = useRef({ value: 0 })
  const [step, setStep] = useState(0)
  const [gone, setGone] = useState(false)
  const finished = useRef(false)

  const target = (fontsReady ? 40 : 12) + (sceneReady ? 60 : 0)

  useEffect(() => {
    setStep(sceneReady ? 2 : fontsReady ? 1 : 0)
    const tween = gsap.to(shown.current, {
      value: target,
      duration: target === 100 ? 0.9 : 2.4,
      ease: target === 100 ? 'power2.inOut' : 'power1.out',
      onUpdate: () => {
        const v = Math.round(shown.current.value)
        if (counter.current) counter.current.textContent = String(v).padStart(3, '0')
        if (bar.current) bar.current.style.transform = `scaleX(${v / 100})`
      },
      onComplete: () => {
        if (target < 100 || finished.current || !root.current) return
        finished.current = true
        const tl = gsap.timeline({
          onComplete: () => {
            setGone(true)
          },
        })
        tl.to(root.current.querySelectorAll('.preloader__fade'), { opacity: 0, y: -12, duration: 0.5, stagger: 0.05, ease: 'power2.in' })
        tl.add(onDone, reduced ? 0.4 : 0.35)
        tl.to(
          root.current,
          reduced
            ? { opacity: 0, duration: 0.6 }
            : { clipPath: 'inset(50% 0% 50% 0%)', duration: 1.1, ease: 'expo.inOut' },
          0.3,
        )
      },
    })
    return () => {
      tween.kill()
    }
  }, [target, fontsReady, sceneReady, onDone, reduced])

  if (gone) return null

  return (
    <div className="preloader" ref={root} role="status" aria-live="polite">
      <div className="preloader__center">
        <svg className="preloader__mark preloader__fade" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 4 L40 25 L60 32 L40 39 L32 60 L24 39 L4 32 L24 25 Z" />
          <circle cx="32" cy="32" r="3.2" />
        </svg>
        <p className="preloader__title preloader__fade">SIGMATOX</p>
        <p className="preloader__step mono preloader__fade">
          <span className="preloader__dot" /> {STEPS[step]}
        </p>
      </div>
      <div className="preloader__foot preloader__fade">
        <span className="mono">Inoffizielles Fanprojekt</span>
        <span className="preloader__count mono">
          <span ref={counter}>000</span>
          <span className="preloader__pct">%</span>
        </span>
      </div>
      <span className="preloader__bar" ref={bar} />
    </div>
  )
}
