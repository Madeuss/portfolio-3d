import { useEffect, useRef } from 'react'
import { stationPanel } from '../data/stations'
import { useI18n } from '../i18n'
import { useGame } from '../state/game'
import './panel.css'

// Painel HTML por cima do Canvas (tarefa 1.7). É React comum, fora da cena 3D:
// a cena só marca qual estação abriu (store do jogo) e o painel mostra o
// conteúdo dela. Visual do madeusdev.
export default function Panel() {
  const open = useGame((s) => s.open)
  const close = useGame((s) => s.close)
  const t = useI18n((s) => s.t)
  const closeRef = useRef<HTMLButtonElement>(null)
  const content = open ? stationPanel(open, t) : null

  useEffect(() => {
    if (!content) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content, close])

  if (!content) return null

  return (
    <div className="panel-backdrop" onClick={close}>
      <section
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel__head">
          <span className="panel__label">{content.label}</span>
          <button ref={closeRef} className="panel__close" onClick={close} aria-label={t.panel.close}>
            ✕
          </button>
        </header>

        {content.image && <img className="panel__img" src={content.image} alt="" />}

        <div className="panel__body">
          <h2 id="panel-title" className="panel__title">
            {content.title}
          </h2>
          {content.meta && <p className="panel__meta">{content.meta}</p>}
          {content.desc && <p className="panel__desc">{content.desc}</p>}

          {content.groups?.map((g) => (
            <div key={g.title} className="panel__group">
              <h3 className="panel__group-title">{g.title}</h3>
              <ul className="panel__chips">
                {g.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}

          {content.links && (
            <div className="panel__links">
              {content.links.map((l) => (
                <a
                  key={l.href}
                  className={`panel__btn${l.primary ? ' panel__btn--primary' : ''}`}
                  href={l.href}
                  target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <p className="panel__hint">{t.panel.escHint}</p>
      </section>
    </div>
  )
}
