import { useEffect, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useEcctrlAnimationStore } from 'ecctrl/animation'
import type { EcctrlAnimationState } from 'ecctrl/animation'
import type { Group, Mesh } from 'three'
import { LoopOnce, LoopRepeat } from 'three'

// Personagem provisório (tarefas 2.1 e 2.4): Viking do Ultimate Animated
// Character Pack, do Quaternius (CC0). Na fase 4 entra o seu avatar; se as
// animações tiverem os mesmos nomes (Idle, Walk, Run, Jump), basta trocar o URL.
const URL = '/models/character/Viking_Male.gltf'

// O modelo tem 3,6 unidades de altura; 0,42 deixa ele com ~1,5 m.
const SCALE = 0.42
// Os pés ficam na base da cápsula, que flutua acima do chão: meia altura
// (0,35) + raio (0,3) + flutuação (0,3) abaixo do centro.
const FEET_Y = -0.95

// Estado do ecctrl → nome da animação no arquivo.
const CLIPS: Record<EcctrlAnimationState, string> = {
  IDLE: 'Idle',
  WALK: 'Walk',
  RUN: 'Run',
  JUMP_START: 'Jump',
  JUMP_IDLE: 'Jump',
  JUMP_FALL: 'Jump',
  JUMP_LAND: 'Idle',
}

// Tempo da transição entre uma animação e outra, em segundos.
const FADE = 0.2

export default function Character() {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(URL)
  const { actions } = useAnimations(animations, group)
  const state = useEcctrlAnimationStore((s) => s.animationState)
  const clip = CLIPS[state]

  // Toda malha do modelo projeta e recebe sombra.
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
  }, [scene])

  // Troca de animação com fade. Como JUMP_START/IDLE/FALL usam o mesmo clipe,
  // o efeito só roda quando o *clipe* muda, e o pulo não reinicia no ar.
  useEffect(() => {
    const action = actions[clip]
    if (!action) return

    const once = clip === 'Jump'
    action.setLoop(once ? LoopOnce : LoopRepeat, Infinity)
    // A AnimationAction do three.js é configurada por atribuição mesmo.
    // oxlint-disable-next-line react/immutability
    action.clampWhenFinished = once
    action.reset().fadeIn(FADE).play()

    return () => {
      action.fadeOut(FADE)
    }
  }, [actions, clip])

  return (
    <group ref={group} position-y={FEET_Y} scale={SCALE}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(URL)
