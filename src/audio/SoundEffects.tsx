import { useEffect } from 'react'
import { isPlaying, useGame } from '../state/game'
import { play, startMusic } from './sounds'

// Liga os sons aos acontecimentos do jogo, sem espalhar `play()` pelos
// componentes: escuta a store do jogo e toca quando algo muda.

// Atraso do apito depois da bola na rede.
const GOAL_WHISTLE_MS = 350

export default function SoundEffects() {
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        // Saiu do carregamento: foi o clique em "Entrar".
        if (prev.screen === 'loading' && s.screen !== 'loading') {
          play('enter')
          startMusic()
        }
        if (s.open && !prev.open) play('panel-open')
        if (!s.open && prev.open) play('panel-close')
        // Gol: a bola estufa a rede e, logo depois, o apito.
        if (s.goal && s.goal !== prev.goal) {
          play('goal-net')
          setTimeout(() => play('goal-whistle'), GOAL_WHISTLE_MS)
        }
        // Porta: abre ao escurecer, fecha ao chegar do outro lado.
        if (s.fading && !prev.fading) play('door-open')
        if (s.scene !== prev.scene && s.spawn === 'door') play('door-close')
        // Chegou perto de uma estação (o aviso "E ..." apareceu). A bola fica de fora:
        // ela vive entrando e saindo do alcance no jogo.
        if (s.nearby && s.nearby !== 'ball' && s.nearby !== prev.nearby && isPlaying(s)) play('prompt')
      }),
    [],
  )
  return null
}
