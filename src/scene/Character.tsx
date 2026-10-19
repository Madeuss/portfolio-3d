import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useEcctrlAnimationStore } from 'ecctrl/animation'
import type { EcctrlAnimationState } from 'ecctrl/animation'
import { LoopOnce, LoopRepeat, MathUtils, Vector3, type AnimationAction, type Group, type Mesh } from 'three'
import { retargetClip, type GltfNode } from './retarget'
import JerseyPrint from './JerseyPrint'
import { useGame } from '../state/game'
import { playPunch } from '../audio/sounds'

// Seu avatar chibi (tarefa 4.x): gerado no Tripo a partir das imagens do
// Gemini (docs/refs/01-avatar-*.jpg), com rig Mixamo e o andar do Tripo
// exportado "no lugar". Depois da dieta: texturas 1024 em WebP + meshopt.
const URL = '/models/character/avatar.glb'

// Animações do Mixamo (in place, sem malha), convertidas de FBX para GLB e
// adaptadas ao avatar pelo retarget. Em anims/ também fica breathing-idle
// (alternativa ao parado).
// Nome do arquivo = nome da animação no Mixamo: os modelos ficam 7 dias no
// cache do navegador (public/_headers), então trocar uma animação é trocar
// de arquivo, nunca sobrescrever.
// `spread`: quanto abrir os braços (graus) para não atravessarem a barriga do
// chibi. Na luta é menor, para o soco ir reto no saco.
const MIXAMO: Record<string, { url: string; spread: number }> = {
  idle: { url: '/models/character/anims/happy-idle.glb', spread: 22 },
  jog: { url: '/models/character/anims/jog.glb', spread: 22 },
  'fight-idle': { url: '/models/character/anims/fight-idle.glb', spread: 8 },
  'boxing-1': { url: '/models/character/anims/boxing-1.glb', spread: 8 },
  'boxing-2': { url: '/models/character/anims/boxing-2.glb', spread: 8 },
  kick: { url: '/models/character/anims/kick.glb', spread: 8 },
  'roundhouse-kick': { url: '/models/character/anims/roundhouse-kick.glb', spread: 8 },
}
const MIXAMO_NAMES = Object.keys(MIXAMO)
const MIXAMO_URLS = MIXAMO_NAMES.map((name) => MIXAMO[name].url)

// Cada E no saco é um golpe só: um pedaço de uma animação do Mixamo, do
// `start` ao `end` (s), com o impacto em `hit` (quando a mão ou o pé chega
// mais à frente; medido no avatar, quadro a quadro). A sequência é um combo
// que se repete (começando de um golpe sorteado): jab, direto, três socos,
// chute e chute rodado. Ficaram de fora os golpes que não alcançam o saco.
type Strike = { clip: string; start: number; hit: number; end: number }
const STRIKES: Strike[] = [
  { clip: 'boxing-1', start: 0.22, hit: 0.5, end: 0.66 },
  { clip: 'boxing-1', start: 0.6, hit: 0.73, end: 0.95 },
  { clip: 'boxing-2', start: 0.18, hit: 0.43, end: 0.58 },
  { clip: 'boxing-2', start: 0.55, hit: 0.67, end: 0.8 },
  { clip: 'boxing-2', start: 0.78, hit: 0.9, end: 1.1 },
  { clip: 'kick', start: 0.85, hit: 1.27, end: 1.6 },
  { clip: 'roundhouse-kick', start: 0.55, hit: 1.1, end: 1.55 },
]
// Golpes um pouco mais rápidos que o original, para ficar com cara de jogo.
const STRIKE_SPEED = 1.4
// Transição entre golpes: curta, para responder na hora.
const STRIKE_FADE = 0.08
// Depois do último golpe, fica na guarda este tempo esperando o próximo E.
const GUARD_TIME = 1.2

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
const TURN_SPEED = 12

type Playing = { name: string; action: AnimationAction | null }
type Fight = { step: number; phase: 'strike' | 'guard'; guard: number; hit: boolean }

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
  const fight = useRef<Fight>({ step: -1, phase: 'guard', guard: 0, hit: false })
  const tmp = useRef({ target: new Vector3(), self: new Vector3() })

  // Toda malha do modelo projeta e recebe sombra.
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
  }, [scene])

  // Troca de animação (a cada quadro, lendo as stores sem re-renderizar).
  // As ações do three.js são objetos mutáveis por natureza (reset, time,
  // play...), por isso as regras de imutabilidade do React ficam de fora aqui.
  /* oxlint-disable react/immutability */
  useFrame((_, delta) => {
    const model = group.current
    const game = useGame.getState()
    const training = game.training

    // Animação em loop (parado, andando, correndo, guarda).
    const loop = (name: string) => {
      const playing = current.current
      if (playing?.name === name) return
      // Sem a animação, para tudo e o boneco volta para a pose de descanso
      // (fadeOut só desliga a ação e congela o último quadro).
      const next = actions[name] ?? null
      if (next) {
        next.reset()
        next.setLoop(LoopRepeat, Infinity)
        next.clampWhenFinished = false
        next.setEffectiveTimeScale(SPEED[name] ?? 1)
        next.fadeIn(FADE).play()
        playing?.action?.fadeOut(FADE)
      } else {
        playing?.action?.stop()
      }
      current.current = { name, action: next }
    }

    // Um golpe: pula para o começo do pedaço e toca até o fim dele.
    const strike = (s: Strike) => {
      const playing = current.current
      const next = actions[s.clip]
      if (!next) return
      if (playing?.action !== next) {
        next.reset()
        next.setLoop(LoopOnce, 1)
        next.clampWhenFinished = true
        next.setEffectiveTimeScale(STRIKE_SPEED)
        next.fadeIn(STRIKE_FADE).play()
        playing?.action?.fadeOut(STRIKE_FADE)
      }
      // Mesmo golpe seguido (ou outro pedaço da mesma animação): só pula.
      next.paused = false
      next.time = s.start
      current.current = { name: `strike:${s.clip}`, action: next }
    }

    // Fora do treino: o estado do ecctrl (parado, andando, correndo).
    if (!training) {
      fight.current.step = -1
      loop(CLIPS[useEcctrlAnimationStore.getState().animationState])
      if (model) model.rotation.y = MathUtils.damp(model.rotation.y, 0, TURN_SPEED, delta)
      return
    }
    if (!model?.parent) return

    // Vira o boneco para o saco. Quem gira é só o desenho: o corpo físico do
    // ecctrl continua para onde estava, e o desenho volta ao normal no fim.
    const { target, self } = tmp.current
    model.parent.getWorldPosition(self)
    target.set(training.target[0], self.y, training.target[1])
    const local = model.parent.worldToLocal(target.clone())
    model.rotation.y = MathUtils.damp(model.rotation.y, Math.atan2(local.x, local.z), TURN_SPEED, delta)

    const f = fight.current
    const s = STRIKES[training.step % STRIKES.length]

    // Golpe novo (primeiro E, ou o próximo emendado).
    if (f.step !== training.step) {
      f.step = training.step
      f.phase = 'strike'
      f.hit = false
      strike(s)
    }

    if (f.phase === 'strike') {
      const time = current.current?.action?.time ?? s.end
      // O impacto: som + saco balançando para longe.
      if (!f.hit && time >= s.hit) {
        f.hit = true
        game.landHit([target.x - self.x, target.z - self.z])
        playPunch()
      }
      if (time < s.end) return
      // Acabou o golpe: emenda o próximo se já foi pedido, senão entra na guarda.
      if (training.queued) {
        game.nextStrike()
        return
      }
      f.phase = 'guard'
      f.guard = 0
      loop('fight-idle')
      return
    }

    // Na guarda: um E emenda o próximo golpe; sem E, volta a andar normal.
    if (training.queued) {
      game.nextStrike()
      return
    }
    f.guard += delta
    if (f.guard >= GUARD_TIME) game.finishTraining()
  })
  /* oxlint-enable react/immutability */

  return (
    <group ref={group} position-y={FEET_Y} scale={SCALE}>
      <primitive object={scene} />
      <JerseyPrint scene={scene} nodes={nodes} name="MADEUS" number="9" />
    </group>
  )
}

useGLTF.preload(URL)
useGLTF.preload(MIXAMO_URLS)
