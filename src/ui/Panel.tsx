import { useEffect, useRef, useState } from 'react'
import { stationPages, type StationId } from '../data/stations'
import { play } from '../audio/sounds'
import { useI18n } from '../i18n'
import { useGame } from '../state/game'
import './panel.css'

// Painel HTML por cima do Canvas (tarefas 1.7 e 6.3). É React comum, fora da
// cena 3D: a cena só marca qual estação abriu (store do jogo) e o painel
// mostra o conteúdo dela. Visual do madeusdev.
export default function Panel() {
  const open = useGame((s) => s.open)
  // key: cada estação aberta começa do zero (página 1).
  return open ? <PanelDialog key={open} id={open} /> : null
}

function PanelDialog({ id }: { id: StationId }) {
  const close = useGame((s) => s.close)
  const t = useI18n((s) => s.t)
  const closeRef = useRef<HTMLButtonElement>(null)
  const pages = stationPages(id, t)
  const [page, setPage] = useState(0)
  const content = pages[page]
  const many = pages.length > 1

  // Volta ao início depois do último (e vice-versa).
  const go = (step: number) => {
    setPage((p) => (p + step + pages.length) % pages.length)
    play('click')
  }

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (many && e.key === 'ArrowRight') go(1)
      if (many && e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

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
          {many && (
            <span className="panel__count" aria-live="polite">
              {page + 1} / {pages.length}
            </span>
          )}
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

          {content.links && content.links.length > 0 && (
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

        <footer className="panel__foot">
          {many && (
            <button type="button" className="panel__nav" onClick={() => go(-1)}>
              ‹ {t.panel.prev}
            </button>
          )}
          <span className="panel__hint">{t.panel.escHint}</span>
          {many && (
            <button type="button" className="panel__nav" onClick={() => go(1)}>
              {t.panel.next} ›
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}
