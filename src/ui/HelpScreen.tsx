import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'
import { useGame } from '../state/game'
import { markHelpSeen } from '../state/help'

// Tela de ajuda dos controles (tarefa 7.5): abre sozinha no primeiro acesso
// e depois pelo botão "?". Na versão de celular (7.3) as teclas viram
// joystick e botões A/B.
export default function HelpScreen() {
  const t = useI18n((s) => s.t)
  const screen = useGame((s) => s.screen)
  const setScreen = useGame((s) => s.setScreen)
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = screen === 'help'

  const close = () => {
    markHelpSeen()
    setScreen('play')
  }

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null

  const { keys, labels } = t.help
  const rows: [string, string][] = [
    ['WASD', keys.move],
    ['Shift', keys.run],
    [labels.space, keys.jump],
    ['E', keys.interact],
    [labels.wheel, keys.zoom],
  ]

  return (
    <div className="panel-backdrop" onClick={close}>
      <section className="panel help" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="help-title" className="panel__label">
          {t.help.title}
        </h2>
        <ul className="help__list">
          {rows.map(([key, action]) => (
            <li key={action}>
              <kbd>{key}</kbd>
              <span>{action}</span>
            </li>
          ))}
        </ul>
        <button ref={closeRef} type="button" className="panel__btn panel__btn--primary help__ok" onClick={close}>
          {t.help.close}
        </button>
      </section>
    </div>
  )
}
