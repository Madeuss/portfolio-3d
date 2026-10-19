import { useEffect } from 'react'
import { Joystick, VirtualButton, useButtonStore } from 'ecctrl/input'
import { useIsTouch } from '../state/device'
import { isPlaying, useGame } from '../state/game'

// Controles de toque (tarefa 7.3), como no worawork: joystick à esquerda,
// A (interagir) e B (correr) à direita. Os componentes são do ecctrl; eles
// escrevem numa store que o Player lê junto com o teclado.

const BLUE = '#0A3FB8'
const OFF = '#FAFAF7'

export default function TouchControls() {
  const touch = useIsTouch()
  // Na luta do saco o personagem não anda, mas o botão A continua na tela
  // para emendar os golpes.
  const playing = useGame((s) => isPlaying(s) || s.training !== null)

  // Botão A: no momento em que é apertado, interage com a estação próxima.
  useEffect(
    () =>
      useButtonStore.subscribe((s, prev) => {
        // A+B juntos: golpe secreto (easter egg). Só o A: interagir.
        const both = s.buttons.interact && s.buttons.run
        const bothBefore = prev.buttons.interact && prev.buttons.run
        if (both && !bothBefore) useGame.getState().special()
        else if (s.buttons.interact && !prev.buttons.interact) useGame.getState().interact()
      }),
    [],
  )

  // Ao sair do jogo (painel, ajuda), solta tudo para o personagem não
  // continuar andando com um dedo que "ficou" apertado.
  useEffect(() => {
    if (!playing) useButtonStore.getState().resetAllButtons()
  }, [playing])

  if (!touch || !playing) return null

  return (
    <>
      <Joystick
        joystickWrapperStyle={{ left: 16, bottom: 'calc(16px + env(safe-area-inset-bottom))', width: 160, height: 160 }}
        joystickBaseStyle={{ width: 120, height: 120, background: 'rgba(250, 250, 247, 0.55)', border: `2px solid ${BLUE}` }}
        joystickKnobStyle={{ background: BLUE, border: `2px solid ${OFF}` }}
        joystickMaxRadius={45}
      />
      <VirtualButton
        id="interact"
        label="A"
        buttonWrapperStyle={{ right: 24, bottom: 'calc(40px + env(safe-area-inset-bottom))', width: 72, height: 72 }}
        buttonCapStyle={{ width: 60, height: 60, background: BLUE, color: OFF, font: '800 22px var(--font)' }}
      />
      <VirtualButton
        id="run"
        label="B"
        buttonWrapperStyle={{ right: 104, bottom: 'calc(96px + env(safe-area-inset-bottom))', width: 60, height: 60 }}
        buttonCapStyle={{ width: 48, height: 48, background: BLUE, color: OFF, font: '800 18px var(--font)' }}
      />
    </>
  )
}
