import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useEcctrlAnimationStore } from 'ecctrl/animation'
import { useGame } from '../state/game'
import { playStep } from './sounds'

// Intervalo entre passos (s), casado com o ritmo das animações Walk e Run.
const INTERVAL = { WALK: 0.42, RUN: 0.29 } as const

// Toca um passo a cada intervalo enquanto o personagem anda ou corre no chão.
// Quando o cenário real tiver pisos diferentes, o som muda conforme o chão
// (grama lá fora, madeira dentro), como no worawork.
export default function Footsteps() {
  const timer = useRef(0)

  useFrame((_, delta) => {
    if (useGame.getState().screen !== 'play') return
    const state = useEcctrlAnimationStore.getState().animationState
    if (state !== 'WALK' && state !== 'RUN') {
      // Parado: o próximo passo sai logo que voltar a andar.
      timer.current = INTERVAL.WALK * 0.6
      return
    }
    timer.current += delta
    if (timer.current >= INTERVAL[state]) {
      timer.current = 0
      playStep()
    }
  })

  return null
}
