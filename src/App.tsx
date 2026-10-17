import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { detectTier, getDeviceInfo, hasWebGL, qualityFor } from './lib/quality'
import { initScroll, lockScroll, ScrollTrigger } from './lib/scroll'
import { story } from './lib/story'
import { startDirector } from './scene/director'
import { useReducedMotion } from './hooks/useReducedMotion'
import { usePointer } from './hooks/usePointer'
import { Preloader } from './components/Preloader'
import { Hud } from './components/Hud'
import { Cursor } from './components/Cursor'
import { Awakening } from './sections/Awakening'
import { TheCreature } from './sections/TheCreature'
import { Anatomy } from './sections/Anatomy'
import { Power } from './sections/Power'
import { Darkness } from './sections/Darkness'
import { Reveal } from './sections/Reveal'
import { Footer } from './sections/Footer'

// the heavy 3D bundle and the 2D fallback load in parallel with the preloader
const Experience = lazy(() => import('./scene/Experience'))
const FallbackPoster = lazy(() => import('./components/FallbackPoster'))

export default function App() {
  const device = useMemo(getDeviceInfo, [])
  const quality = useMemo(() => qualityFor(detectTier(device), device), [device])
  const [webgl] = useState(hasWebGL)
  const [lost, setLost] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const reduced = useReducedMotion()
  const veil = useRef<HTMLDivElement>(null)
  const main = useRef<HTMLElement>(null)
  const spatial = webgl && !lost

  story.reducedMotion = reduced
  usePointer()

  useEffect(() => {
    // ?debug exposes the story state so automated checks can inspect it
    if (new URLSearchParams(location.search).has('debug')) {
      ;(window as unknown as { __story: typeof story }).__story = story
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('is-touch', device.isTouch)
    root.classList.toggle('is-ios', device.isIOS)
    root.classList.toggle('is-reduced', reduced)
  }, [device, reduced])

  useEffect(() => {
    let alive = true
    const done = () => alive && setFontsReady(true)
    document.fonts?.ready.then(done, done) ?? done()
    // never let a slow font or GPU keep visitors outside
    const t1 = window.setTimeout(done, 4000)
    const t2 = window.setTimeout(() => alive && setSceneReady(true), 15000)
    return () => {
      alive = false
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  useEffect(() => startDirector(veil.current), [])

  useEffect(() => {
    if (!fontsReady || !main.current) return
    const sections = Array.from(main.current.querySelectorAll<HTMLElement>('.chapter'))
    const cleanup = initScroll(sections, reduced)
    lockScroll(true)
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      cancelAnimationFrame(id)
      cleanup()
    }
  }, [fontsReady, reduced])

  const onEntered = useCallback(() => {
    document.documentElement.dataset.intro = 'playing'
    setEntered(true)
    lockScroll(false)
  }, [])

  const onAwake = useCallback(() => {
    document.documentElement.dataset.intro = 'done'
  }, [])

  const onSceneReady = useCallback(() => setSceneReady(true), [])
  const onLost = useCallback(() => setLost(true), [])

  return (
    <>
      <div className="canvas-layer" aria-hidden="true">
        <Suspense fallback={null}>
          {spatial ? <Experience quality={quality} onReady={onSceneReady} onLost={onLost} /> : <FallbackPoster />}
        </Suspense>
      </div>
      <div className="veil" ref={veil} aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <main ref={main} className="story">
        <Awakening ready={fontsReady} entered={entered} reduced={reduced} onAwake={onAwake} />
        <TheCreature ready={fontsReady} reduced={reduced} />
        <Anatomy ready={fontsReady} reduced={reduced} spatial={spatial} />
        <Power ready={fontsReady} reduced={reduced} />
        <Darkness ready={fontsReady} reduced={reduced} />
        <Reveal ready={fontsReady} reduced={reduced} />
      </main>
      <Footer />

      <Hud />
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <Preloader fontsReady={fontsReady} sceneReady={sceneReady || !spatial} reduced={reduced} onDone={onEntered} />
    </>
  )
}
