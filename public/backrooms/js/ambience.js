/*
 * Ambiente: Summen der Leuchtstoffroehren, Flackern, ein zweiter Mauszeiger.
 * Alles haengt an einer einzigen Tiefe (0 = Original, 5 = tiefste Kopie, 6 = Ausgang).
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const HUM = [0, 0.006, 0.013, 0.024, 0.036, 0.05];
const FLICKER_EVERY = [0, 0, 45, 20, 10, 6]; // mittlere Sekunden zwischen zwei Flackern

function lerpTable(t, v) {
  if (v <= 0) return t[0];
  if (v >= t.length - 1) return t[t.length - 1];
  const i = Math.floor(v), f = v - i;
  return t[i] + (t[i + 1] - t[i]) * f;
}

export class Ambience {
  constructor() {
    this.depth = 0;
    this.silenced = false;
    this.ctx = null;
    this.master = null;
    this.flickerEl = document.getElementById('flicker');
    this.cursorEl = document.getElementById('other-cursor');
    this.trail = [];
    this.cursorGoneUntil = 0;
    this.mouseInside = false;
    this.lastMouse = { x: -1, y: -1 };
    this.nextFlicker = performance.now() + 20000;

    const unlock = () => this.unlock();
    ['pointerdown', 'keydown', 'touchend'].forEach((t) => window.addEventListener(t, unlock, { passive: true }));
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });

    if (finePointer && !reduceMotion) {
      window.addEventListener('mousemove', (e) => {
        this.mouseInside = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        this.trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        if (this.trail.length > 600) this.trail.splice(0, 200);
      }, { passive: true });
      document.documentElement.addEventListener('mouseleave', () => { this.mouseInside = false; });
    }
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      // Netzbrummen: 100 Hz (bei 50 Hz Netzfrequenz) mit Obertoenen
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 820; lp.Q.value = 0.7;
      const buzz = ctx.createOscillator();
      buzz.type = 'sawtooth'; buzz.frequency.value = 100;
      const buzzGain = ctx.createGain(); buzzGain.gain.value = 0.55;
      buzz.connect(buzzGain).connect(lp).connect(master);

      const low = ctx.createOscillator();
      low.type = 'sine'; low.frequency.value = 50;
      const lowGain = ctx.createGain(); lowGain.gain.value = 0.5;
      low.connect(lowGain).connect(master);

      const h2 = ctx.createOscillator();
      h2.type = 'sine'; h2.frequency.value = 200.4;
      const h2Gain = ctx.createGain(); h2Gain.gain.value = 0.16;
      h2.connect(h2Gain).connect(master);

      // hohes Pfeifen des Vorschaltgeraets
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf; noise.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 7600; bp.Q.value = 14;
      const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.05;
      noise.connect(bp).connect(noiseGain).connect(master);

      // langsames Schwanken
      const wob = ctx.createOscillator();
      wob.frequency.value = 0.23;
      const wobGain = ctx.createGain(); wobGain.gain.value = 0.12;
      wob.connect(wobGain).connect(buzzGain.gain);

      [buzz, low, h2, noise, wob].forEach((n) => n.start());
      this.ctx = ctx;
      this.master = master;
      this.clickBuf = buf;
      this.applyGain(1.5);
    } catch (err) {
      this.ctx = null;
    }
  }

  applyGain(seconds) {
    if (!this.ctx) return;
    const target = this.silenced ? 0 : lerpTable(HUM, Math.min(this.depth, 5));
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(target, now, seconds / 3);
  }

  setDepth(v) {
    const before = this.depth;
    this.depth = v;
    if (v >= 5.97) {
      if (!this.silenced) {
        // schlagartig still
        this.silenced = true;
        if (this.ctx) {
          const now = this.ctx.currentTime;
          this.master.gain.cancelScheduledValues(now);
          this.master.gain.setValueAtTime(0, now);
        }
      }
      return;
    }
    if (this.silenced && v < 5.5) this.silenced = false;
    if (Math.abs(before - v) > 0.01) this.applyGain(2.5);
  }

  click() {
    if (!this.ctx || this.silenced) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.clickBuf;
    const g = this.ctx.createGain();
    g.gain.value = 0.02 + 0.03 * Math.min(1, this.depth / 5);
    src.connect(g).connect(this.ctx.destination);
    src.start(0, Math.random(), 0.018);
  }

  flicker(kind) {
    if (reduceMotion || !this.flickerEl) return;
    const el = this.flickerEl;
    el.classList.remove('on', 'dim');
    void el.offsetWidth;
    el.classList.add(kind);
    this.click();
    if (this.ctx && !this.silenced) {
      const now = this.ctx.currentTime;
      const g = this.master.gain;
      const base = lerpTable(HUM, Math.min(this.depth, 5));
      g.cancelScheduledValues(now);
      g.setValueAtTime(base * 0.2, now);
      g.setValueAtTime(base, now + 0.08);
      g.setValueAtTime(base * 0.35, now + 0.13);
      g.setTargetAtTime(base, now + 0.2, 0.1);
    }
  }

  tick(now) {
    // Flackern
    const every = lerpTable(FLICKER_EVERY, Math.min(this.depth, 5));
    if (every > 0 && this.depth < 5.97 && !document.hidden) {
      if (now > this.nextFlicker) {
        this.flicker(this.depth > 4.4 && Math.random() < 0.35 ? 'dim' : 'on');
        this.nextFlicker = now + every * 1000 * (0.5 + Math.random());
      }
    } else {
      this.nextFlicker = Math.max(this.nextFlicker, now + 8000);
    }

    // der andere Mauszeiger: spiegelt deine Bewegungen, mit Verzoegerung
    const el = this.cursorEl;
    if (el && finePointer && !reduceMotion) {
      const active = this.depth >= 3 && this.depth < 5.97 && this.mouseInside && now > this.cursorGoneUntil;
      if (active && this.trail.length) {
        const t = now - 1400;
        let p = this.trail[0];
        for (let i = this.trail.length - 1; i >= 0; i--) { if (this.trail[i].t <= t) { p = this.trail[i]; break; } }
        const x = Math.min(window.innerWidth - 22, Math.max(4, window.innerWidth - p.x));
        const y = p.y;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.classList.add('on');
        el.classList.remove('gone');
        const dx = this.lastMouse.x - x, dy = this.lastMouse.y - y;
        if (dx * dx + dy * dy < 70 * 70) {
          // nicht anfassen
          el.classList.add('gone');
          el.classList.remove('on');
          this.cursorGoneUntil = now + 9000;
        }
      } else {
        el.classList.remove('on');
      }
    }
    requestAnimationFrame(this.tick);
  }
}
