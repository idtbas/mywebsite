/**
 * All copy and every game fact used on the site lives in this file so it can
 * be corrected without touching any component.
 *
 * Facts were taken from the community-run Creatures of Sonaria Wiki (Fandom)
 * as of October 2026. Game values change with updates – verify before quoting.
 * Lines marked `poetic` are artistic copy, not game information.
 */

export const SOURCES = [
  {
    label: 'Creatures of Sonaria Wiki — Sigmatox',
    href: 'https://creatures-of-sonaria-official.fandom.com/wiki/Sigmatox',
  },
  {
    label: 'Creatures of Sonaria Wiki — Sigmatox/Legacy',
    href: 'https://creatures-of-sonaria-official.fandom.com/wiki/Sigmatox/Legacy',
  },
] as const

export const FACTS_AS_OF = 'Oktober 2026'

export const CHAPTERS = [
  { id: 'awakening', no: '01', title: 'The Awakening', len: 200 },
  { id: 'creature', no: '02', title: 'The Creature', len: 360 },
  { id: 'anatomy', no: '03', title: 'Anatomy of a Predator', len: 520 },
  { id: 'power', no: '04', title: 'Power & Presence', len: 480 },
  { id: 'darkness', no: '05', title: 'Into the Darkness', len: 460 },
  { id: 'reveal', no: '06', title: 'Final Reveal', len: 300 },
] as const

export type ChapterId = (typeof CHAPTERS)[number]['id']

export const HERO = {
  kicker: 'Eine inoffizielle 3D-Erfahrung',
  title: 'SIGMATOX',
  // poetic – refers to the wiki note that the head apparently has no eyes
  tagline: ['Es hat keine Augen.', 'Und sieht dich trotzdem.'],
  scrollHint: 'Scrollen, um es zu wecken',
}

export const PROFILE = {
  headline: ['Ein Jäger,', 'der nicht gesehen', 'werden will.'],
  facts: [
    { label: 'Tier', value: '5' },
    { label: 'Ernährung', value: 'Fleischfresser' },
    { label: 'Lebensraum', value: 'Land' },
    { label: 'Gang', value: 'Zweibeinig' },
  ],
  body:
    'Laut Wiki gilt Sigmatox als hochintelligent: Es kann andere Kreaturen austricksen und lebt meist in kleinen Familiengruppen.',
  status: 'Im Wiki als „Role-Limited“-Kreatur geführt.',
  // poetic
  statement: ['Geformt aus Schatten.', 'Durchzogen von Licht.'],
}

export interface AnatomyFeature {
  id: string
  fig: string
  name: string
  title: string
  text: string
  /** creature-space anchor of the hotspot */
  anchor: [number, number, number]
}

export const ANATOMY: AnatomyFeature[] = [
  {
    id: 'cranium',
    fig: 'FIG. 01',
    name: 'Cranium',
    title: 'Gehörnter Schädel',
    text:
      'Stachelige Hörner, eine Reihe gezackter Zähne – und offenbar keine Augen. Männchen und Weibchen unterscheiden sich in der Form ihrer Hörner.',
    anchor: [0, 3.42, 1.95],
  },
  {
    id: 'arms',
    fig: 'FIG. 02',
    name: 'Brachia',
    title: 'Zusätzliche Arme',
    text:
      'Neben den vorderen Gliedmaßen trägt Sigmatox weitere Armpaare. Das hintere Paar ist das größte.',
    anchor: [-1.45, 4.32, -0.36],
  },
  {
    id: 'tail',
    fig: 'FIG. 03',
    name: 'Cauda',
    title: 'Der zweite Kopf',
    text:
      'Der Schwanz endet in einem zweiten Kopf mit gezackten Zähnen, ebenfalls ohne Augen. In Fan-Analysen wird er oft als Köder gedeutet.',
    anchor: [0.62, 1.95, -4.85],
  },
  {
    id: 'gait',
    fig: 'FIG. 04',
    name: 'Locomotio',
    title: 'Zweibeiniger Stand',
    text:
      'Sigmatox bewegt sich auf zwei Beinen. Mit der passiven Fähigkeit „Climber“ läuft es an Wänden und Decken entlang.',
    anchor: [0.62, 0.35, -0.2],
  },
]

export interface Ability {
  id: string
  name: string
  kind: string
  /** large kinetic word shown behind the ability (poetic) */
  word: string
  text: string
  meta?: string
}

export const ABILITIES: Ability[] = [
  {
    id: 'invisibility',
    name: 'Invisibility',
    kind: 'Aktiv',
    word: 'UNSICHTBAR',
    text:
      'Macht Sigmatox für andere Spieler unsichtbar. Gehen und Schwimmen sind möglich – Beißen, Sprinten, Hinterhalte, Springen oder eine andere aktive Fähigkeit beenden den Effekt.',
    meta: 'Abklingzeit laut Wiki: 30 s (Recode-Version)',
  },
  {
    id: 'climber',
    name: 'Climber',
    kind: 'Passiv',
    word: 'KLETTERT',
    text: 'Erlaubt das Laufen an Wänden und Decken.',
  },
  {
    id: 'observer',
    name: 'Keen Observer',
    kind: 'Eigenschaft',
    word: 'DURCHSCHAUT',
    text: 'Durchschaut die Unsichtbarkeit anderer Kreaturen.',
  },
]

export const POWER = {
  kicker: 'Fähigkeiten laut Wiki',
  // fact: invisibility does not hide the creature from scent
  scent: ['Unsichtbar.', 'Nicht geruchlos.'],
  scentNote: 'Die Unsichtbarkeit verbirgt Sigmatox nicht vor dem Geruchssinn.',
}

// poetic fragments, each loosely tied to a fact above
export const DARKNESS = {
  fragments: [
    'Tiefer.',
    'Es wartet.',
    'Es täuscht.',
    'Es klettert, wo du nicht hinsiehst.',
    'Es sieht, was sich verbirgt.',
  ],
}

export const FINALE = {
  title: 'SIGMATOX',
  line: 'Tier 5 · Fleischfresser · Land',
  tagline: ['Es hat keine Augen.', 'Es braucht keine.'],
  restart: 'Erneut erwachen',
  wiki: 'Zur Wiki',
}

export const DISCLAIMER = [
  'Inoffizielles Fanprojekt. Nicht verbunden mit, unterstützt oder genehmigt von der Roblox Corporation oder den Entwicklern von Creatures of Sonaria.',
  'Roblox und Creatures of Sonaria sind Marken ihrer jeweiligen Inhaber.',
  'Die 3D-Skulptur ist eine eigenständige, von Sigmatox inspirierte Interpretation – kein Original-Spielmodell.',
]
