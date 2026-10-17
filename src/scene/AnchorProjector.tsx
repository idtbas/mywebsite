import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { anchors } from '../lib/anchors'
import { story } from '../lib/story'

const _v = new THREE.Vector3()

/** projects anatomy anchors to screen space and draws the connector line */
export function AnchorProjector() {
  const wasOn = useRef(false)
  useFrame(({ camera, size }) => {
    const s = story.smooth
    const on = s > 1.98 && s < 2.8 && story.intro >= 1
    if (anchors.layer && on !== wasOn.current) anchors.layer.dataset.on = on ? '1' : '0'
    wasOn.current = on
    if (!on) return

    anchors.points.forEach((pt, i) => {
      _v.set(pt.pos[0], pt.pos[1], pt.pos[2]).project(camera)
      const x = (_v.x * 0.5 + 0.5) * size.width
      const y = (-_v.y * 0.5 + 0.5) * size.height
      const behind = _v.z > 1
      anchors.screen[i] = { x, y, behind }
      if (pt.el) {
        pt.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        pt.el.style.visibility = behind ? 'hidden' : 'visible'
      }
    })

    const a = anchors.screen[anchors.active]
    if (anchors.line && anchors.target && a) {
      const r = anchors.target.getBoundingClientRect()
      const tx = r.left + r.width / 2
      const ty = r.top + r.height / 2
      // a 45° elbow from the hotspot toward the text panel
      const dy = ty - a.y
      const dx = tx - a.x
      const run = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5
      const ex = a.x + Math.sign(dx) * run
      const ey = a.y + Math.sign(dy) * run
      anchors.line.setAttribute('d', `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}`)
    }
  })
  return null
}
