import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { story } from '../lib/story'
import { damp, smoothstep } from '../lib/math'

const _target = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _fwd = new THREE.Vector3()

/**
 * Applies the sampled rig to the camera and layers secondary motion on top:
 * a slow "hand-held" drift, pointer/touch parallax and a horizontal lens shift
 * (film offset) that frames the creature beside the text on wide screens.
 */
export function CameraRig() {
  const parallax = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera
    const dt = Math.min(delta, 0.1)
    const r = story.rig
    const t = story.time
    const calm = story.reducedMotion ? 0 : 1

    const p = story.pointer
    parallax.current.x = damp(parallax.current.x, p.active ? p.x : 0, 2.2, dt)
    parallax.current.y = damp(parallax.current.y, p.active ? p.y : 0, 2.2, dt)

    _target.set(r.target[0], r.target[1], r.target[2])
    cam.position.set(r.pos[0], r.pos[1], r.pos[2])

    // the shots are composed for landscape; on portrait screens dolly back and
    // open the lens a little so the creature still fits the frame
    const aspect = state.size.width / state.size.height
    const narrow = Math.max(0, 1.2 / aspect - 1)
    // inside the passage there is no single subject to fit – keep the camera in it
    const passage = smoothstep(4.12, 4.24, story.smooth) * (1 - smoothstep(4.96, 5.02, story.smooth))
    if (narrow > 0) cam.position.sub(_target).multiplyScalar(1 + narrow * 0.44 * (1 - passage)).add(_target)
    cam.lookAt(_target)
    cam.updateMatrixWorld()
    cam.matrixWorld.extractBasis(_right, _up, _fwd)
    const drift = calm * 0.05
    const hx = (Math.sin(t * 0.31) * 0.6 + Math.sin(t * 0.83 + 1.3) * 0.4) * drift
    const hy = (Math.sin(t * 0.27 + 2.1) * 0.6 + Math.sin(t * 0.71) * 0.4) * drift
    const px = parallax.current.x * 0.35 * calm
    const py = parallax.current.y * 0.2 * calm
    cam.position.addScaledVector(_right, hx + px).addScaledVector(_up, hy + py)
    cam.lookAt(_target)
    if (r.roll !== 0) cam.rotateZ(r.roll)

    const shift = aspect > 1.15 ? r.shift : 0
    cam.fov = r.fov * (1 + narrow * 0.1)
    cam.filmOffset = -shift * aspect * 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.getFilmWidth()
    cam.updateProjectionMatrix()
  }, -1)

  return null
}
