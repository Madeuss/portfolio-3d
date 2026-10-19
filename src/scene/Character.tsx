import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useEcctrlAnimationStore } from 'ecctrl/animation'
import type { EcctrlAnimationState } from 'ecctrl/animation'
import type { AnimationAction, Group, Mesh } from 'three'
import { retargetClip, type GltfNode } from './retarget'
import JerseyPrint from './JerseyPrint'

// Seu avatar chibi (tarefa 4.x): gerado no Tripo a partir das imagens do
// Gemini (docs/refs/01-avatar-*.jpg), com rig Mixamo e o andar do Tripo
// exportado "no lugar". Depois da dieta: texturas 1024 em WebP + meshopt.
const URL = '/models/character/avatar.glb'

// Animações do Mixamo (in place, sem malha), convertidas de FBX para GLB e
// adaptadas ao avatar pelo retarget. Em anims/ também ficam breathing-idle
// (alternativa ao parado) e, para a estação da academia, fight-idle,
// boxing-1, boxing-2, kick e roundhouse-kick.
const MIXAMO = {
  idle: '/models/character/anims/happy-idle.glb',
  jog: '/models/character/anims/jog.glb', // Jog Forward
  // Nome do arquivo = nome da animação no Mixamo: os modelos ficam 7 dias no
  // cache do navegador (public/_headers), então trocar uma animação é trocar
  // de arquivo, nunca sobrescrever.
} as const
const MIXAMO_URLS = Object.values(MIXAMO)

// O modelo vem com 1 unidade de altura; 1,3 deixa ele com 1,3 m (chibi).
const SCALE = 1.3
// Os pés ficam na base da cápsula, que flutua acima do chão: meia altura
// (0,35) + raio (0,3) + flutuação (0,3) abaixo do centro.
const FEET_Y = -0.95

// Estado do ecctrl → nome da animação. O jogo não tem pulo: os estados de
// pulo só aparecem ao cair de algum degrau, e aí fica parado.
const CLIPS: Record<EcctrlAnimationState, string> = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'jog',
  JUMP_START: 'idle',
  JUMP_IDLE: 'idle',
  JUMP_FALL: 'idle',
  JUMP_LAND: 'idle',
}

// Velocidade de cada animação (1 = original). Os valores casam com as
// velocidades do Player (WALK_SPEED e RUN_SPEED); se o pé patinar, mexa nos
// dois juntos.
const SPEED: Record<string, number> = { walk: 1.25 }

// Quanto abrir os braços nas animações do Mixamo (graus), para não
// atravessarem a barriga do chibi.
const ARM_SPREAD = 22

// Tempo da transição entre uma animação e outra, em segundos.
const FADE = 0.2

export default function Character() {
  const group = useRef<Group>(null)
  const { scene, animations, parser } = useGLTF(URL)
  const mixamo = useGLTF(MIXAMO_URLS)
  const nodes = parser.json.nodes as GltfNode[]
  const clips = useMemo(() => {
    const converted = Object.keys(MIXAMO).map((name, i) =>
      retargetClip(mixamo[i].scene, mixamo[i].animations[0], scene, nodes, name, { armSpread: ARM_SPREAD }),
    )
    return [...animations, ...converted]
  }, [animations, mixamo, scene, nodes])
  const { actions } = useAnimations(clips, group)
  const current = useRef<{ name: string; action: AnimationAction | null } | null>(null)

  // Toda malha do modelo projeta e recebe sombra.
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
  }, [scene])

  // A troca acontece aqui (a cada quadro), lendo a store do ecctrl sem
  // re-renderizar o React.
  useFrame(() => {
    const name = CLIPS[useEcctrlAnimationStore.getState().animationState]
    const playing = current.current
    if (playing?.name === name) return

    // Sem a animação, para tudo e o boneco volta para a pose de descanso
    // (fadeOut só desliga a ação e congela o último quadro).
    const next = actions[name] ?? null
    if (next) {
      next.reset()
      next.setEffectiveTimeScale(SPEED[name] ?? 1)
      next.fadeIn(FADE).play()
      playing?.action?.fadeOut(FADE)
    } else {
      playing?.action?.stop()
    }
    current.current = { name, action: next }
  })

  return (
    <group ref={group} position-y={FEET_Y} scale={SCALE}>
      <primitive object={scene} />
      <JerseyPrint scene={scene} nodes={nodes} name="MADEUS" number="9" />
    </group>
  )
}

useGLTF.preload(URL)
useGLTF.preload(MIXAMO_URLS)
