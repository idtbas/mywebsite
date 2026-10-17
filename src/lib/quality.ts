export type Tier = 'low' | 'medium' | 'high'

export interface Quality {
  tier: Tier
  /** device pixel ratio range handed to the canvas */
  dpr: [number, number]
  postfx: boolean
  chromatic: boolean
  /** spore particles around the creature */
  spores: number
  /** spore particles inside the dark passage */
  tunnelSpores: number
  fogSheets: number
  /** multiplier for procedural geometry resolution */
  detail: number
  /** clearcoat physical material instead of the cheaper standard one */
  physical: boolean
  /** MSAA samples for the post-processing buffers */
  msaa: number
  arches: number
  isTouch: boolean
  isIOS: boolean
}

export interface DeviceInfo {
  isTouch: boolean
  isIOS: boolean
  isIPad: boolean
  isPhone: boolean
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent
  const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  const isIPhone = /iPhone|iPod/.test(ua)
  const isAndroidPhone = /Android/.test(ua) && /Mobile/.test(ua)
  const isTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
  return {
    isTouch,
    isIOS: isIPad || isIPhone,
    isIPad,
    isPhone: isIPhone || isAndroidPhone,
  }
}

let probe: { ok: boolean; renderer: string } | null = null

/** creates one throw-away context to check support and read the GPU name */
function probeWebGL() {
  if (probe) return probe
  probe = { ok: false, renderer: '' }
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
      probe = { ok: true, renderer: String(name ?? '') }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    // treated as unsupported
  }
  return probe
}

export function detectTier(device: DeviceInfo): Tier {
  const forced = new URLSearchParams(location.search).get('quality')
  if (forced === 'low' || forced === 'medium' || forced === 'high') return forced

  const nav = navigator as Navigator & { deviceMemory?: number }
  const memory = nav.deviceMemory ?? 8
  const cores = navigator.hardwareConcurrency || 4
  const gpu = probeWebGL().renderer

  if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu)) return 'low'
  if (device.isPhone) return memory <= 3 ? 'low' : 'medium'
  // iPads are fast but share memory with the OS – keep them on the safe tier
  if (device.isIPad || device.isTouch) return 'medium'
  if (memory <= 4 || cores <= 4) return 'medium'
  if (/Intel|UHD|Iris|Mali|Adreno [1-5]/i.test(gpu)) return 'medium'
  return 'high'
}

export function qualityFor(tier: Tier, device: DeviceInfo): Quality {
  const base = { isTouch: device.isTouch, isIOS: device.isIOS, tier }
  switch (tier) {
    case 'low':
      return {
        ...base,
        dpr: [0.75, 1.25],
        postfx: false,
        chromatic: false,
        spores: 450,
        tunnelSpores: 700,
        fogSheets: 4,
        detail: 0.65,
        physical: false,
        msaa: 0,
        arches: 6,
      }
    case 'medium':
      return {
        ...base,
        dpr: [1, device.isPhone ? 1.75 : 1.5],
        postfx: true,
        chromatic: false,
        spores: device.isPhone ? 700 : 1100,
        tunnelSpores: device.isPhone ? 1000 : 1600,
        fogSheets: 7,
        detail: 0.9,
        physical: true,
        // tile-based mobile GPUs resolve MSAA on-chip, phones keep it off
        msaa: device.isPhone ? 0 : 2,
        arches: 8,
      }
    case 'high':
      return {
        ...base,
        dpr: [1, 2],
        postfx: true,
        chromatic: true,
        spores: 2200,
        tunnelSpores: 3000,
        fogSheets: 10,
        detail: 1.25,
        physical: true,
        msaa: 4,
        arches: 10,
      }
  }
}

export function hasWebGL(): boolean {
  if (new URLSearchParams(location.search).has('nowebgl')) return false
  return probeWebGL().ok
}
