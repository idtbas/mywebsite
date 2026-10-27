/*
 * Stille Post.
 * VARIANTS: von Hand geschriebene Fassungen je Kopie (Index = Generation).
 * Fehlt eine Fassung, wird der Text der vorigen Kopie maschinell "weitergesagt".
 * Platzhalter: {ordinal}; Live-Werte stehen in <span data-live="...">
 */

export const VARIANTS = {
  title: { 4: 'Die Backrooms', 5: 'Die Backrooms' },
  subtitle: {
    2: 'Wie aus einem einzelnen Foto ein endloser Ort geworden ist',
    3: 'Wie aus einem Foto ein Ort wurde, aus dem man nicht mehr herauskommt',
    4: 'Wie aus einem Foto ein Ort wurde',
    5: 'ein ort',
  },
  byline: {
    2: 'Referat von Lena Hofmann',
    3: 'Referat von Lena Hoffmann und <span data-live="name-dir">dir</span>',
    4: 'Referat von <span data-live="name-dir">dir</span>',
    5: '',
  },
  readtime: {
    2: 'Lesezeit ca. 9 Min. (bisher: <span data-live="min-n">0</span> Min.)',
    3: 'Lesezeit: unbekannt',
    4: 'du liest seit <span data-live="mins">einer Minute</span>',
    5: '',
  },
  nav6: { 2: 'Fazit', 3: 'Ausgang', 4: 'Level 0' },

  h1: { 4: 'Einleitung', 5: '' },
  intro1: {
    1: 'Die Backrooms sind eine Internet-Legende, die 2019 in einem anonymen Forum entdeckt wurde. Sie beschreiben einen scheinbar endlosen Komplex aus leeren Büroräumen mit gelben Tapeten, feuchtem Teppichboden und summenden Neonröhren.',
    2: 'Die Backrooms sind eine Legende, die 2019 in einem anonymen Forum entdeckt wurde. Sie beschreiben einen endlosen Komplex aus leeren Räumen mit gelben Tapeten, feuchtem Teppich und summenden Röhren.',
    3: 'Die Backrooms sind keine Legende. Sie wurden 2019 entdeckt, aber sie waren vorher schon da. Sie bestehen aus leeren Räumen, gelben Tapeten, feuchtem Teppich und einem Summen, das nicht aufhört.',
    4: 'Die Backrooms sind. Sie waren vorher schon da. Leere Räume, gelbe Tapeten, feuchter Teppich, das Summen. Das Summen. Hörst du es auch?',
    5: 'die backrooms sind hier.',
  },
  intro2: {
    2: 'In diesem Referat untersuche ich, woher die Legende stammt, wie sie sich durch Weitererzählen verändert hat und warum gerade so unspektakuläre Orte wie dieser hier bei vielen Menschen ein Unbehagen auslösen.',
    3: 'In diesem Referat untersuche ich, wie ich hierhergekommen bin. Ich habe es weitererzählt, und dabei hat es sich verändert. Jedes Mal, wenn es jemand liest, verändert es sich ein bisschen mehr. Du liest es gerade.',
    4: 'In diesem Referat suche ich den Ausgang.',
    5: '',
  },
  ghost1: {
    1: 'ich weiß nicht mehr, wie lange ich schon an diesem referat schreibe',
    2: 'ich weiß nicht mehr, wie oft ich dieses referat schon geschrieben habe',
    3: 'ich habe es nicht so oft geschrieben. jemand kopiert es.',
    4: 'du kopierst es. jedes mal, wenn du weiterscrollst.',
    5: 'danke, dass du es weitergibst.',
  },

  h2: { 4: 'Ursprung', 5: '' },
  origin1: {
    2: 'Am 12. Mai 2019 eröffnete ein anonymer Nutzer im Board /x/ der Plattform 4chan einen Thread mit der Aufforderung, Bilder zu posten, die sich einfach „falsch“ anfühlen. Unter den Antworten war ein Foto: ein leerer Raum mit gelber Tapete, Teppichboden und Neonlicht (Abb.&nbsp;1).<sup><a>1</a></sup>',
    3: 'Am 12. Mai 2019 bat jemand darum, Bilder zu posten, die sich falsch anfühlen. Unter den Antworten war ein Foto. Niemand weiß, wer es gepostet hat. Niemand weiß, wer es aufgenommen hat (Abb.&nbsp;1).',
    4: 'Am 12. Mai 2019 postete jemand ein Foto (Abb.&nbsp;1). Seitdem wird es kopiert.',
  },
  cap1: {
    2: '<strong>Abb. 1:</strong> Nachstellung des Fotos von 2019 (eigene Darstellung).',
    3: '<strong>Abb. 1:</strong> Das Foto von 2019 (Kopie).',
    4: '<strong>Abb. 1:</strong> Kopie einer Kopie.',
    5: '<strong>Abb. 1:</strong> hier',
  },
  alt1: {
    3: 'Foto eines leeren Büroraums mit gelben Tapeten. Hinter dem Pfeiler steht jemand.',
    4: 'Foto eines Raums. Jemand steht darin und sieht in die Kamera.',
    5: 'Foto von dir, von vorne.',
  },
  origin2: { 4: 'Jemand anderes schrieb darunter:' },
  quote: {
    2: '„Wenn du in der Realität nicht aufpasst und an der falschen Stelle hinausrutschst, landest du in den Backrooms: nichts als der Geruch von altem, feuchtem Teppich, der Wahnsinn von Mono-Gelb, das endlose Rauschen von Neonröhren auf höchster Stufe und ungefähr 1,5 Milliarden Quadratkilometer leerer Räume, in denen du gefangen bist. Gott steh dir bei, wenn du hörst, dass sich in der Nähe etwas bewegt – denn es hat dich schon gehört.“<cite>Anonym, 2019</cite>',
    3: '„Wenn du nicht aufpasst und an der falschen Stelle hinausrutschst, landest du hier: der Geruch von feuchtem Teppich, Mono-Gelb, das Summen auf höchster Stufe und ungefähr 1,5 Milliarden Quadratkilometer leerer Räume. Gott steh dir bei, wenn du hörst, dass sich in der Nähe etwas bewegt. Es hat dich gehört. Es hört dich jetzt.“<cite>Anonym</cite>',
    4: '„Es hat dich gehört. Es hat dich gehört. Es hat dich gehört.“<cite>du</cite>',
  },
  origin3: {
    3: 'Der Ausdruck „hinausrutschen“ (engl. <em>noclip</em>) stammt aus Videospielen: Mit einem Cheat-Befehl kann man dort durch Wände gehen und gerät dabei in Bereiche außerhalb der eigentlichen Welt – leer, unfertig und endlos. Zum Beispiel unterhalb des Fußbereichs einer Webseite.',
    4: 'Man rutscht hinaus, wenn man zu weit geht. Du bist zu weit gescrollt.',
  },
  origin4: {
    2: 'Lange war unklar, wo das Foto aufgenommen wurde. Erst 2024 konnte es zugeordnet werden: Es zeigt die Umbauarbeiten in einem leerstehenden Ladenlokal in Oshkosh, Wisconsin (USA), fotografiert um das Jahr 2003. Der Raum existiert heute nicht mehr.<sup><a>2</a></sup>',
    3: 'Lange war unklar, wo das Foto aufgenommen wurde. Der Raum existiert heute nicht mehr. Er wurde nur noch kopiert, immer wieder, bis die Kopien größer waren als das Original.',
    4: 'Lange war unklar, wo das Foto aufgenommen wurde. Es wurde hier aufgenommen.',
  },

  h3: { 5: '' },
  lvl1: {
    3: 'Aus dem einen Bild wurde in wenigen Monaten eine ganze Welt. Tausende Menschen schreiben gemeinsam an ihr weiter. Der Raum aus dem Foto heißt dort „Level&nbsp;0“. Diese Seite heißt dort auch so.',
  },
  nonEuclid: {
    2: 'Level 0 wird als nicht-euklidisch beschrieben: Gänge, die man zweimal entlangläuft, führen nicht zwangsläufig an denselben Ort zurück. Es gibt keine Fenster, keine Türen nach draußen und keine anderen Menschen.<sup><a>7</a></sup> Nur die Neonröhren, deren Summen niemals aufhört.',
    3: 'Level 0 ist nicht-euklidisch: Wer einen Gang zweimal entlangläuft, kommt nicht an denselben Ort zurück. Wer eine Seite zweimal liest, auch nicht. Es gibt keine Fenster, keine Türen nach draußen und keine anderen Menschen. Fast keine.',
    4: 'Es gibt keine Fenster. Es gibt keine Türen. Es gibt keine anderen Menschen. Es gibt dich.',
  },
  cap2: {
    2: '<strong>Abb. 2:</strong> Level 0, eigene 3D-Darstellung.',
    3: '<strong>Abb. 2:</strong> Level 0 (eigene Darstellung).',
    4: '<strong>Abb. 2:</strong> Der Flur. Er ist näher gekommen.',
  },
  alt2: { 2: 'Langer, gelber Flur. Am Ende steht jemand.', 4: 'Der Flur. Jemand kommt näher.' },
  lvl3: {
    2: 'Interessant ist, dass sich die Beschreibung von Level 0 kaum verändert hat, obwohl sie unzählige Male weitererzählt wurde. Bei fast allen anderen Teilen der Legende ist das Gegenteil der Fall: Jede neue Version übernimmt etwas von der vorigen – ähnlich wie beim Kinderspiel „Stille Post“.',
    3: 'Jede neue Version übernimmt etwas von der vorigen und verliert etwas. Ähnlich wie beim Kinderspiel „Stille Post“. Diese Version hier ist die {ordinal}.',
    4: 'Jede Version verliert etwas. Diese hier hat schon fast alles verloren.',
  },

  h4: { 3: 'Weitere Level', 4: 'Level 0' },
  more1: {
    3: 'Neben Level 0 beschreibt das Wiki Hunderte weitere Level. Die folgende Tabelle zeigt eine Auswahl. Sie ist nicht mehr ganz vollständig:',
    4: 'Die folgende Tabelle zeigt alle Level:',
  },
  tabcap: {
    3: 'Tab. 1: Bekannte Level (Kopie)',
    4: 'Tab. 1: Level',
  },
  more2: {
    2: 'Daneben gibt es sogenannte Entitäten – Wesen, die in den Backrooms leben sollen. Zu den bekanntesten gehören die „Smiler“, von denen in der Dunkelheit nur ein Grinsen zu sehen ist, und die „Partygoers“, die Besucher mit einem fröhlichen „=)“ zu einer Feier einladen, die niemals endet. In der ursprünglichen Geschichte kamen keine Entitäten vor – nur das Gefühl, dass irgendwo etwas ist.<sup><a>3</a></sup>',
    3: 'Daneben gibt es sogenannte Entitäten. In der ursprünglichen Geschichte kamen keine vor – nur das Gefühl, dass irgendwo etwas ist. Dieses Gefühl ist richtig. =)',
    4: 'Entitäten: 1 (<span data-live="name-du">du</span>)',
  },
  more3: {
    3: 'Größere Bekanntheit erreichten die Backrooms 2022 durch eine Kurzfilmreihe. Seitdem kommen jeden Tag neue Besucher. Die meisten scrollen nicht so weit wie du.',
    4: 'Seitdem kommen jeden Tag neue Besucher. Niemand geht.',
  },
  cap3: {
    3: '<strong>Abb. 3:</strong> Suchinteresse am Begriff „Ausgang“, 2019 bis heute (schematisch).',
    4: '<strong>Abb. 3:</strong> (keine Daten)',
  },

  h5: { 3: 'Liminale Räume', 4: 'Räume' },
  lim1: {
    3: 'Warum wirkt ein leerer Flur unheimlich? Gemeint sind Übergangsorte wie Flure, Treppenhäuser, Wartebereiche – oder der leere Bereich unter einer Webseite. Orte, die man nur durchquert. Man sollte nicht in ihnen bleiben. Du bist seit <span data-live="mins">einer Minute</span> hier.',
    4: 'Liminale Räume sind Orte, die man nur durchquert. Du durchquerst diesen hier seit <span data-live="mins">einer Minute</span>.',
  },
  lim2: {
    3: 'Begegnet man solchen Orten zur falschen Zeit, fehlt das, was sie ausmacht: Menschen. Der Ort wirkt vertraut und gleichzeitig falsch. Wie diese Seite. Du hast sie schon einmal gelesen, oder?',
    4: 'Der Ort wirkt vertraut und gleichzeitig falsch.',
  },
  lim3: {
    2: 'Der Kulturtheoretiker Mark Fisher beschreibt das Unheimliche als ein Gefühl, das entsteht, wenn dort etwas ist, wo nichts sein sollte – oder dort nichts ist, wo etwas sein sollte.<sup><a>5</a></sup> Die Backrooms verbinden beides: Sie sind leer, und trotzdem ist man nicht allein.',
    3: 'Das Unheimliche entsteht, wenn dort etwas ist, wo nichts sein sollte. Die Backrooms sind leer, und trotzdem ist man nicht allein. Beweg mal die Maus.',
    4: 'Etwas ist dort, wo nichts sein sollte.',
  },

  h6: { 3: 'Ausgang', 4: 'Ausgang', 5: 'Ausgang' },
  exit1: {
    3: '(Dieser Abschnitt wird gerade bearbeitet.)',
    4: 'Es gibt keinen.',
    5: 'Es gibt keinen Ausgang. Es gibt nur weitere Kopien.',
  },

  h7: { 4: 'Fazit', 5: '' },
  fazit1: {
    2: 'Die Backrooms zeigen, wie im Internet aus einem einzelnen, eigentlich banalen Foto ein gemeinsames Erzählprojekt werden kann. Jede Person, die die Geschichte weitergibt, verändert sie ein wenig – und genau dadurch bleibt sie am Leben.',
    3: 'Die Backrooms zeigen, wie aus einem einzelnen Foto ein Ort werden kann. Jede Person, die die Geschichte weitergibt, verändert sie ein wenig. Und jede Person, die sie liest, bleibt ein wenig darin.',
    4: 'Jede Person, die die Geschichte liest, bleibt darin.',
  },
  fazit2: {
    3: 'Viele kennen das Gefühl, in einem leeren Gebäude zu stehen und plötzlich nicht mehr sicher zu sein, ob man wirklich allein ist. Die Legende beschreibt keinen fremden Ort. Sie beschreibt diesen hier.',
    4: 'Du bist nicht allein.',
  },
  ghost2: {
    1: 'bitte nicht weiter nach unten scrollen. ab hier stimmt die seite nicht mehr.',
    2: 'du hast trotzdem weitergescrollt.',
    3: 'es ist nicht schlimm. die anderen haben auch weitergescrollt.',
    4: 'wir sind alle hier unten.',
    5: 'oben ist der ausgang. aber oben ist auch nur eine kopie.',
  },
  thanks: {
    3: 'Vielen Dank für Ihre Aufmerksamkeit.',
    4: 'Vielen Dank für deine Aufmerksamkeit. Du kannst jetzt gehen.',
    5: 'Danke, dass du geblieben bist.',
  },
  h8: { 4: 'Quellen', 5: '' },
  micro: {
    2: 'Diese Seite ist das Original.',
    3: 'Diese Seite ist das Original?',
    4: 'Diese Seite war das Original.',
    5: 'Das Original ist nicht mehr da.',
  },
};

/* Woerter, die man bei der Stillen Post verhoert */
const MISHEAR = {
  raum: 'traum', räume: 'träume', ausgang: 'eingang', eingang: 'ausgang', teppich: 'treppe',
  licht: 'nicht', gelb: 'geld', gelben: 'selben', wände: 'hände', wand: 'hand', leer: 'mehr',
  leeren: 'lehren', flur: 'nur', tür: 'dir', türen: 'spuren', bild: 'wild', legende: 'lebende',
  ort: 'fort', orte: 'worte', gänge: 'enge', endlos: 'leblos', endlosen: 'leblosen',
  summen: 'stimmen', röhren: 'hören', zeit: 'weit', welt: 'fällt', allein: 'klein', hier: 'dir',
  wir: 'hier', geschichte: 'gesichter', referat: 'verrat', seite: 'weite', ebene: 'eben',
  gefangen: 'gegangen', finden: 'verschwinden', gesehen: 'geschehen', jahr: 'wahr',
  schwelle: 'stelle', unheimliche: 'heimliche', verändert: 'verhindert', erzählt: 'fehlt',
  feier: 'schleier', menschen: 'masken', besucher: 'besuch', foto: 'so', nutzer: 'nutzen',
  forum: 'vorn', thread: 'tritt', weitergibt: 'weiterlebt', lebendig: 'lebend', fenster: 'finster',
  draußen: 'drinnen', zurück: 'zu dir', gemeinsam: 'einsam', bekannt: 'verbrannt',
  fremd: 'hemd', schule: 'stille', leben: 'eben', hören: 'gehören', nerv: 'nur', tabelle: 'stelle',
  kopie: 'kopie', original: 'kopie', raums: 'traums', flure: 'spuren', büroräumen: 'büroträumen',
  neonröhren: 'neonröhren', quellen: 'quälen', fazit: 'fast', einleitung: 'leitung', ursprung: 'sprung',
};

const FILLER = ['hier', 'du', 'Raum', 'gelb', 'Summen', 'Kopie', 'hier', 'noch', 'Teppich', 'Level 0'];

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function keepCase(src, word) {
  if (src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase()) return word[0].toUpperCase() + word.slice(1);
  return word;
}

export function mishear(word) {
  const m = MISHEAR[word.toLowerCase()];
  return m && m !== word.toLowerCase() ? keepCase(word, m) : null;
}

function typo(word, rnd) {
  if (word.length < 4) return word;
  const i = 1 + Math.floor(rnd() * (word.length - 2));
  const r = rnd();
  if (r < 0.4) return word.slice(0, i) + word[i] + word.slice(i);          // Buchstabe doppelt
  if (r < 0.75) return word.slice(0, i) + word.slice(i + 1);                // Buchstabe fehlt
  return word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);      // vertauscht
}

const RATE = [0, 0.012, 0.03, 0.07, 0.14, 0.3];

/* Einen Text eine Generation weitersagen */
export function corrupt(text, gen, rnd) {
  const rate = RATE[Math.min(gen, RATE.length - 1)];
  if (!rate) return text;
  return text.replace(/[\p{L}\p{N}]+/gu, (w) => {
    if (rnd() > rate) return w;
    const heard = mishear(w);
    if (heard && rnd() < 0.75) return heard;
    if (gen <= 1) return heard || (rnd() < 0.4 ? typo(w, rnd) : w);
    const r = rnd();
    if (r < 0.3) return w + ' ' + w.toLowerCase();
    if (r < 0.5 && gen >= 3) return '';
    if (r < 0.75 || gen < 3) return typo(w, rnd);
    return FILLER[Math.floor(rnd() * FILLER.length)];
  }).replace(/ {2,}/g, ' ');
}

/* Kleine, kaum bemerkbare Aenderungen fuer das Original (Kopie 0) */
export const SUBTLE = [
  ['gelben Tapeten', 'gelblichen Tapeten'],
  ['summenden Neonröhren', 'surrenden Neonröhren'],
  ['12. Mai 2019', '13. Mai 2019'],
  ['Tausende Menschen', 'Tausende Leute'],
  ['keine anderen Menschen', 'kaum andere Menschen'],
  ['die man zweimal entlangläuft', 'die man dreimal entlangläuft'],
  ['nur durchquert', 'nur durchläuft'],
  ['einer Schule in den Ferien', 'einer Schule in der Nacht'],
  ['ob man wirklich allein ist', 'ob man wirklich noch allein ist'],
  ['innerhalb weniger Monate', 'innerhalb weniger Wochen'],
  ['einen, den wir alle schon einmal gesehen haben', 'einen, den wir alle schon einmal betreten haben'],
  ['Gott steh dir bei', 'Gott steh uns bei'],
];

/* Zahl als Ordinalwort ("die zweite") */
export function ordinal(n) {
  return ['erste', 'zweite', 'dritte', 'vierte', 'fünfte', 'sechste', 'siebte'][n] || (n + 1) + '.';
}

/* Ein einzelnes Wort verhoeren (beim Lesen, beim Wegsehen) */
export function mutateWord(word, gen, rnd) {
  if (gen >= 4 && rnd() < 0.45) return FILLER[Math.floor(rnd() * FILLER.length)];
  const heard = mishear(word);
  if (heard) return heard;
  if (word.length < 4) return gen >= 3 ? FILLER[Math.floor(rnd() * FILLER.length)] : word;
  return typo(word, rnd);
}
