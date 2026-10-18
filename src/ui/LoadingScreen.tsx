import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useI18n } from '../i18n'
import { useGame } from '../state/game'
import { helpSeen } from '../state/help'
import LangSwitch from './LangSwitch'

// Tela de carregamento (tarefa 7.1). A barra é o progresso real dos arquivos
// (useProgress do drei escuta o carregador do three.js). Ao terminar aparece
// "Entrar": o clique é o gesto que o navegador exige para liberar o áudio.
export default function LoadingScreen() {
  const { progress, active } = useProgress()
  const t = useI18n((s) => s.t)
  const screen = useGame((s) => s.screen)
  const setScreen = useGame((s) => s.setScreen)
  const [leaving, setLeaving] = useState(false)

  // Garantia: se o progresso travar (rede, cache, arquivo que não avisa),
  // libera o botão depois de 15 s para ninguém ficar preso aqui.
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), 15_000)
    return () => window.clearTimeout(id)
  }, [])

  const ready = (!active && progress === 100) || timedOut

  const enter = () => {
    setLeaving(true)
    // Primeiro acesso: mostra a ajuda. Depois, direto para o jogo.
    window.setTimeout(() => setScreen(helpSeen() ? 'play' : 'help'), 400)
  }

  // Enter também entra, para quem está no teclado.
  useEffect(() => {
    if (!ready || leaving) return
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && enter()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (screen !== 'loading') return null

  return (
    <div className={`loading${leaving ? ' loading--leaving' : ''}`}>
      <div className="loading__top">
        <LangSwitch />
      </div>

      <div className="loading__center">
        <h1 className="loading__name">MATEUS SOUZA</h1>
        <p className="loading__role">{t.loading.role}</p>

        <div className="loading__progress">
          <div
            className="loading__bar"
            role="progressbar"
            aria-label={t.loading.loading}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <i style={{ width: `${progress}%` }} />
          </div>
          <span className="loading__pct">{Math.round(progress)}%</span>
        </div>

        <button type="button" className="loading__enter" onClick={enter} disabled={!ready} autoFocus>
          {ready ? `${t.loading.enter} ▸` : `${t.loading.loading}…`}
        </button>
      </div>
    </div>
  )
}
