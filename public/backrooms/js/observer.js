/*
 * Beobachtung.
 * Die Seite fuehrt Protokoll ueber ihren Besucher und benutzt es.
 * Alles bleibt im Browser (localStorage). Es wird nichts gesendet.
 */

const two = (n) => String(n).padStart(2, '0');
export const hm = (d) => `${two(d.getHours())}:${two(d.getMinutes())}`;
export const hms = (d) => `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;

export class Observer {
  constructor(store) {
    this.store = store;
    this.log = [];
    this.facts = {};
    this.listeners = [];
    try { this.prev = JSON.parse(store.get('br_obs') || '{}') || {}; } catch (e) { this.prev = {}; }
  }

  add(kind, text, data = {}) {
    const e = { t: new Date(), kind, text, data };
    this.log.push(e);
    (this.facts[kind] || (this.facts[kind] = [])).push(e);
    this.listeners.forEach((fn) => fn(e));
    return e;
  }

  has(kind) { return !!(this.facts[kind] && this.facts[kind].length); }
  all(kind) { return this.facts[kind] || []; }
  last(kind) { const a = this.facts[kind]; return a ? a[a.length - 1] : null; }
  on(fn) { this.listeners.push(fn); }

  save(maxGen) {
    const lines = this.log.slice(-6).map((e) => `${hms(e.t)}  ${e.text}`);
    this.store.set('br_obs', JSON.stringify({
      maxGen: Math.max(maxGen, this.prev.maxGen || 0),
      lines,
      exits: (this.prev.exits || 0) + this.all('exit').length,
    }));
  }
}

/*
 * Saetze, die in neue Kopien geschrieben werden. Jeder Satz braucht etwas,
 * das wirklich passiert ist. ctx: { obs, gen, name, touch, night, battery,
 * dark, visits, prevMax, mins, origSeconds }
 */
const TEMPLATES = [
  ['origTime', (c) => c.origSeconds > 0 && c.origSeconds < 240 &&
    `Du hast das Original in ${c.origSeconds} Sekunden gelesen. Die Lesezeit war mit 9 Minuten angegeben. Du hast nicht gelesen. Du hast gesucht.`],
  ['skim', (c) => { const e = c.obs.last('skim'); return e && `Kopie ${e.data.g} hast du in ${e.data.s < 2 ? 'nicht einmal zwei' : e.data.s} Sekunden durchgescrollt. Du suchst nicht mehr nach Informationen. Du suchst nach dem Ende.`; }],
  ['read2', (c) => {
    const r = c.obs.all('read');
    if (r.length < 2) return null;
    const long = r.reduce((a, b) => (b.data.s > a.data.s ? b : a));
    const short = r.reduce((a, b) => (b.data.s < a.data.s ? b : a));
    if (long === short) return null;
    return `Beim Abschnitt „${long.data.title}“ bist du ${long.data.s} Sekunden geblieben. Bei „${short.data.title}“ nur ${short.data.s}. Du liest schneller, wenn es unangenehm wird.`;
  }],
  ['tab', (c) => { const e = c.obs.last('tab'); return e && `Vorhin warst du ${e.data.s} Sekunden lang woanders. Die Seite war die ganze Zeit hier. Sie hat gewartet.`; }],
  ['copy', (c) => { const e = c.obs.last('copy'); return e && `Du hast „${e.data.x}“ kopiert. Füg es irgendwo ein und lies es noch einmal. Es ist nicht mehr dasselbe.`; }],
  ['comment', (c) => { const e = c.obs.last('comment'); return e && `Du hast geschrieben: „${e.data.x}“. Es wurde weitergegeben. Jemand hier unten hat es gelesen.`; }],
  ['look', (c) => { const e = c.obs.last('look'); return e && `Du hast dir eine Abbildung ${e.data.s} Sekunden lang angesehen. Das ist lange. Es hat so lange zurückgesehen.`; }],
  ['still', (c) => c.obs.has('still') && 'Vorhin hast du dich eine ganze Weile nicht bewegt. Das war klug. Es sieht nur, was sich bewegt.'],
  ['resize', (c) => c.obs.has('resize') && 'Du hast das Fenster verändert. Die Räume ändern sich nicht mit.'],
  ['stare', (c) => { const e = c.obs.last('stare'); return e && `Du hast auf das Wort „${e.data.w}“ gestarrt, bis es nicht mehr da war. Wörter halten das hier unten nicht aus.`; }],
  ['exit', (c) => { const e = c.obs.last('exit'); return e && `Um ${hms(e.t)} wolltest du gehen. Dein Mauszeiger war schon ganz oben. Du bist geblieben.`; }],
  ['ghost', (c) => c.obs.has('ghost') && 'Du hast versucht, den anderen Mauszeiger zu berühren. Er gehört niemandem, den du kennst.'],
  ['reload', (c) => c.obs.has('reload') && 'Du hast die Seite neu geladen. Neu laden hilft nicht. Es lädt nur dich neu.'],
  ['return', (c) => c.visits > 1 && c.prevMax > 0 && `Das ist dein ${c.visits}. Besuch. Letztes Mal bist du bis Kopie ${c.prevMax} gekommen. Diesmal ist es kürzer bis hierher. Ist dir das aufgefallen?`],
  ['find', (c) => c.obs.has('find') && 'Du hast auf der Seite nach etwas gesucht. Was auch immer es war: Hier unten findest du nur, was dich zuerst gefunden hat.'],
  ['devtools', (c) => c.obs.has('devtools') && 'Du hast im Quelltext nach einer Erklärung gesucht. Da ist keine. Da sind nur Kommentare von jemandem, der nicht mehr antwortet.'],
  ['battery', (c) => c.battery && !(c.battery.charging && c.battery.level === 100) && (c.battery.charging
    ? `Dein Akku lädt gerade (${c.battery.level} %). Du hast vor, länger zu bleiben.`
    : `Dein Akku hat noch ${c.battery.level} %. Das reicht nicht bis zum Ausgang.`)],
  ['dark', (c) => c.dark && 'Dein Gerät ist auf den dunklen Modus eingestellt. Hier gibt es keinen dunklen Modus. Das Licht bleibt an.'],
  ['bed', (c) => c.touch && c.night && 'Du liest das auf dem Handy. Wahrscheinlich im Bett. Das Display ist gerade das einzige Licht in deinem Zimmer, oder?'],
  ['night', (c) => c.night && `Es ist ${hm(new Date())}. Fast alle, die so weit kommen, lesen das nachts. Allein. Die anderen im Haus schlafen schon.`],
  ['day', (c) => !c.night && `Es ist ${hm(new Date())}. Draußen ist es hell. Hier unten ist es immer gleich hell. Niemand hat die Lichter je ausgeschaltet.`],
  ['hold', (c) => c.obs.has('hold') && 'Dein Daumen hat vorhin lange auf dem Bildschirm gelegen. Es war warm.'],
  ['mins', (c) => `Du bist jetzt seit ${c.mins === 1 ? 'einer Minute' : c.mins + ' Minuten'} hier. Niemand außer dir weiß, wo du gerade bist.`],
];

export function observations(ctx, used, count) {
  const out = [];
  for (const [id, fn] of TEMPLATES) {
    if (out.length >= count) break;
    if (used.has(id)) continue;
    let text = null;
    try { text = fn(ctx); } catch (e) { text = null; }
    if (!text) continue;
    used.add(id);
    out.push(text);
  }
  return out;
}

/* Saetze, die jemand anderes in die Seite tippt */
export function typedLine(ctx, used) {
  const pool = [
    ctx.name && `${ctx.name.toLowerCase()}?`,
    ctx.obs.has('skim') && 'warum scrollst du so schnell',
    ctx.obs.has('tab') && 'du warst eben weg. ich habe gewartet.',
    ctx.obs.has('copy') && 'ich habe gesehen, was du kopiert hast.',
    ctx.obs.has('exit') && 'du wolltest gehen. ich weiß.',
    'du liest gerade diesen absatz.',
    ctx.touch ? 'ich sehe, wo dein daumen ist.' : 'ich kann deinen mauszeiger sehen.',
    `es ist ${hm(new Date())} bei dir.`,
    'nicht so schnell.',
    'bist du allein?',
    'lies weiter. ich lese mit.',
    'hier unten ist noch platz.',
    'du musst dich nicht umdrehen.',
  ].filter(Boolean);
  const fresh = pool.filter((l) => !used.has(l));
  const line = (fresh.length ? fresh : pool)[0];
  used.add(line);
  return line;
}

/* Tippt Text in ein Element, mit sichtbarem Cursor und Namensfahne */
export function remoteType(host, text, name, onState) {
  return new Promise((resolve) => {
    const wrap = document.createElement('span');
    wrap.className = 'remote';
    const typed = document.createElement('span');
    const caret = document.createElement('span');
    caret.className = 'remote-caret';
    caret.dataset.name = name;
    wrap.append(' ', typed, caret);
    host.appendChild(wrap);
    onState(true);
    let i = 0;
    let wrong = false;
    const step = () => {
      if (wrong) {
        typed.textContent = typed.textContent.slice(0, -1);
        wrong = false;
        return setTimeout(step, 260 + Math.random() * 200);
      }
      if (i >= text.length) {
        setTimeout(() => { caret.remove(); onState(false); resolve(wrap); }, 2600);
        return;
      }
      if (i > 2 && Math.random() < 0.05) {
        typed.textContent += 'abcdefghijklmnoprstu'[Math.floor(Math.random() * 20)];
        wrong = true;
        return setTimeout(step, 320);
      }
      typed.textContent += text[i++];
      const ch = text[i - 1];
      const pause = ch === ' ' ? 140 : ch === '.' || ch === '?' ? 700 : 70;
      setTimeout(step, pause + Math.random() * 110 + (Math.random() < 0.06 ? 900 : 0));
    };
    setTimeout(step, 1100);
  });
}
