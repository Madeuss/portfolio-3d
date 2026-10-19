import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useEcctrlAnimationStore } from 'ecctrl/animation'
import { useGame } from '../state/game'
import { playStep } from './sounds'

// Intervalo entre passos (s), casado com o ritmo das animações do avatar:
// walk tem 4 passos em 2,33 s, tocada a 125%; a corrida (jog do Mixamo) tem
// 2 passos em 0,83 s (velocidades no Character).
const INTERVAL = { WALK: 0.47, RUN: 0.42 } as const
// Tonto: o drunk-walk tem 4 passos em 3 s, andando ou "correndo".
const DIZZY_INTERVAL = 0.75

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
    const interval = useGame.getState().dizzy ? DIZZY_INTERVAL : INTERVAL[state]
    if (timer.current >= interval) {
      timer.current = 0
      playStep()
    }
  })

  return null
}
