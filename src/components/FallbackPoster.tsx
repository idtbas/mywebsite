import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { creatureSpec } from '../scene/creature/creatureSpec'
import { CLS, TubePath } from '../scene/creature/tube'
import { mulberry32 } from '../lib/math'

interface Dab {
  x: number
  y: number
  r: number
  z: number
  cls: number
  t: number
}

/**
 * Shown when WebGL is unavailable or the GPU context is lost. It paints the
 * same procedural creature with the 2D canvas API: every tube is sampled,
 * projected with a real perspective camera and drawn back to front.
 */
export default function FallbackPoster() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const parts = creatureSpec()

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = el.clientWidth
      const h = el.clientHeight
      el.width = Math.round(w * dpr)
      el.height = Math.round(h * dpr)
      const ctx = el.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cam = new THREE.PerspectiveCamera(32, w / h, 0.1, 100)
      const portrait = w / h < 1
      cam.position.set(portrait ? 4.2 : 6.2, 3.2, portrait ? 13 : 10.5)
      cam.lookAt(portrait ? 0.3 : -1.2, 2.5, 0)
      cam.updateMatrixWorld()
      cam.updateProjectionMatrix()
      const focal = h / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)
      const v = new THREE.Vector3()
      const viewPos = new THREE.Vector3()

      const dabs: Dab[] = []
      for (const part of parts) {
        for (const tube of part.tubes) {
          const steps = Math.max(6, Math.round((tube.tubular ?? 24) * 0.7))
          const path = new TubePath(tube.points, steps, tube.up)
          const sy = tube.scale?.[1] ?? 1
          for (let i = 0; i <= steps; i++) {
            const t = i / steps
            const p = path.P[i]
            viewPos.copy(p).applyMatrix4(cam.matrixWorldInverse)
            const depth = -viewPos.z
            if (depth <= 0.1) continue
            v.copy(p).project(cam)
            const r = (tube.radius(t, Math.PI / 2) * sy * focal) / depth
            dabs.push({
              x: (v.x * 0.5 + 0.5) * w,
              y: (-v.y * 0.5 + 0.5) * h,
              r: Math.max(0.4, r),
              z: depth,
              cls: tube.cls ?? CLS.armour,
              t,
            })
          }
        }
      }
      dabs.sort((a, b) => b.z - a.z)

      ctx.fillStyle = '#020403'
      ctx.fillRect(0, 0, w, h)
      const halo = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.6)
      halo.addColorStop(0, 'rgba(70, 140, 40, 0.22)')
      halo.addColorStop(1, 'rgba(2, 4, 3, 0)')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, w, h)

      // rim pass: draws a soft green outline behind everything
      ctx.save()
      ctx.shadowColor = 'rgba(141, 255, 47, 0.55)'
      ctx.shadowBlur = 18
      ctx.fillStyle = '#0d1a10'
      for (const d of dabs) {
        if (d.cls === CLS.sense) continue
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r * 1.04, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // body pass
      for (const d of dabs) {
        if (d.cls === CLS.sense) continue
        const g = ctx.createRadialGradient(d.x - d.r * 0.35, d.y - d.r * 0.45, d.r * 0.1, d.x, d.y, d.r)
        const lift = d.cls === CLS.bone ? 0.4 : d.cls === CLS.keratin ? 0.14 + d.t * 0.1 : 0.1
        g.addColorStop(0, `rgba(${Math.round(40 + lift * 140)}, ${Math.round(48 + lift * 140)}, ${Math.round(44 + lift * 120)}, 1)`)
        g.addColorStop(0.55, '#0b100e')
        g.addColorStop(1, '#030605')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // bioluminescent sensory slits
      ctx.save()
      ctx.shadowColor = '#9dff3a'
      ctx.shadowBlur = 16
      ctx.fillStyle = '#d6ffb0'
      for (const d of dabs) {
        if (d.cls !== CLS.sense) continue
        ctx.beginPath()
        ctx.arc(d.x, d.y, Math.max(1.2, d.r * 0.8), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // spores
      const rnd = mulberry32(3)
      for (let i = 0; i < 160; i++) {
        const x = rnd() * w
        const y = rnd() * h
        const r = 0.6 + Math.pow(rnd(), 3) * 2.6
        ctx.fillStyle = `rgba(157, 255, 58, ${0.15 + rnd() * 0.5})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    draw()
    let timer = 0
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(draw, 200)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="fallback">
      <canvas ref={canvas} className="fallback__canvas" />
      <div className="fallback__pulse" />
      <p className="fallback__note mono">Statische Ansicht · WebGL nicht verfügbar</p>
    </div>
  )
}
