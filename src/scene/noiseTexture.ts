import * as THREE from 'three'

let cached: THREE.DataTexture | null = null

/**
 * Tileable fractal value noise generated on the CPU once at start-up.
 * Sampling a small texture is far cheaper on mobile GPUs than evaluating
 * procedural fbm for every pixel of every fog layer.
 */
export function getNoiseTexture(size = 256): THREE.DataTexture {
  if (cached) return cached
  const data = new Uint8Array(size * size * 4)
  const octaves = [
    { cells: 4, amp: 0.5 },
    { cells: 8, amp: 0.25 },
    { cells: 16, amp: 0.15 },
    { cells: 32, amp: 0.1 },
  ]
  // one random lattice per octave, wrapped so the texture tiles seamlessly
  const lattices = octaves.map((o, oi) => {
    const l = new Float32Array(o.cells * o.cells)
    let seed = 1337 + oi * 7919
    for (let i = 0; i < l.length; i++) {
      seed = (seed * 16807) % 2147483647
      l[i] = seed / 2147483647
    }
    return l
  })
  const smooth = (t: number) => t * t * (3 - 2 * t)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0
      octaves.forEach((o, oi) => {
        const lat = lattices[oi]
        const fx = (x / size) * o.cells
        const fy = (y / size) * o.cells
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const tx = smooth(fx - x0)
        const ty = smooth(fy - y0)
        const x1 = (x0 + 1) % o.cells
        const y1 = (y0 + 1) % o.cells
        const a = lat[y0 * o.cells + x0]
        const b = lat[y0 * o.cells + x1]
        const c = lat[y1 * o.cells + x0]
        const d = lat[y1 * o.cells + x1]
        v += (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty) * o.amp
      })
      const i = (y * size + x) * 4
      const byte = Math.max(0, Math.min(255, Math.round(v * 255)))
      // second channel is the same field shifted, for cheap decorrelated lookups
      data[i] = byte
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }
  // fill G with an offset copy of R
  const shift = (size / 2) | 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const src = (((y + shift) % size) * size + ((x + shift * 0.6) | 0) % size) * 4
      data[(y * size + x) * 4 + 1] = data[src]
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  cached = tex
  return tex
}
