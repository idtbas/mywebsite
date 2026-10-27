/*
 * Abbildungen je Kopie: rendern (Worker), dann per JPEG-Generationsverlust
 * "weitersagen". Jede Kopie ist eine Kopie der Kopie.
 */

const POSE = {
  a1: { x: 4.5, y: 28, angle: -55, pitch: 15 },
  a2: { x: 31.5, y: 38, angle: -90, pitch: 0 },
};

// Wo die Gestalt in welcher Kopie steht (null = nicht da)
const FIGURE = {
  a1: [null, null, { x: 7.3, y: 14.3 }, { x: 7.2, y: 24.6 }, { x: 6.6, y: 25.3 }, { x: 5.9, y: 26.2 }],
  a2: [{ x: 31.55, y: 9.2 }, { x: 31.55, y: 9.2 }, { x: 31.5, y: 14 }, { x: 31.5, y: 20 }, { x: 31.5, y: 27 }, { x: 31.5, y: 33 }],
};

// Anzahl der JPEG-Durchgaenge je Kopie
const LOSS = [0, 2, 5, 9, 15, 22];

let worker = null;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (worker !== null) return worker;
  try {
    worker = new Worker(new URL('./render-worker.js', import.meta.url));
    worker.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      p.resolve(e.data);
    };
    worker.onerror = () => {
      // Fallback: alles Weitere im Hauptthread
      const waiting = [...pending.values()];
      pending.clear();
      worker = false;
      waiting.forEach((p) => p.resolve(window.BR_RENDER.render(p.opts)));
    };
  } catch (err) {
    worker = false;
  }
  return worker;
}

function renderRaw(opts) {
  const w = getWorker();
  if (!w) {
    return new Promise((resolve) => setTimeout(() => resolve(window.BR_RENDER.render(opts)), 0));
  }
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, { resolve, opts });
    w.postMessage({ id, opts });
  });
}

function toBlob(canvas, q) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
}

function decode(blob) {
  if (window.createImageBitmap) return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

function spec(variant) {
  const [key, g] = variant.split(':');
  const base = { w: 720, h: 480, fov: 74, z: 1.55, exposure: 1.35 };
  if (key === 'a2' && g === 'final') return { ...base, ...POSE.a2, seed: 61, figure: null, gen: 0 };
  if (key === 'a2' && g === 'zoom') return { ...base, ...POSE.a2, w: 1080, h: 720, seed: 7, figure: { x: 31.55, y: 10.4 }, gen: 0 };
  const gen = Number(g);
  const fig = FIGURE[key][gen] && { ...FIGURE[key][gen], blur: [0, 0, 0, 0.01, 0.03, 0.05][gen] };
  return { ...base, ...POSE[key], seed: 11 + gen * 17 + (key === 'a2' ? 5 : 0), figure: fig, gen };
}

async function degrade(canvas, gen, seed) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  let blob = await toBlob(canvas, 0.86);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const small = document.createElement('canvas');
  for (let i = 0; i < LOSS[gen]; i++) {
    const bmp = await decode(blob);
    ctx.save();
    ctx.fillStyle = '#c4ae5c';
    ctx.fillRect(0, 0, w, h);
    if (i % 4 === 3) {
      // Aufloesung geht verloren
      const f = 0.55 + rnd() * 0.25;
      small.width = Math.round(w * f); small.height = Math.round(h * f);
      small.getContext('2d').drawImage(bmp, 0, 0, small.width, small.height);
      ctx.drawImage(small, 0, 0, w, h);
    } else {
      const zoom = 1.004 + rnd() * 0.004;
      ctx.translate(w / 2 + (rnd() - 0.5) * 1.6, h / 2 + (rnd() - 0.5) * 1.6);
      ctx.scale(zoom, zoom);
      ctx.drawImage(bmp, -w / 2, -h / 2, w, h);
    }
    ctx.restore();
    // jede Kopie vergilbt ein wenig
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255, 236, 160, 0.07)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(46, 38, 12, 0.05)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    if (bmp.close) bmp.close();
    blob = await toBlob(canvas, Math.max(0.16, 0.6 - gen * 0.08));
  }
  return blob;
}

const cache = new Map();

export function getImage(variant) {
  if (cache.has(variant)) return cache.get(variant);
  const job = (async () => {
    const sp = spec(variant);
    const raw = await renderRaw(sp);
    const canvas = document.createElement('canvas');
    canvas.width = raw.w; canvas.height = raw.h;
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(raw.data.buffer || raw.data), raw.w, raw.h), 0, 0);
    const blob = sp.gen > 0 ? await degrade(canvas, sp.gen, sp.seed * 7919) : await toBlob(canvas, 0.86);
    return URL.createObjectURL(blob);
  })();
  cache.set(variant, job);
  return job;
}
