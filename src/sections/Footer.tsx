import { DISCLAIMER, FACTS_AS_OF, SOURCES } from '../content/sigmatox'
import { scrollToStory } from '../lib/scroll'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        <div className="footer__col footer__col--wide">
          <p className="footer__label mono">Projekt</p>
          <p className="footer__lead serif">
            Eine inoffizielle, nicht-kommerzielle Fan-Hommage – gebaut als interaktive Szene im Browser.
          </p>
        </div>
        <div className="footer__col">
          <p className="footer__label mono">Quellen</p>
          <ul className="footer__list">
            {SOURCES.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer" data-cursor>
                  {s.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="footer__small mono">Stand der Informationen: {FACTS_AS_OF}</p>
        </div>
        <div className="footer__col">
          <p className="footer__label mono">Technik</p>
          <p className="footer__small">
            React · TypeScript · Three.js · React Three Fiber · GLSL · GSAP ScrollTrigger · Lenis. Alle Formen,
            Shader und Klänge werden im Browser erzeugt.
          </p>
        </div>
      </div>
      <div className="footer__legal">
        {DISCLAIMER.map((d) => (
          <p key={d}>{d}</p>
        ))}
      </div>
      <div className="footer__bottom">
        <span className="mono">SIGMATOX — Fan Experience · 2026</span>
        <button type="button" className="footer__top mono" onClick={() => scrollToStory(0, 3)} data-cursor>
          Nach oben <span aria-hidden="true">↑</span>
        </button>
      </div>
    </footer>
  )
}
