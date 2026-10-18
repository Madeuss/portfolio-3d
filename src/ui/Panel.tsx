import { useEffect, useRef } from 'react'
import './panel.css'

export type PanelContent = {
  label: string
  title: string
  meta: string
  desc: string
  image?: string
  href?: string
}

type Props = { content: PanelContent | null; onClose: () => void }

// Painel HTML por cima do Canvas (tarefa 1.7). É React comum, fora da cena 3D:
// a cena só avisa "abriu", e o painel cuida do resto. Visual do madeusdev.
export default function Panel({ content, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!content) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content, onClose])

  if (!content) return null

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <section
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel__head">
          <span className="panel__label">{content.label}</span>
          <button ref={closeRef} className="panel__close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        {content.image && <img className="panel__img" src={content.image} alt="" />}

        <div className="panel__body">
          <h2 id="panel-title" className="panel__title">
            {content.title}
          </h2>
          <p className="panel__meta">{content.meta}</p>
          <p className="panel__desc">{content.desc}</p>
          {content.href && (
            <a className="panel__btn" href={content.href} target="_blank" rel="noopener">
              GitHub ↗
            </a>
          )}
        </div>

        <p className="panel__hint">Esc fecha</p>
      </section>
    </div>
  )
}
