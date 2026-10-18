import { useAudio } from '../audio/sounds'
import { useI18n } from '../i18n'
import { useGame } from '../state/game'
import { SIMPLE_URL } from './SimpleLink'

// HUD mínimo, como no worawork: só botões redondos nos cantos, o "?" (ajuda)
// à esquerda e o som à direita. Embaixo, o link discreto para a versão simples.
export default function Hud() {
  const t = useI18n((s) => s.t)
  const screen = useGame((s) => s.screen)
  const setScreen = useGame((s) => s.setScreen)
  const muted = useAudio((s) => s.muted)
  const toggleMuted = useAudio((s) => s.toggleMuted)
  const soundLabel = muted ? t.hud.soundOn : t.hud.soundOff

  if (screen === 'loading') return null

  return (
    <>
      <div className="hud">
        <button type="button" className="hud__btn" aria-label={t.hud.help} title={t.hud.help} onClick={() => setScreen('help')}>
          ?
        </button>
      </div>
      <div className="hud hud--right">
        <button type="button" className="hud__btn" aria-label={soundLabel} title={soundLabel} aria-pressed={!muted} onClick={toggleMuted}>
          <SpeakerIcon muted={muted} />
        </button>
      </div>
      <a className="hud__simple" href={SIMPLE_URL} title={t.simple.title}>
        /{t.simple.link}
      </a>
    </>
  )
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 5 6m0-6-5 6" />
      ) : (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      )}
    </svg>
  )
}
