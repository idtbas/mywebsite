import { useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'

/** a quiet two-part cursor for mouse users; touch devices never see it */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const d = dot.current
    const r = ring.current
    if (!d || !r) return
    document.documentElement.classList.add('has-cursor')
    const dx = gsap.quickTo(d, 'x', { duration: 0.12, ease: 'power3.out' })
    const dy = gsap.quickTo(d, 'y', { duration: 0.12, ease: 'power3.out' })
    const rx = gsap.quickTo(r, 'x', { duration: 0.5, ease: 'power3.out' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.5, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      const interactive = (e.target as Element | null)?.closest('a, button, [data-cursor]')
      r.classList.toggle('is-active', Boolean(interactive))
    }
    const down = () => r.classList.add('is-down')
    const up = () => r.classList.remove('is-down')
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ring} />
      <div className="cursor__dot" ref={dot} />
    </div>
  )
}
