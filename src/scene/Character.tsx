import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useEcctrlAnimationStore } from 'ecctrl/animation'
import type { EcctrlAnimationState } from 'ecctrl/animation'
import { LoopOnce, LoopRepeat, MathUtils, Vector3, type AnimationAction, type Group, type Mesh } from 'three'
import { retargetClip, type GltfNode } from './retarget'
import JerseyPrint from './JerseyPrint'
import { useGame, type Attack } from '../state/game'
import { playPunch } from '../audio/sounds'

// Seu avatar chibi (tarefa 4.x): gerado no Tripo a partir das imagens do
// Gemini (docs/refs/01-avatar-*.jpg), com rig Mixamo e o andar do Tripo
// exportado "no lugar". Depois da dieta: texturas 1024 em WebP + meshopt.
const URL = '/models/character/avatar.glb'

// Animações do Mixamo (in place, sem malha), convertidas de FBX para GLB e
// adaptadas ao avatar pelo retarget. Em anims/ também ficam breathing-idle
// (alternativa ao parado) e fight-idle.
// Nome do arquivo = nome da animação no Mixamo: os modelos ficam 7 dias no
// cache do navegador (public/_headers), então trocar uma animação é trocar
// de arquivo, nunca sobrescrever.
// `spread`: quanto abrir os braços (graus) para não atravessarem a barriga do
// chibi. Nos golpes é menor, para o soco ir reto no saco.
const MIXAMO: Record<string, { url: string; spread: number }> = {
  idle: { url: '/models/character/anims/happy-idle.glb', spread: 22 },
  jog: { url: '/models/character/anims/jog.glb', spread: 22 },
  'boxing-1': { url: '/models/character/anims/boxing-1.glb', spread: 8 },
  'boxing-2': { url: '/models/character/anims/boxing-2.glb', spread: 8 },
  kick: { url: '/models/character/anims/kick.glb', spread: 8 },
  'roundhouse-kick': { url: '/models/character/anims/roundhouse-kick.glb', spread: 8 },
}
const MIXAMO_NAMES = Object.keys(MIXAMO)
const MIXAMO_URLS = MIXAMO_NAMES.map((name) => MIXAMO[name].url)

// Momentos (s) em que a mão ou o pé chega mais à frente em cada golpe: é
// quando o saco balança e o som toca. Medidos no avatar, quadro a quadro.
const HITS: Record<Attack, number[]> = {
  'boxing-1': [0.5, 0.73, 1.5],
  'boxing-2': [0.43, 0.67, 0.9, 1.37],
  kick: [1.27],
  'roundhouse-kick': [1.1],
}

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

// Tempo da transição entre uma animação e outra, em segundos.
const FADE = 0.2
// Rapidez com que o desenho vira para o saco (e volta) durante o treino.
const TURN_SPEED = 10

type Playing = { name: string; action: AnimationAction | null; hits: number }

export default function Character() {
  const group = useRef<Group>(null)
  const { scene, animations, parser } = useGLTF(URL)
  const mixamo = useGLTF(MIXAMO_URLS)
  const nodes = parser.json.nodes as GltfNode[]
  const clips = useMemo(() => {
    const converted = MIXAMO_NAMES.map((name, i) =>
      retargetClip(mixamo[i].scene, mixamo[i].animations[0], scene, nodes, name, { armSpread: MIXAMO[name].spread }),
    )
    return [...animations, ...converted]
  }, [animations, mixamo, scene, nodes])
  const { actions } = useAnimations(clips, group)
  const current = useRef<Playing | null>(null)
  const tmp = useRef({ target: new Vector3(), self: new Vector3() })

  // Toda malha do modelo projeta e recebe sombra.
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
  }, [scene])

  // Troca de animação (a cada quadro, lendo as stores sem re-renderizar).
  useFrame((_, delta) => {
    const model = group.current
    const game = useGame.getState()
    const training = game.training

    const play = (name: string, once: boolean) => {
      const playing = current.current
      if (playing?.name === name) return
      // Sem a animação, para tudo e o boneco volta para a pose de descanso
      // (fadeOut só desliga a ação e congela o último quadro).
      // As ações do three.js são objetos mutáveis por natureza (reset, play...).
      // oxlint-disable-next-line react/immutability
      const next = actions[name] ?? null
      if (next) {
        next.reset()
        next.setLoop(once ? LoopOnce : LoopRepeat, Infinity)
        // A AnimationAction do three.js é configurada por atribuição mesmo.
        // oxlint-disable-next-line react/immutability
        next.clampWhenFinished = once
        next.setEffectiveTimeScale(SPEED[name] ?? 1)
        next.fadeIn(FADE).play()
        playing?.action?.fadeOut(FADE)
      } else {
        playing?.action?.stop()
      }
      current.current = { name, action: next, hits: 0 }
    }

    // Fora do treino: o estado do ecctrl (parado, andando, correndo).
    if (!training) {
      play(CLIPS[useEcctrlAnimationStore.getState().animationState], false)
      if (model) model.rotation.y = MathUtils.damp(model.rotation.y, 0, TURN_SPEED, delta)
      return
    }

    // No treino: o golpe sorteado.
    play(training.attack, true)
    const playing = current.current!
    if (!model?.parent) return

    // Vira o boneco para o saco. Quem gira é só o desenho: o corpo físico do
    // ecctrl continua para onde estava, e o desenho volta ao normal no fim.
    const { target, self } = tmp.current
    model.parent.getWorldPosition(self)
    target.set(training.target[0], self.y, training.target[1])
    const local = model.parent.worldToLocal(target.clone())
    model.rotation.y = MathUtils.damp(model.rotation.y, Math.atan2(local.x, local.z), TURN_SPEED, delta)

    const action = playing.action
    if (!action) {
      game.finishTraining()
      return
    }
    // Cada golpe que chega no saco: som + saco balançando para longe.
    const hits = HITS[training.attack]
    while (playing.hits < hits.length && action.time >= hits[playing.hits]) {
      playing.hits++
      game.landHit([target.x - self.x, target.z - self.z])
      playPunch()
    }
    // Termina um pouco antes do fim para o "parado" entrar suave.
    if (action.time >= action.getClip().duration - FADE) game.finishTraining()
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
