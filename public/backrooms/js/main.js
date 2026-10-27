/*
 * Referat "Die Backrooms".
 * Unter dem Fussbereich liegt nicht das Ende der Seite, sondern ihre naechste Kopie.
 * Jede Kopie entsteht aus der vorigen (Stille Post): Texte, Bilder, Tabelle,
 * Diagramm, Kommentare. Kopie 6 ist der "Ausgang".
 */
import { VARIANTS, corrupt, mishear, mutateWord, mulberry32, SUBTLE, ordinal } from './drift.js';
import { getImage } from './images.js';
import { Ambience } from './ambience.js';

const FINAL = 6;
const GAP_VH = [130, 140, 160, 190, 230, 340];
const GAP_WHISPER = { 3: 'du bist nicht der erste hier', 4: 'es ist nicht mehr weit', 5: 'fast' };
const BG = ['#ffffff', '#fffefb', '#fcf9ee', '#f2e9c4', '#e4d592', '#d9c77c', '#ffffff'];
const TITLES = [
  'Die Backrooms – Referat | Lena Hoffmann',
  'Die Backrooms – Referat | Lena Hoffmann',
  'Die Backrooms – Referat | Lena Hofmann',
  'Die Backrooms – Referat',
  'Die Backrooms',
  'Level 0',
  'Die Backrooms – Referat | Lena Hoffmann',
];
const TITLE_DECAY = [
  'Die Backrooms – Referat | Lena Hoffmann',
  'Die Backrooms – Referat | Lena Hofmann',
  'Die Backroom – Referat | Lena Hofmann',
  'Die Backroom – Refe rat | Lena',
  'Die Back – rooms',
];
const HASHES = ['', '#kopie', '#kopie-von-kopie', '#kopie-von-kopie-von-kopie', '#kopie-von-kopie-von-kopie-von-kopie', '#level-0', ''];
const CONSOLE = {
  1: '[referat] Seite wurde doppelt geladen?',
  2: '[referat] Kopie von Kopie erstellt.',
  3: '[referat] Original nicht mehr verfügbar.',
  4: '[referat] wer liest das hier',
  5: '[referat] du',
  6: '[referat] Abschnitte geladen: 8 von 8',
};
const FAVICON = {
  normal: 'favicon.svg',
  yellow: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="6" fill="#cdb866"/></svg>'),
  empty: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"></svg>'),
};
const NOTES = {
  1: [{ at: 'hero', text: 'doppelt hochgeladen? bitte prüfen – M.B.', r: -4 }],
  2: [{ at: 1, text: 'Lena, das hast du doch schon abgegeben?', r: -3 }, { at: 6, text: 'Abschnitt 6 fehlt!', r: 2 }],
  3: [{ at: 'hero', text: 'Lena, bitte melde dich bei mir. – M.B.', r: -2 }, { at: 5, text: 'wer hat das hochgeladen??', r: 3 }, { at: 6, text: '?', r: -6 }],
  4: [{ at: 'hero', text: 'Ist hier noch jemand?', r: -3 }, { at: 7, text: '– M. Brandt', r: 1, strike: true }],
  5: [{ at: 6, text: 'hier', r: -2 }],
};
const IMPRESSUM = {
  0: 'Lena Hoffmann<br>Studierende der Medienwissenschaft<br>Kontakt: über das Seminar-Forum',
  2: 'Lena Hofmann<br>Studierende der Medienwissenschaft<br>Kontakt: über das Seminar-Forum',
  3: 'Lena Hoffmann (nicht erreichbar)<br>Studierende der Medienwissenschaft<br>Kontakt: –',
  4: 'Verantwortlich für den Inhalt:<br><span data-live="name-du">du</span>',
  5: '',
};
const DESC0 = 'Endlose gelbe Büroräume, feuchter Teppich, summende Neonröhren';

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { /* privat */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* privat */ } },
};
const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 1500 }) : (fn) => setTimeout(fn, 200);

/* ----------------------------------------------------------------- Zustand */

if (new URLSearchParams(location.search).has('reset')) {
  ['br_visits', 'br_deep', 'br_name', 'br_last'].forEach(store.del);
  history.replaceState(null, '', location.pathname);
}
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (/^#(kopie|level-0)/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);

const seed = (Math.random() * 2 ** 31) | 0;
const rnd = mulberry32(seed);
const opened = new Date();
const lastVisit = parseInt(store.get('br_last') || '0', 10) || 0;
const state = {
  opened,
  visits: (parseInt(store.get('br_visits') || '0', 10) || 0) + 1,
  deep: store.get('br_deep') === '1',
  name: store.get('br_name') || '',
  comments: [],
  copies: [],
  gaps: [],
  view: 0,
  viewGen: -1,
  seenGen: 0,
  returned: false,
  finalSeen: false,
  edited: lastVisit && store.get('br_deep') === '1' ? new Date(lastVisit) : new Date(opened - 3 * 60000),
  nextEdit: opened.getTime() + (4 + Math.random() * 3) * 60000,
  subtleUsed: new Set(),
  titleStep: 0,
};
store.set('br_visits', state.visits);
const saveLast = () => store.set('br_last', Date.now());
setInterval(saveLast, 15000);
window.addEventListener('pagehide', saveLast);

const amb = new Ambience();

/* ----------------------------------------------------------------- Hilfen */

const two = (n) => String(n).padStart(2, '0');
const pad = (n) => String(n).padStart(7, '0');
const hhmm = (d) => `${two(d.getHours())}:${two(d.getMinutes())}`;
const dmy = (d) => `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function dayLabel(d) {
  const t = new Date();
  if (d.toDateString() === t.toDateString()) return 'heute';
  const y = new Date(t); y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'gestern';
  return dmy(d);
}

function genOf(node) {
  const el = node && (node.nodeType === 1 ? node : node.parentElement);
  const c = el && el.closest('.copy');
  return c ? Number(c.dataset.gen) : -1;
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function textNodes(root) {
  const out = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) out.push(w.currentNode);
  return out;
}

function replaceInText(el, from, to) {
  for (const t of textNodes(el)) {
    if (t.nodeValue.includes(from)) { t.nodeValue = t.nodeValue.replace(from, to); return true; }
  }
  return false;
}

/* ------------------------------------------------------------ Live-Werte */

function liveValue(kind, gen) {
  const t = new Date();
  const mins = Math.max(1, Math.floor((t - state.opened) / 60000));
  switch (kind) {
    case 'min-n': return String(mins);
    case 'mins': return mins === 1 ? 'einer Minute' : `${mins} Minuten`;
    case 'name-dir': return state.name || 'dir';
    case 'name-du': return state.name || 'du';
    case 'edited':
      if (gen === 0 || gen < 0) return state.returned ? 'gerade eben' : `${dayLabel(state.edited)}, ${hhmm(state.edited)}`;
      if (gen === 1) return `heute, ${hhmm(t)}`;
      if (gen === 2) return 'gerade eben';
      if (gen === 3) return 'wird gerade bearbeitet …';
      if (gen === 4) return `wird gerade bearbeitet von ${state.name || 'dir'}`;
      if (gen === 5) return 'jetzt';
      return '12.05.2019';
    case 'counter':
      if (gen === 0) return state.returned ? '0000000' : pad(state.visits);
      if (gen <= 2) return pad(state.visits);
      if (gen === 3) return '0000001 (du)';
      if (gen === 4) return 'nur du';
      if (gen === 5) return '';
      return '0000000';
    case 'date-12': { const d = new Date(t); d.setDate(d.getDate() - 12); return dmy(d); }
    case 'date+1': {
      if (gen === 3) return 'morgen';
      if (gen === 4 || gen === 5) return 'nie';
      const d = new Date(t); d.setDate(d.getDate() + 1); return dmy(d);
    }
    default: return undefined;
  }
}

function updateLive(root = document) {
  $$('[data-live]', root).forEach((el) => {
    const v = liveValue(el.dataset.live, genOf(el));
    if (v !== undefined && el.textContent !== v) el.textContent = v;
  });
}

/* ------------------------------------------------------- Kopien erzeugen */

const copy0 = document.getElementById('kopie-0');
const ORIGINAL = copy0.cloneNode(true);

function sectionOf(el, n) { return el.querySelector(`section[data-sec="${n}"]`); }

function skeleton(node, lines) {
  const sk = document.createElement('div');
  sk.className = 'skel';
  sk.setAttribute('aria-hidden', 'true');
  const n = lines || Math.max(1, Math.round((node.textContent.length || 60) / 80));
  for (let i = 0; i < n; i++) {
    const b = document.createElement('i');
    b.style.width = (i === n - 1 && n > 1 ? 30 + rnd() * 50 : 90 + rnd() * 10).toFixed(1) + '%';
    sk.appendChild(b);
  }
  if (node.style.transform) sk.style.transform = node.style.transform;
  node.replaceWith(sk);
  return sk;
}

function blankSource(li) {
  li.innerHTML = '<i class="bar"></i>';
  li.querySelector('.bar').style.width = (40 + rnd() * 50).toFixed(0) + '%';
}

function structure(el, gen) {
  const toc = el.querySelector('.toc ol');
  if (gen === 2) {
    const li6 = document.createElement('li');
    li6.dataset.n = '6';
    li6.innerHTML = '<a href="#ausgang"></a>';
    toc.insertBefore(li6, toc.querySelector('li[data-n="7"]'));
    const s6 = document.createElement('section');
    s6.dataset.sec = '6';
    s6.dataset.anchor = 'ausgang';
    s6.innerHTML = '<h2><span class="num">6</span> <span data-k="h6"></span></h2><p data-k="exit1"></p>';
    const s7 = sectionOf(el, 7);
    s7.parentNode.insertBefore(s6, s7);
    const rows = el.querySelectorAll('table.levels tbody tr');
    rows[3].after(rows[0].cloneNode(true));
    const ne = el.querySelector('[data-k="nonEuclid"]');
    ne.after(ne.cloneNode(true));
  }
  if (gen === 3) {
    const li6 = toc.querySelector('li[data-n="6"]');
    if (li6) li6.querySelector('a').textContent = 'Ausgang';
    el.querySelectorAll('table.levels tbody td:first-child').forEach((td) => { td.textContent = '0'; });
    const o4 = el.querySelector('[data-k="origin4"]');
    const cut = o4.cloneNode(true);
    cut.removeAttribute('data-k');
    cut.textContent = o4.textContent.slice(0, Math.floor(o4.textContent.length * 0.42)).trimEnd();
    o4.after(cut);
    const l2 = el.querySelector('[data-k="lim2"]');
    l2.after(l2.cloneNode(true));
  }
  if (gen === 4) {
    el.querySelectorAll('.mainnav a').forEach((a) => { a.textContent = 'Level 0'; a.removeAttribute('data-k'); });
    el.querySelectorAll('.toc li a').forEach((a) => { a.textContent = 'Level 0'; });
    ['lvl1', 'origin2', 'more1'].forEach((k) => el.querySelectorAll(`[data-k="${k}"]`).forEach((n) => skeleton(n)));
    el.querySelectorAll('.sources li').forEach((li) => { if (!/Hoffmann|Hofmann/.test(li.textContent)) blankSource(li); });
    el.querySelectorAll('table.levels tbody tr').forEach((tr, i) => {
      tr.children[1].textContent = '„Die Lobby“';
      tr.children[2].textContent = DESC0.slice(0, Math.max(5, DESC0.length - i * 9));
    });
    const h3 = sectionOf(el, 3).querySelector('h2');
    const s5 = sectionOf(el, 5);
    s5.insertBefore(h3.cloneNode(true), s5.children[1] || null);
  }
  if (gen === 5) {
    const keep = new Set(['intro1', 'exit1', 'ghost1', 'ghost2', 'thanks', 'h6']);
    el.querySelectorAll('.content p, .content blockquote').forEach((n) => { if (!keep.has(n.dataset.k)) skeleton(n); });
    el.querySelectorAll('.sources li').forEach(blankSource);
    el.querySelectorAll('table.levels th, table.levels td, table.levels caption').forEach((c) => { c.textContent = ''; });
    el.querySelectorAll('.topbar span, .kicker').forEach((s) => { s.textContent = ''; });
    const a2 = el.querySelector('figure[data-fig="a2"]');
    if (a2) { a2.querySelector('img').remove(); a2.removeAttribute('data-fig'); a2.querySelector('figcaption').textContent = ''; }
    const ch = el.querySelector('figure[data-fig="chart"] figcaption');
    if (ch) ch.textContent = '';
  }
}

function applyText(el, gen) {
  const r = mulberry32(seed + gen * 7717);
  el.querySelectorAll('[data-k]').forEach((n) => {
    const table = VARIANTS[n.dataset.k];
    if (!table || !(gen in table)) return;
    const v = table[gen].replace(/\{ordinal\}/g, ordinal(gen));
    if (n.tagName === 'IMG') n.alt = v; else n.innerHTML = v;
    n.dataset.authored = String(gen);
  });
  const skip = `[data-authored="${gen}"], [data-live], .note, .comment-form, .comment-list`;
  textNodes(el).forEach((t) => {
    const p = t.parentElement;
    if (!p || !t.nodeValue.trim() || p.closest(skip)) return;
    t.nodeValue = corrupt(t.nodeValue, gen, r);
  });
  el.querySelectorAll('img[alt]').forEach((img) => {
    if (img.dataset.authored !== String(gen)) img.alt = corrupt(img.alt, gen, r);
  });
}

function jitter(el, gen) {
  if (gen < 2) return;
  const amp = [0, 0, 2, 5, 12, 18][gen];
  el.querySelectorAll('.content section > p, .content h2, .content .fig, .content blockquote, .content .table-wrap, .content .skel').forEach((n) => {
    if (rnd() < (gen === 2 ? 0.3 : 0.7)) {
      const x = (rnd() - 0.5) * 2 * amp;
      const rot = gen >= 4 ? (rnd() - 0.5) * 0.8 : 0;
      n.style.transform = `translateX(${x.toFixed(1)}px)` + (rot ? ` rotate(${rot.toFixed(2)}deg)` : '');
    }
    if (gen >= 3 && rnd() < 0.15) n.style.letterSpacing = ((rnd() - 0.3) * 0.04).toFixed(3) + 'em';
  });
}

function addNotes(el, gen) {
  el.querySelectorAll('.note').forEach((n) => n.remove());
  (NOTES[gen] || []).forEach((n) => {
    const span = document.createElement('span');
    span.className = 'note' + (n.strike ? ' strike' : '') + (n.at === 'hero' ? ' hero-note' : '');
    span.style.setProperty('--r', n.r + 'deg');
    span.textContent = n.text;
    if (n.at === 'hero') {
      el.querySelector('.hero .wrap').appendChild(span);
    } else {
      const s = sectionOf(el, n.at);
      if (s) s.insertBefore(span, s.children[1] || null);
    }
  });
}

function commentHTML(c) {
  return `<div class="comment"><p class="who">${esc(c.who)}<span class="when">${esc(c.when)}</span></p><p>${esc(c.text)}</p></div>`;
}

// jede Kopie verhoert die Fassung der vorigen Kopie, nicht das Original
function stillePost(chain, gen) {
  for (let g = chain.length; g <= gen; g++) chain[g] = corrupt(chain[g - 1], g + 1, rnd);
  return chain[gen];
}

function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  return m < 1 ? 'gerade eben' : m === 1 ? 'vor einer Minute' : `vor ${m} Minuten`;
}

function renderComments(el, gen) {
  const list = el.querySelector('.comment-list');
  const count = el.querySelector('[data-live="ccount"]');
  if (!list) return;
  const mine = state.comments.filter((c) => c.gen < gen && gen < FINAL);
  const out = mine.map((c) => ({
    who: gen >= 4 ? (state.name || 'du') : gen >= 2 ? stillePost(c.names, gen - 1) : c.name,
    when: ago(c.at),
    text: gen === 1 ? c.text : stillePost(c.texts, gen),
  }));
  if (gen === 2) out.push({ who: 'Lena H.', when: 'vor 6 Jahren', text: 'weiß jemand, wie man hier wieder rauskommt?' });
  if (gen === 3) {
    out.unshift({ who: state.name || 'du', when: 'gerade eben', text: `ich habe diese seite um ${hhmm(state.opened)} uhr geöffnet. ich bin immer noch hier.` });
    out.push({ who: 'Lena H.', when: 'vor 6 Jahren', text: 'hier unten ist es auch gelb' });
  }
  if (gen === 4) {
    ['hier auch', 'hier auch', 'hier auch', 'hier nicht', 'hier auch', 'hört ihr das summen', 'hier auch', 'hier auch', 'hier auch']
      .forEach((t) => out.push({ who: 'Lena H.', when: 'gerade eben', text: t }));
    if (!mine.length) out.push({ who: state.name || 'du', when: 'gerade eben', text: 'hallo?' });
  }
  if (gen === 5) out.splice(0, out.length, { who: state.name || 'du', when: 'jetzt', text: '' });
  list.innerHTML = out.length ? out.map(commentHTML).join('') : '<p class="empty">Noch keine Kommentare. Schreib den ersten!</p>';
  if (count) count.textContent = `(${out.length})`;
}

function setImages(el, gen) {
  el.querySelectorAll('figure[data-fig]').forEach((f) => {
    const key = f.dataset.fig;
    const img = f.querySelector('img');
    if (key === 'chart' || !img) return;
    const variant = gen === FINAL ? (key === 'a2' ? 'a2:final' : 'a1:0') : `${gen === 3 && key === 'a2' ? 'a1' : key}:${gen}`;
    f.dataset.variant = variant;
    getImage(variant).then((url) => { if (f.dataset.variant === variant) img.src = url; });
  });
}

function prefetch(gen) {
  if (gen > FINAL) return;
  if (gen === FINAL) { getImage('a2:final'); return; }
  getImage(`a1:${gen}`);
  if (gen !== 3 && gen !== 5) getImage(`a2:${gen}`);
}

function chart(el, gen) {
  const svg = el.querySelector('.chart-svg');
  if (!svg) return;
  const line = svg.querySelector('.line');
  const xl = svg.querySelectorAll('.xlab text');
  if (gen === 2 && line) {
    line.setAttribute('points', line.getAttribute('points') + ' 620,150 640,96 662,30 690,-40 720,-130');
    xl[7].textContent = '2026';
  }
  if (gen === 3 && line) {
    const pts = [];
    for (let x = 68; x <= 620; x += 20.5) {
      const t = Math.min(1, (x - 68) / 360);
      const y = 40 + 180 * (t * t * (3 - 2 * t)) + (rnd() - 0.5) * 6 * (1 - t);
      pts.push(`${x.toFixed(0)},${Math.min(220, y).toFixed(0)}`);
    }
    line.setAttribute('points', pts.join(' '));
    xl[7].textContent = 'heute';
  }
  if (gen === 4) {
    if (line) line.remove();
    xl.forEach((t) => { t.textContent = 'heute'; });
    svg.querySelectorAll('.ylab text').forEach((t) => { t.textContent = '?'; });
  }
  if (gen === 5) svg.querySelectorAll('text').forEach((t) => { t.textContent = ''; });
}

function finalize(el) {
  // der Ausgang: das Original, unberuehrt. Fast.
  const g1 = el.querySelector('[data-k="ghost1"]');
  if (g1) g1.textContent = 'danke. jetzt bist du dran.';
}

function buildCopy(gen) {
  const el = (gen === FINAL ? ORIGINAL : state.copies[gen - 1]).cloneNode(true);
  el.dataset.gen = String(gen);
  el.removeAttribute('id');
  el.querySelectorAll('[id]').forEach((n) => { n.dataset.anchor = n.id; n.removeAttribute('id'); });
  el.querySelectorAll('.form-msg').forEach((m) => { m.textContent = ''; });
  if (gen === FINAL) {
    finalize(el);
  } else {
    structure(el, gen);
    applyText(el, gen);
    jitter(el, gen);
  }
  addNotes(el, gen);
  renderComments(el, gen);
  setImages(el, gen);
  chart(el, gen);
  return el;
}

function makeGap(from) {
  const g = document.querySelector(`.noclip[data-from="${from}"]`) || document.createElement('div');
  g.className = 'noclip';
  g.dataset.from = String(from);
  g.setAttribute('aria-hidden', 'true');
  g.style.height = GAP_VH[from] + 'vh';
  g.style.setProperty('--from', BG[from]);
  g.style.setProperty('--to', BG[from + 1]);
  if (GAP_WHISPER[from] && !g.querySelector('.whisper')) {
    const w = document.createElement('span');
    w.className = 'whisper';
    w.textContent = GAP_WHISPER[from];
    w.style.top = (35 + rnd() * 40).toFixed(1) + '%';
    w.style.left = (8 + rnd() * 55).toFixed(1) + '%';
    g.appendChild(w);
  }
  return g;
}

function buildNext() {
  const gen = state.copies.length;
  if (gen > FINAL) return null;
  const el = buildCopy(gen);
  const world = document.getElementById('world');
  world.appendChild(el);
  state.copies.push(el);
  if (gen < FINAL) {
    const gap = makeGap(gen);
    world.appendChild(gap);
    state.gaps.push(gap);
  }
  updateLive(el);
  idle(() => prefetch(gen + 1));
  return el;
}

/* ---------------------------------------------------------- Das Original */

function mutateOriginal() {
  state.returned = true;
  const set = (k, html) => { const n = copy0.querySelector(`[data-k="${k}"]`); if (n) n.innerHTML = html; };
  set('subtitle', VARIANTS.subtitle[2]);
  set('intro1', VARIANTS.intro1[1]);
  set('ghost1', 'du bist zurück. aber das hier ist nicht der anfang.');
  set('ghost2', 'du warst schon unten.');
  set('micro', 'Diese Seite ist eine Kopie.');
  updateLive(copy0);
}

/* ------------------------------------------------------ Scrollen & Tiefe */

function titleFor(g) {
  if (g === 0) return state.returned ? TITLES[0] + ' (Kopie)' : TITLE_DECAY[state.titleStep];
  return TITLES[g] || TITLES[0];
}

function setView(v) {
  state.view = v;
  amb.setDepth(state.finalSeen && v >= 5.6 ? 6 : v);
  const g = Math.min(FINAL, Math.floor(v + 1e-4));
  if (g === state.viewGen) return;
  state.viewGen = g;
  document.title = titleFor(g);
  try { history.replaceState(null, '', location.pathname + location.search + HASHES[g]); } catch (e) { /* egal */ }
  const fav = document.getElementById('favicon');
  if (fav) fav.href = g >= 5 && g < FINAL ? FAVICON.empty : g >= 3 && g < FINAL ? FAVICON.yellow : FAVICON.normal;
  document.documentElement.style.backgroundColor = BG[g];
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = BG[g];
  if (g > state.seenGen) {
    state.seenGen = g;
    if (CONSOLE[g]) console.info(CONSOLE[g]);
  }
}

function reachFinal() {
  state.finalSeen = true;
  mutateOriginal();
  store.set('br_deep', '1');
}

function scrollspy(g) {
  const el = state.copies[g];
  if (!el) return;
  const toc = el.querySelector('.toc');
  if (!toc || toc.offsetParent === null) return;
  let cur = null;
  el.querySelectorAll('.content section[data-sec]').forEach((s) => {
    if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s.dataset.sec;
  });
  const stuck = g >= 3 && g < FINAL;
  toc.querySelectorAll('li').forEach((li) => li.classList.toggle('active', stuck ? li.dataset.n === '6' : li.dataset.n === cur));
}

function frame() {
  const docH = document.documentElement.scrollHeight;
  if (state.copies.length <= FINAL && scrollY + innerHeight > docH - innerHeight * 1.6) buildNext();
  const mid = innerHeight * 0.5;
  let view = 0;
  for (let g = 0; g < state.copies.length; g++) {
    const r = state.copies[g].getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { view = g; break; }
    const gap = state.gaps[g];
    if (gap) {
      const gr = gap.getBoundingClientRect();
      if (gr.top <= mid && gr.bottom > mid) { view = g + (mid - gr.top) / gr.height; break; }
    }
    if (r.top > mid) { view = g; break; }
  }
  setView(view);
  const fin = state.copies[FINAL];
  if (fin && !state.finalSeen && fin.getBoundingClientRect().top < innerHeight * 0.75) reachFinal();
  scrollspy(Math.floor(view));
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; frame(); });
}

/* ------------------------------------------------------------ Navigation */

function jumpTo(copy, id, behavior) {
  let t = copy;
  if (id && id !== 'kopie-0') {
    const sel = CSS.escape(id);
    t = copy.querySelector(`#${sel}, [data-anchor="${sel}"]`) || copy;
  }
  const y = t === copy ? copy.getBoundingClientRect().top + scrollY : t.getBoundingClientRect().top + scrollY - 16;
  window.scrollTo({ top: Math.max(0, y), behavior });
}

function openImpressum(gen) {
  const m = document.getElementById('impressum');
  const body = m.querySelector('.imp-body');
  const html = gen in IMPRESSUM ? IMPRESSUM[gen] : IMPRESSUM[0];
  body.innerHTML = gen === FINAL ? IMPRESSUM[0] : html;
  m.querySelector('.imp-note').style.display = gen >= 4 && gen < FINAL ? 'none' : '';
  m.querySelector('.modal-close').textContent = gen === 5 ? 'Hierbleiben' : 'Schließen';
  updateLive(m);
  m.hidden = false;
  m.querySelector('.modal-close').focus();
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const copy = a.closest('.copy');
  if (!copy) return;
  const g = Number(copy.dataset.gen);
  if (a.classList.contains('impressum-link')) { e.preventDefault(); openImpressum(g); return; }
  const href = a.getAttribute('href');
  if (href && !href.startsWith('#')) return;
  e.preventDefault();
  const id = href ? href.slice(1) : '';
  const up = a.classList.contains('up-link');
  if (g === FINAL && up) { window.scrollTo({ top: 0, behavior: 'auto' }); return; }
  if (g === 0 || g === 1 || g === FINAL || (g === 2 && !up)) {
    jumpTo(copy, id, g === 0 || g === FINAL ? 'smooth' : 'auto');
    return;
  }
  // alle Wege fuehren tiefer hinein
  if (g >= 5) {
    while (state.copies.length <= FINAL) buildNext();
    jumpTo(state.copies[FINAL], '', 'auto');
    return;
  }
  const next = state.copies[g + 1] || buildNext();
  jumpTo(next, up ? '' : id, 'auto');
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.modal-close') || e.target.classList.contains('modal')) {
    document.getElementById('impressum').hidden = true;
  }
});

/* ------------------------------------------------------------- Lightbox */

const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
let lbTimer = 0;

function closeLightbox() { lb.hidden = true; clearTimeout(lbTimer); }

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.fig-btn');
  if (!btn) return;
  const fig = btn.closest('figure');
  const img = btn.querySelector('img');
  if (!img) return;
  const gen = genOf(fig);
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lb.querySelector('figcaption').innerHTML = fig.querySelector('figcaption').innerHTML;
  lb.hidden = false;
  clearTimeout(lbTimer);
  const variant = fig.dataset.variant || '';
  if (gen === 0 && variant === 'a2:0') {
    // in gross sieht man mehr. und es ist naeher.
    const job = getImage('a2:zoom');
    lbTimer = setTimeout(() => job.then((u) => { if (!lb.hidden) lbImg.src = u; }), 2600);
  } else if (gen >= 2 && gen < 5) {
    const [key] = variant.split(':');
    const job = getImage(`${key}:${gen + 1}`);
    lbTimer = setTimeout(() => job.then((u) => { if (!lb.hidden) lbImg.src = u; }), 3800);
  }
});
lb.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  closeLightbox();
  document.getElementById('impressum').hidden = true;
});

/* ------------------------------------------------------------ Kommentare */

const FORM_MSG = [
  'Danke! Dein Kommentar wird nach Prüfung freigeschaltet.',
  'Danke! Dein Kommentar wird nach Prüfung freigeschaltet.',
  'Danke! Dein Kommentar wird weitergegeben.',
  'Danke. Wir geben es weiter.',
  'es wurde weitergegeben',
  'danke',
  'Danke! Dein Kommentar wird nach Prüfung freigeschaltet.',
];

document.addEventListener('submit', (e) => {
  const form = e.target.closest('.comment-form');
  if (!form) return;
  e.preventDefault();
  const gen = genOf(form);
  const name = form.elements.name.value.trim();
  const text = form.elements.text.value.trim();
  if (!text) return;
  if (name) {
    state.name = name.slice(0, 40);
    store.set('br_name', state.name);
    updateLive();
  }
  state.comments.push({ name: name || 'Gast', text, at: Date.now(), gen, names: [name || 'Gast'], texts: [text] });
  form.reset();
  form.querySelector('.form-msg').textContent = FORM_MSG[gen] || FORM_MSG[0];
});

function visitorComment(text) {
  const el = state.copies[state.viewGen];
  const list = el && el.querySelector('.comment-list');
  if (!list) return;
  const empty = list.querySelector('.empty');
  if (empty) empty.remove();
  list.insertAdjacentHTML('afterbegin', commentHTML({ who: 'Lena H.', when: 'gerade eben', text }));
  const count = el.querySelector('[data-live="ccount"]');
  if (count) count.textContent = `(${list.querySelectorAll('.comment').length})`;
}

/* --------------------------------------------- Wenn man nicht hinsieht */

function driftInView() {
  const g = state.viewGen;
  const el = state.copies[g];
  if (!el) return;
  const visible = $$('.content p, .content li, .content td, .content blockquote', el).filter((n) => {
    const r = n.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && n.textContent.trim().length > 20 && !n.classList.contains('ghost');
  });
  if (!visible.length) return;
  if (g === 0 || g === FINAL) {
    for (const [from, to] of shuffled(SUBTLE)) {
      if (state.subtleUsed.has(from)) continue;
      const n = visible.find((v) => v.textContent.includes(from));
      if (n && replaceInText(n, from, to)) { state.subtleUsed.add(from); return; }
    }
    return;
  }
  const n = visible[Math.floor(rnd() * visible.length)];
  const nodes = textNodes(n).filter((t) => /\p{L}{3,}/u.test(t.nodeValue));
  if (!nodes.length) return;
  const t = nodes[Math.floor(rnd() * nodes.length)];
  const words = [...t.nodeValue.matchAll(/\p{L}{3,}/gu)];
  const m = words[Math.floor(rnd() * words.length)];
  const repl = mutateWord(m[0], g, rnd);
  t.nodeValue = t.nodeValue.slice(0, m.index) + repl + t.nodeValue.slice(m.index + m[0].length);
}

let hiddenAt = 0;
let hideTimer = 0;
let badge = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    hideTimer = setTimeout(() => {
      const g = state.viewGen;
      if (g === 0 && !state.returned) {
        state.titleStep = Math.min(state.titleStep + 1, TITLE_DECAY.length - 1);
        document.title = titleFor(0);
      } else if (g >= 2 && g < FINAL) {
        badge = true;
        document.title = '(1) ' + titleFor(g);
      }
    }, 4000);
    return;
  }
  clearTimeout(hideTimer);
  if (badge) {
    badge = false;
    visitorComment('wo warst du?');
    setTimeout(() => { document.title = titleFor(state.viewGen); }, 1600);
  }
  if (Date.now() - hiddenAt > 4000) driftInView();
});

let lastInput = Date.now();
['mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach((t) => window.addEventListener(t, () => { lastInput = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!document.hidden && Date.now() - lastInput > 40000) { driftInView(); lastInput = Date.now(); }
  if (Date.now() > state.nextEdit) {
    // jemand bearbeitet die Seite. gerade eben.
    state.edited = new Date();
    state.nextEdit = Date.now() + (4 + Math.random() * 4) * 60000;
  }
  updateLive();
}, 5000);

/* Woerter, auf denen der Blick zu lange ruht */
if (window.matchMedia('(pointer: fine)').matches) {
  let dwell = null;
  const caretAt = (x, y) => {
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p && { node: p.offsetNode, offset: p.offset }; }
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r && { node: r.startContainer, offset: r.startOffset }; }
    return null;
  };
  window.addEventListener('mousemove', (e) => {
    const g = genOf(e.target);
    if (g < 2 || g >= FINAL) { dwell = null; return; }
    const hit = caretAt(e.clientX, e.clientY);
    if (!hit || !hit.node || hit.node.nodeType !== 3) { dwell = null; return; }
    const host = hit.node.parentElement;
    if (!host || !host.closest('.content p, .content li, .content td, .content blockquote, .comment p') || host.closest('[data-live]')) { dwell = null; return; }
    const text = hit.node.nodeValue;
    let s = hit.offset, en = hit.offset;
    while (s > 0 && /\p{L}/u.test(text[s - 1])) s--;
    while (en < text.length && /\p{L}/u.test(text[en])) en++;
    if (en - s < 2) { dwell = null; return; }
    const range = document.createRange();
    range.setStart(hit.node, s); range.setEnd(hit.node, en);
    const rc = range.getBoundingClientRect();
    if (e.clientX < rc.left - 2 || e.clientX > rc.right + 2 || e.clientY < rc.top - 2 || e.clientY > rc.bottom + 2) { dwell = null; return; }
    if (dwell && dwell.node === hit.node && dwell.s === s) return;
    dwell = { node: hit.node, s, en, word: text.slice(s, en), g, t: performance.now() };
  }, { passive: true });
  setInterval(() => {
    if (!dwell) return;
    const wait = dwell.g >= 4 ? 700 : dwell.g === 3 ? 1200 : 1800;
    if (performance.now() - dwell.t < wait) return;
    const { node, s, en, word, g } = dwell;
    dwell = null;
    if (node.nodeValue.slice(s, en) !== word) return;
    const m = mutateWord(word, g, rnd);
    if (m !== word) node.nodeValue = node.nodeValue.slice(0, s) + m + node.nodeValue.slice(en);
  }, 150);
}

/* Wer kopiert, bekommt eine Kopie */
function subtleCopy(text) {
  let done = false;
  let out = text.replace(/\p{L}+/gu, (w) => {
    if (done || w.length < 4) return w;
    const m = mishear(w);
    if (m) { done = true; return m; }
    return w;
  });
  if (!done) out = out.replace(/\d/, (d) => String((Number(d) + 1) % 10));
  return out;
}

document.addEventListener('copy', (e) => {
  const sel = window.getSelection();
  const text = sel ? sel.toString() : '';
  if (!text.trim() || !e.clipboardData) return;
  const g = genOf(sel.anchorNode);
  if (g < 0) return;
  let out = g === 0 || g === FINAL ? subtleCopy(text) : corrupt(text, Math.min(5, g + 1), rnd);
  if (g >= 3 && g < FINAL) out += '\n\n(Kopie)';
  if (out === text) return;
  e.clipboardData.setData('text/plain', out);
  e.preventDefault();
});

/* ------------------------------------------------------------------ Start */

state.copies.push(copy0);
state.gaps.push(makeGap(0));
setImages(copy0, 0);

if (state.visits > 1 && state.deep) {
  const g1 = copy0.querySelector('[data-k="ghost1"]');
  if (g1) g1.textContent = 'du warst schon einmal hier.';
  const [from, to] = SUBTLE[Math.floor(rnd() * SUBTLE.length)];
  if (replaceInText(copy0.querySelector('.content'), from, to)) state.subtleUsed.add(from);
}

updateLive();
window.scrollTo(0, 0);
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
frame();
idle(() => prefetch(1));

console.log('%cDie Backrooms%c  Referat von Lena Hoffmann', 'font: 20px Georgia, serif', 'font: 12px system-ui, sans-serif; color: #5f6872');
console.info('[referat] Abschnitte geladen: 7 von 8');
if (state.visits > 1) console.info(state.deep ? '[referat] du warst schon unten.' : '[referat] willkommen zurück.');
