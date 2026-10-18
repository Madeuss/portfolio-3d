import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useEcctrlAnimationStore } from 'ecctrl/animation'
import type { EcctrlAnimationState } from 'ecctrl/animation'
import type { AnimationAction, Group, Mesh } from 'three'
import { LoopOnce, LoopRepeat } from 'three'

// Personagem provisório (tarefas 2.1 e 2.4): Viking do Ultimate Animated
// Character Pack, do Quaternius (CC0). Na fase 4 entra o seu avatar; se as
// animações tiverem os mesmos nomes (Idle, Walk, Run, Jump), basta trocar o URL.
const URL = '/models/character/viking.glb'

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
// O clipe Jump começa agachando (0 a 0,13 s); pulamos direto para o impulso.
const JUMP_SKIP = 0.13
// Depois de começar o pulo, ignora pedidos de troca por este tempo. Na saída
// do chão o ecctrl ainda acha que está "no chão" por alguns centímetros, e
// sem isso o pulo era trocado por Idle e recomeçava do agachamento.
const JUMP_HOLD = 0.35

export default function Character() {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(URL)

  // O Jump do Quaternius já sobe o corpo ~50 cm. Como quem faz o personagem
  // subir é a física, tiramos esse movimento vertical e fica só a pose.
  const clips = useMemo(
    () =>
      animations.map((clip) => {
        if (clip.name !== 'Jump') return clip
        const copy = clip.clone()
        copy.tracks = copy.tracks.filter((t) => t.name !== 'Body.position')
        return copy
      }),
    [animations],
  )

  const { actions } = useAnimations(clips, group)
  const current = useRef<{ name: string; action: AnimationAction } | null>(null)
  const jumpTime = useRef(0)

  // Toda malha do modelo projeta e recebe sombra.
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
  }, [scene])

  // A troca acontece aqui (a cada quadro) e não num useEffect, para poder
  // segurar o pulo pelo tempo mínimo sem re-renderizar o React.
  useFrame((_, delta) => {
    const name = CLIPS[useEcctrlAnimationStore.getState().animationState]
    const playing = current.current

    if (playing?.name === 'Jump') {
      jumpTime.current += delta
      if (name !== 'Jump' && jumpTime.current < JUMP_HOLD) return
    }
    if (playing?.name === name) return

    const next = actions[name]
    if (!next) return

    const jump = name === 'Jump'
    next.reset()
    next.setLoop(jump ? LoopOnce : LoopRepeat, Infinity)
    // A AnimationAction do three.js é configurada por atribuição mesmo.
    // oxlint-disable-next-line react/immutability
    next.clampWhenFinished = jump
    if (jump) {
      next.time = JUMP_SKIP
      jumpTime.current = 0
    }
    next.fadeIn(FADE).play()
    playing?.action.fadeOut(FADE)
    current.current = { name, action: next }
  })

  return (
    <group ref={group} position-y={FEET_Y} scale={SCALE}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(URL)
