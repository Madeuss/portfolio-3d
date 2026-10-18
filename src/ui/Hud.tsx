import { useI18n } from '../i18n'
import { useGame } from '../state/game'

// HUD mínimo, como no worawork: só botões redondos nos cantos. Por enquanto
// o "?" (ajuda); o de som entra junto com os sons (tarefa 7.2).
export default function Hud() {
  const t = useI18n((s) => s.t)
  const screen = useGame((s) => s.screen)
  const setScreen = useGame((s) => s.setScreen)

  if (screen === 'loading') return null

  return (
    <div className="hud">
      <button type="button" className="hud__btn" aria-label={t.hud.help} title={t.hud.help} onClick={() => setScreen('help')}>
        ?
      </button>
    </div>
  )
}
