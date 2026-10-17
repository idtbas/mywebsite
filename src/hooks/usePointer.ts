import { useEffect } from 'react'
import { story } from '../lib/story'

/** tracks mouse and touch positions (passively – never blocks scrolling) */
export function usePointer() {
  useEffect(() => {
    const p = story.pointer
    const set = (x: number, y: number) => {
      p.x = (x / window.innerWidth) * 2 - 1
      p.y = -((y / window.innerHeight) * 2 - 1)
      p.active = true
      p.lastMove = performance.now()
    }
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') set(e.clientX, e.clientY)
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) set(t.clientX, t.clientY)
    }
    const release = () => {
      p.active = false
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchend', release, { passive: true })
    document.documentElement.addEventListener('mouseleave', release)
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', release)
      document.documentElement.removeEventListener('mouseleave', release)
    }
  }, [])
}
