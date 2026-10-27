# SIGMATOX — An Unofficial 3D Experience

Eine scrollgesteuerte, cineastische WebGL-Erfahrung über **Sigmatox** aus dem Roblox-Spiel
_Creatures of Sonaria_. **Inoffizielles Fanprojekt** – nicht verbunden mit der Roblox
Corporation oder den Entwicklern von Creatures of Sonaria.

> Die Kreatur im Browser ist **kein Original-Spielmodell**, sondern eine eigenständige,
> prozedural erzeugte Skulptur, deren Anatomie sich an der öffentlichen Wiki-Beschreibung
> orientiert: zweibeinig, gehörnter augenloser Schädel mit gezackten Zähnen, zusätzliche
> Armpaare (das hintere Paar am größten) und ein zweiter Kopf am Schwanzende.

## Die Erfahrung

| Kapitel | Inhalt |
| --- | --- |
| 01 — The Awakening | Schwarz → Sporen → die Sinnesschlitze zünden wie Neonröhren → Adern breiten sich vom Kopf aus → Buchstaben-Reveal |
| 02 — The Creature | Kamerafahrt von Dreiviertel- zu Profilansicht, Steckbrief (Tier, Ernährung, Lebensraum, Gang) |
| 03 — Anatomy of a Predator | Vier Kamera-Close-ups mit projizierten 3D-Hotspots, animierten Verbindungslinien und Live-Kamera-Readout. Hotspots sind antippbar |
| 04 — Power & Presence | Invisibility (die Kreatur löst sich per Shader auf), Climber (die Welt kippt), Keen Observer (Scan-Welle) |
| 05 — Into the Darkness | Flug über den Rücken in einen Gang aus fossilen Rippen, Sporen und Energieringen |
| 06 — Final Reveal | Harter Schnitt durch die Dunkelheit, Drohgebärde mit Kiefer und Sichelarmen, Abspann |

Alle Werte der 3D-Szene (Kamerapfad, Objektiv, Nebel, Licht, Shader-Zustände) hängen an
einer einzigen „Story-Zeit“ (0–6), die aus der Scroll-Position berechnet wird. Deshalb
fühlt sich die Seite wie **eine** choreografierte Kamerafahrt an.

## Technik

- **React 19 + TypeScript + Vite**
- **Three.js + React Three Fiber + Drei** – prozedurale Geometrie (Röhren mit variablem
  Radius und Parallel-Transport-Frames), PBR-Material mit eigenem GLSL (Adern, Panzerfugen
  per Ableitungs-Bump-Mapping, Herzschlag-Wellen, Auflöse-Effekt)
- **Postprocessing** – HDR-Bloom, ACES-Tone-Mapping (nur wenn das Gerät es schafft)
- **GSAP + ScrollTrigger + SplitText**, **Lenis** für weiches Mausrad-Scrollen
- Fixierte Abschnitte über CSS `position: sticky` (stabil in iOS Safari)
- Generative Klangkulisse über WebAudio (standardmäßig aus, keine Audiodateien)
- Keine externen Assets, kein API-Key: Formen, Texturen, Shader und Klänge entstehen im Browser

### iPad, Smartphone & Performance

- Geräteabhängige Qualitätsstufen (`low` / `medium` / `high`): Auflösung, Partikelanzahl,
  Nebelschichten, Geometrie-Detail, Bloom, MSAA
- Laufende Überwachung der Bildrate (Drei `PerformanceMonitor`): erst wird Bloom
  abgeschaltet, dann die Renderauflösung gesenkt
- Alle Partikel- und Nebelbewegungen laufen im Vertex-Shader – die CPU fasst nach dem Start
  keine Buffer mehr an
- Touch: native iOS-Scroll-Physik, Tippen statt Hover, 44-px-Touch-Ziele, Licht folgt dem Finger
- Kamera-Kompensation für Hochformat (Dolly + leicht weiteres Objektiv)
- `100lvh`/`100svh`-Layout gegen das Springen der Safari-Leisten
- **Fallback ohne WebGL** (oder nach GPU-Kontextverlust): dieselbe Kreatur wird per
  2D-Canvas als leuchtendes Poster gemalt, die Seite bleibt komplett nutzbar
- **`prefers-reduced-motion`**: keine Kamerafahrten, sondern ruhige Standbilder mit Überblendungen

### Nützliche URL-Parameter

| Parameter | Wirkung |
| --- | --- |
| `?quality=low` / `medium` / `high` | Qualitätsstufe erzwingen |
| `?motion=reduced` | Reduzierte Bewegung testen |
| `?nowebgl` | WebGL-Fallback testen |
| `?debug` | Stellt den Story-Zustand als `window.__story` bereit |

## Inhalte ändern

- **Texte und Spielfakten:** `src/content/sigmatox.ts` – alle Fakten stammen aus der
  Creatures-of-Sonaria-Wiki (Stand Oktober 2026). Spielwerte ändern sich mit Updates.
- **Kamerafahrt & Szenen-Stimmung:** `src/scene/choreography.ts`
- **Eigenes 3D-Modell:** eine rechtlich nutzbare `.glb` nach `public/models/` legen und in
  `src/config.ts` `creatureModelUrl: 'models/dein-modell.glb'` setzen. Das Modell wird
  automatisch skaliert, auf den Boden gestellt und seine erste Animation abgespielt.

## Veröffentlichen – nur mit dem iPad

Alles funktioniert im Browser (Safari) auf github.com, ohne Computer.

### Variante A: GitHub Pages (kostenlos, bereits vorbereitet)

Der Workflow `.github/workflows/deploy.yml` baut die Seite automatisch, sobald Code auf
`main` landet.

1. **Änderungen nach `main` bringen:** Auf github.com im Repository oben auf
   **„Pull requests“ → „New pull request“** tippen, als Quelle den Branch
   `claude/sigmatox-3d-experience-yeic7p` wählen, Pull Request erstellen und
   **„Merge pull request“** tippen.
2. **Pages einschalten:** **Settings → Pages → Build and deployment → Source:
   „GitHub Actions“** auswählen.
3. **Deployment starten:** Im Tab **Actions** läuft „Deploy to GitHub Pages“ automatisch nach
   dem Merge. Falls nicht: Workflow auswählen → **„Run workflow“**.
4. Nach 1–2 Minuten ist die Seite erreichbar unter
   **https://idtbas.github.io/mywebsite/**

### Variante B: Vercel (kostenlos)

1. Auf [vercel.com](https://vercel.com) mit „Continue with GitHub“ anmelden.
2. **„Add New… → Project“** → Repository `mywebsite` importieren.
3. Vercel erkennt Vite automatisch (Build: `npm run build`, Output: `dist`) → **Deploy**.
4. Jede Änderung auf `main` wird automatisch neu veröffentlicht.

Netlify und Cloudflare Pages funktionieren genauso (Build-Befehl `npm run build`,
Ausgabeordner `dist`).

## Lokal entwickeln (falls doch einmal ein Computer verfügbar ist)

```bash
npm install
npm run dev      # Entwicklungsserver, im WLAN auch vom iPad erreichbar
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
```

## Quellen & Rechte

- [Creatures of Sonaria Wiki — Sigmatox](https://creatures-of-sonaria-official.fandom.com/wiki/Sigmatox)
- [Creatures of Sonaria Wiki — Sigmatox/Legacy](https://creatures-of-sonaria-official.fandom.com/wiki/Sigmatox/Legacy)

Roblox und Creatures of Sonaria sind Marken ihrer jeweiligen Inhaber. Es werden keine
Bilder, Modelle oder Assets aus dem Spiel verwendet. Schriften: Syncopate, Instrument
Serif, Inter Tight, JetBrains Mono (SIL Open Font License, über Fontsource gebündelt).
3D-Simplex-Noise nach Ashima Arts / Stefan Gustavson (MIT).

---

## Zweites Projekt: „Die Backrooms“ (Referat)

Unter **`/backrooms/`** liegt ein zweites, völlig eigenständiges Projekt: eine scheinbar ganz
normale studentische Referatsseite über die Backrooms.

- Live (nach dem Merge auf `main`): **https://idtbas.github.io/mywebsite/backrooms/**
- Quellcode: `public/backrooms/` – reines HTML, CSS und JavaScript ohne Abhängigkeiten.
  Vite kopiert den Ordner beim Build unverändert nach `dist/backrooms/`.
- Alle Abbildungen werden im Browser erzeugt (kleiner Raycaster in `js/renderer.js`),
  es gibt keine Bilddateien und keine externen Anfragen.
- `?reset` an die Adresse hängen, um den gespeicherten Zustand im Browser zurückzusetzen.

Mehr wird hier nicht verraten. Am besten selbst ansehen – und genau hinsehen.
