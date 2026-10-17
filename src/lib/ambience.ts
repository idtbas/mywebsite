/**
 * Generative ambient sound – no audio files. A detuned low drone, a slow
 * "breathing" noise band and a heartbeat thump that is synced to the energy
 * wave travelling through the creature's veins (one beat every 1 / 0.36 s).
 * Off by default; browsers (and iOS) only allow audio after a user gesture.
 */
type AudioCtor = typeof AudioContext

class Ambience {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private lastBeat = -1
  enabled = false

  private build() {
    const Ctor: AudioCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
    if (!Ctor) return false
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp).connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200
    filter.Q.value = 5
    filter.connect(master)

    const voices: [number, OscillatorType, number][] = [
      [55, 'sawtooth', 0.11],
      [55.35, 'sawtooth', 0.11],
      [82.6, 'triangle', 0.05],
      [36.7, 'sine', 0.22],
    ]
    for (const [freq, type, level] of voices) {
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = level
      osc.connect(g).connect(freq < 40 ? master : filter)
      osc.start()
    }

    // breathing noise band
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 420
    band.Q.value = 0.9
    const breath = ctx.createGain()
    breath.gain.value = 0.03
    noise.connect(band).connect(breath).connect(master)
    noise.start()
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.12
    const depth = ctx.createGain()
    depth.gain.value = 0.028
    lfo.connect(depth).connect(breath.gain)
    lfo.start()

    this.ctx = ctx
    this.master = master
    this.filter = filter
    return true
  }

  async setEnabled(on: boolean) {
    if (on && !this.ctx && !this.build()) return
    if (!this.ctx || !this.master) return
    this.enabled = on
    if (on) await this.ctx.resume()
    this.master.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, on ? 1.2 : 0.4)
  }

  /** called every frame with the current scene energy */
  update(time: number, intensity: number) {
    if (!this.enabled || !this.ctx || !this.filter) return
    const now = this.ctx.currentTime
    this.filter.frequency.setTargetAtTime(170 + intensity * 520, now, 0.35)
    const beat = Math.floor(time * 0.36)
    if (beat !== this.lastBeat) {
      this.lastBeat = beat
      this.thump(0.35 + intensity * 0.4)
    }
  }

  private thump(level: number) {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const t = ctx.currentTime
    for (const [delay, scale] of [
      [0, 1],
      [0.24, 0.6],
    ] as const) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(62, t + delay)
      osc.frequency.exponentialRampToValueAtTime(30, t + delay + 0.22)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t + delay)
      g.gain.exponentialRampToValueAtTime(level * scale, t + delay + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.32)
      osc.connect(g).connect(this.master)
      osc.start(t + delay)
      osc.stop(t + delay + 0.4)
    }
  }
}

export const ambience = new Ambience()
