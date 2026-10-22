import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useEcctrlAnimationStore } from 'ecctrl/animation'
import type { EcctrlAnimationState } from 'ecctrl/animation'
import { LoopOnce, LoopRepeat, MathUtils, Vector3, type AnimationAction, type Group, type Mesh, type Object3D } from 'three'
import { retargetClip, type GltfNode } from './retarget'
import JerseyPrint from './JerseyPrint'
import DizzyStars from './DizzyStars'
import { useGame } from '../state/game'
import { player } from '../state/player'
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
// chibi. Na luta é menor, para o soco ir reto no saco. `inPlace`: trava o
// deslocamento do quadril, para golpes que o Mixamo não oferece "In Place".
const MIXAMO: Record<string, { url: string; spread: number; inPlace?: boolean }> = {
  idle: { url: '/models/character/anims/happy-idle.glb', spread: 22 },
  jog: { url: '/models/character/anims/jog.glb', spread: 22 },
  'fight-idle': { url: '/models/character/anims/fight-idle.glb', spread: 8 },
  'boxing-1': { url: '/models/character/anims/boxing-1.glb', spread: 8 },
  'boxing-2': { url: '/models/character/anims/boxing-2.glb', spread: 8 },
  kick: { url: '/models/character/anims/kick.glb', spread: 8 },
  'roundhouse-kick': { url: '/models/character/anims/roundhouse-kick.glb', spread: 8 },
  hook: { url: '/models/character/anims/hook.glb', spread: 8 },
  'illegal-knee': { url: '/models/character/anims/illegal-knee.glb', spread: 8 },
  'hurricane-kick': { url: '/models/character/anims/hurricane-kick.glb', spread: 8, inPlace: true },
  // Campinho: passe pela grama e os toques da embaixadinha (pé, joelho, cabeça).
  'soccer-pass': { url: '/models/character/anims/soccer-pass.glb', spread: 8 },
  'soccer-kick': { url: '/models/character/anims/soccer-kick.glb', spread: 8 },
  'soccer-knee': { url: '/models/character/anims/soccer-knee.glb', spread: 8 },
  'soccer-header': { url: '/models/character/anims/soccer-header.glb', spread: 8 },
  // Easter egg: bicicleta no meio da embaixadinha.
  'scissor-kick': { url: '/models/character/anims/scissor-kick.glb', spread: 8 },
  // Sentar no sofá e nos bancos: sentando (e, ao contrário, levantando) e sentado.
  'sit-down': { url: '/models/character/anims/sit-down.glb', spread: 22 },
  sitting: { url: '/models/character/anims/sitting.glb', spread: 22 },
  // Rede: de sentado para deitado (Lying Down) e deitado parado (Laying Idle).
  'lie-down': { url: '/models/character/anims/lie-down.glb', spread: 22 },
  lying: { url: '/models/character/anims/lying.glb', spread: 22 },
  // Tonto, depois de 4 hurricane kicks seguidos (regras em state/game.ts).
  'drunk-idle': { url: '/models/character/anims/drunk-idle.glb', spread: 22 },
  'drunk-walk': { url: '/models/character/anims/drunk-walk.glb', spread: 22 },
}
const MIXAMO_NAMES = Object.keys(MIXAMO)
const MIXAMO_URLS = MIXAMO_NAMES.map((name) => MIXAMO[name].url)

// Cada E no saco é um golpe só: um pedaço de uma animação do Mixamo, do
// `start` ao `end` (s), com os impactos em `hits` (quando a mão, o joelho ou
// o pé chega mais à frente; medido no avatar, quadro a quadro). A sequência é
// um combo que se repete (começando de um golpe sorteado): jab, direto, três
// socos, hook, joelhada, chute e chute rodado. Ficaram de fora os golpes que
// não alcançam o saco.
type Strike = { clip: string; start: number; hits: number[]; end: number }
const STRIKES: Strike[] = [
  { clip: 'boxing-1', start: 0.22, hits: [0.5], end: 0.66 },
  { clip: 'boxing-1', start: 0.6, hits: [0.73], end: 0.95 },
  { clip: 'boxing-2', start: 0.18, hits: [0.43], end: 0.58 },
  { clip: 'boxing-2', start: 0.55, hits: [0.67], end: 0.8 },
  { clip: 'boxing-2', start: 0.78, hits: [0.9], end: 1.1 },
  { clip: 'hook', start: 0.9, hits: [1.2], end: 1.45 },
  { clip: 'illegal-knee', start: 0.5, hits: [0.87], end: 1.15 },
  { clip: 'kick', start: 0.85, hits: [1.27], end: 1.6 },
  { clip: 'roundhouse-kick', start: 0.55, hits: [1.1], end: 1.55 },
]
// Golpe secreto (Shift+E, ou A+B no celular): o hurricane kick inteiro, com
// três giros que acertam o saco se ele estiver perto.
const SPECIAL: Strike = { clip: 'hurricane-kick', start: 0, hits: [0.43, 0.9, 1.37], end: 1.75 }
// Passe na bola do campinho: o pé direito encosta nela em 0,5 s.
const PASS: Strike = { clip: 'soccer-pass', start: 0.15, hits: [0.5], end: 1.15 }
// Embaixadinha: cada toque e a altura (centro da bola, m) em que ele pega a
// bola. Toques medidos no avatar: o pé no alto em 0,27 s, o joelho em 0,27 s,
// a cabeça indo à frente em 0,33 s.
type Touch = Strike & { height: number }
const TOUCHES: Record<'foot' | 'knee' | 'head', Touch> = {
  foot: { clip: 'soccer-kick', start: 0.05, hits: [0.27], end: 0.5, height: 0.32 },
  knee: { clip: 'soccer-knee', start: 0.05, hits: [0.27], end: 0.55, height: 0.55 },
  head: { clip: 'soccer-header', start: 0.05, hits: [0.33], end: 0.9, height: 1.15 },
}
const JUGGLE_ORDER = ['foot', 'foot', 'knee', 'foot', 'knee', 'head'] as const
const touchAt = (step: number) => TOUCHES[JUGGLE_ORDER[step % JUGGLE_ORDER.length]]
// A embaixadinha na velocidade original: mais lenta que a luta, dá tempo de ver.
const JUGGLE_SPEED = 1
// Bicicleta: o pé direito passa por cima da cabeça em 0,85 s, a uns 65 cm do
// chão (medido no avatar); a bola sobe até lá e sai para trás.
const BICYCLE: Strike = { clip: 'scissor-kick', start: 0.2, hits: [0.85], end: 2.7 }
const BICYCLE_HEIGHT = 0.72
// Sentar: no sit-down o quadril desce até 1,5 s (e o fim da animação pula de
// volta para de pé, por isso ela para antes). Sentado, o quadril fica a 22 cm
// do chão e 17 cm para trás; o desenho recua e sobe até o assento.
const SIT_START = 0.35
const SIT_END = 1.5
const SIT_SPEED = 1.3
const SIT_HIP = 0.22
const SIT_BACK = 0.17
const SEAT_GAP = 0.32 // distância do corpo físico até a frente do móvel (Player)
const SIT_CUSHION = 0.03 // senta em cima da almofada, não dentro dela
// Sentado, o osso do quadril fica uns 10 cm acima do assento (o bumbum embaixo dele).
const HIP_ABOVE_SEAT = 0.1
// Rede (medido no avatar): o Lying Down começa sentado e termina deitado por
// volta de 5,2 s; deitado, o quadril fica a uns 5 cm da superfície.
// O começo (até 1,1 s) é só ele sentado parado: pula. Na rede, sentar e
// levantar também são mais rápidos (são duas animações seguidas).
const LIE_START = 1.1
const LIE_END = 5.2
const LIE_SPEED = 2.6
const LIE_HIP = 0.09
const HAMMOCK_SIT_SPEED = 2.2
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

// Tonto: parado cambaleia; andando ou "correndo", anda de bêbado.
const DIZZY_CLIPS: Record<EcctrlAnimationState, string> = {
  IDLE: 'drunk-idle',
  WALK: 'drunk-walk',
  RUN: 'drunk-walk',
  JUMP_START: 'drunk-idle',
  JUMP_IDLE: 'drunk-idle',
  JUMP_FALL: 'drunk-idle',
  JUMP_LAND: 'drunk-idle',
}

// Velocidade de cada animação (1 = original). Os valores casam com as
// velocidades do Player (WALK_SPEED e RUN_SPEED); se o pé patinar, mexa nos
// dois juntos.
const SPEED: Record<string, number> = { walk: 1.25 }

// Tempo da transição entre uma animação e outra, em segundos.
const FADE = 0.2
// Rapidez com que o desenho vira para o saco (e volta) durante o treino.
const TURN_SPEED = 12

// Gira o desenho até `to` pelo caminho mais curto. Sem isso, perto de ±180°
// o alvo pula de um lado para o outro e o boneco fica virando sem parar.
function dampAngle(from: number, to: number, delta: number) {
  const diff = Math.atan2(Math.sin(to - from), Math.cos(to - from))
  return from + diff * (1 - Math.exp(-TURN_SPEED * delta))
}

type Playing = { name: string; action: AnimationAction | null }
type Fight = { step: number; phase: 'strike' | 'guard'; guard: number; hits: number; released: boolean }

export default function Character() {
  const group = useRef<Group>(null)
  const { scene, animations, parser } = useGLTF(URL)
  const mixamo = useGLTF(MIXAMO_URLS)
  const nodes = parser.json.nodes as GltfNode[]
  const clips = useMemo(() => {
    const converted = MIXAMO_NAMES.map((name, i) =>
      retargetClip(mixamo[i].scene, mixamo[i].animations[0], scene, nodes, name, {
        armSpread: MIXAMO[name].spread,
        inPlace: MIXAMO[name].inPlace,
      }),
    )
    return [...animations, ...converted]
  }, [animations, mixamo, scene, nodes])
  const { actions } = useAnimations(clips, group)
  const current = useRef<Playing | null>(null)
  const fight = useRef<Fight>({ step: -1, phase: 'guard', guard: 0, hits: 0, released: false })
  const tmp = useRef({ target: new Vector3(), self: new Vector3(), hip: new Vector3(), goal: new Vector3() })
  const footBone = useRef<Object3D | null>(null)
  const hipsBone = useRef<Object3D | null>(null)
  const sitPlace = useRef(new Vector3())

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
    // pé direito no mundo (a bola da bicicleta sai dele)
    footBone.current ??= scene.getObjectByName('mixamorigRightFoot') ?? null
    footBone.current?.getWorldPosition(player.foot)
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
        // (a mesma ação não: o fadeOut venceria o fadeIn e desligaria ela)
        if (playing?.action !== next) playing?.action?.fadeOut(FADE)
      } else {
        playing?.action?.stop()
      }
      current.current = { name, action: next }
    }

    // Um golpe: pula para o começo do pedaço e toca até o fim dele.
    const strike = (s: Strike, speed = STRIKE_SPEED) => {
      const playing = current.current
      const next = actions[s.clip]
      if (!next) return
      if (playing?.action !== next) {
        next.reset()
        next.setLoop(LoopOnce, 1)
        next.clampWhenFinished = true
        next.setEffectiveTimeScale(speed)
        next.fadeIn(STRIKE_FADE).play()
        playing?.action?.fadeOut(STRIKE_FADE)
      }
      // Mesmo golpe seguido (ou outro pedaço da mesma animação): só pula.
      next.paused = false
      next.time = s.start
      current.current = { name: `strike:${s.clip}`, action: next }
    }

    // Sentando, sentado ou levantando: o desenho vira para onde o assento olha
    // e vai até ele (recua e sobe), suave.
    const sitting = game.sitting
    if (sitting && model?.parent) {
      const { seat, phase } = sitting
      const { self, target } = tmp.current
      // Rede: sentado de lado, vai virando para o comprimento enquanto deita
      // (0 sentado, 1 deitado), e o quadril vai da beira para o meio.
      const lieAction = actions['lie-down']
      const lieT = MathUtils.clamp(((lieAction?.time ?? LIE_START) - LIE_START) / (LIE_END - LIE_START), 0, 1)
      const turn = !seat.lie ? 0 : phase === 'lie' ? 1 : phase === 'lie-down' || phase === 'lie-up' ? MathUtils.smoothstep(lieT, 0.05, 0.6) : 0
      const turnBy = seat.lie ? Math.atan2(Math.sin(seat.lie.yaw - seat.yaw), Math.cos(seat.lie.yaw - seat.yaw)) : 0
      const faceYaw = seat.yaw + turnBy * turn
      const edge = seat.edge * (1 - turn)
      const sitSpeed = seat.lie ? HAMMOCK_SIT_SPEED : SIT_SPEED
      model.parent.getWorldPosition(self)
      target.set(self.x + Math.sin(faceYaw), self.y, self.z + Math.cos(faceYaw))
      const local = model.parent.worldToLocal(target.clone())
      const face = Math.atan2(local.x, local.z)
      model.rotation.y = dampAngle(model.rotation.y, face, delta)
      const sit = actions['sit-down']
      // recuo e subida (no espaço do corpo), até onde o quadril senta
      const back = seat.depth + SEAT_GAP - SIT_BACK - edge
      const lift = seat.height - SIT_HIP + SIT_CUSHION
      const progress = MathUtils.clamp(((sit?.time ?? SIT_START) - SIT_START) / (SIT_END - SIT_START), 0, 1)
      const want = phase === 'sit' ? 1 : progress
      model.position.x = -Math.sin(face) * back * want
      model.position.z = -Math.cos(face) * back * want
      model.position.y = FEET_Y + lift * want
      // Já sentado, o desenho é posto de forma que o osso do quadril caia
      // exatamente sobre o assento: mede onde o quadril está em relação ao
      // próprio boneco (fixo na pose sentada) e desconta. Sem acumular: o corpo
      // físico balança na mola do ecctrl e uma correção acumulada disparava.
      const hips = (hipsBone.current ??= scene.getObjectByName('mixamorigHips') ?? null)
      const settled = phase === 'sit' || phase === 'lie-down' || phase === 'lie' || phase === 'lie-up'
      if (settled && hips) {
        const { hip, goal } = tmp.current
        const offset = model.parent.worldToLocal(hips.getWorldPosition(hip)).sub(model.position)
        const above = HIP_ABOVE_SEAT + (LIE_HIP - HIP_ABOVE_SEAT) * turn
        const shift = (seat.lie?.shift ?? 0) * turn
        const ly = seat.lie?.yaw ?? 0
        goal.set(
          seat.center[0] + Math.sin(seat.yaw) * edge + Math.sin(ly) * shift,
          seat.height + above,
          seat.center[1] + Math.cos(seat.yaw) * edge + Math.cos(ly) * shift,
        )
        const place = model.parent.worldToLocal(goal).sub(offset)
        sitPlace.current.lerp(place, sitPlace.current.lengthSq() ? 1 - Math.exp(-12 * delta) : 1)
        model.position.copy(sitPlace.current)
      } else {
        sitPlace.current.copy(model.position)
      }
      if (phase === 'down') {
        if (current.current?.name !== 'sit-down' && sit) {
          sit.reset()
          sit.setLoop(LoopOnce, 1)
          sit.clampWhenFinished = true
          sit.setEffectiveTimeScale(sitSpeed)
          sit.time = SIT_START
          sit.fadeIn(FADE).play()
          if (current.current?.action !== sit) current.current?.action?.fadeOut(FADE)
          current.current = { name: 'sit-down', action: sit }
        }
        if (!sit || sit.time >= SIT_END) {
          game.setSitPhase(seat.lie ? 'lie-down' : 'sit')
          if (!seat.lie) loop('sitting')
        }
      } else if (phase === 'sit') {
        loop('sitting')
      } else if (phase === 'lie-down' || phase === 'lie-up') {
        // deitando (ou, ao contrário, voltando a sentar) na rede
        const lie = actions['lie-down']
        const name = phase === 'lie-down' ? 'lie-down' : 'lie-up'
        if (lie && current.current?.name === 'lie-down' && name === 'lie-up') {
          // E no meio do deitar: volta dali mesmo (é a mesma animação; o
          // fadeOut da "anterior" desligava ela e ele ficava preso)
          lie.paused = false
          lie.setEffectiveTimeScale(-LIE_SPEED)
          current.current = { name, action: lie }
        } else if (lie && current.current?.name !== name) {
          lie.reset()
          lie.setLoop(LoopOnce, 1)
          lie.clampWhenFinished = true
          lie.time = phase === 'lie-down' ? LIE_START : LIE_END
          lie.setEffectiveTimeScale(phase === 'lie-down' ? LIE_SPEED : -LIE_SPEED)
          lie.fadeIn(FADE).play()
          if (current.current?.action !== lie) current.current?.action?.fadeOut(FADE)
          current.current = { name, action: lie }
        }
        if (!lie || (phase === 'lie-down' && lie.time >= LIE_END)) {
          game.setSitPhase('lie')
          loop('lying')
        } else if (phase === 'lie-up' && lie.time <= LIE_START + 0.02) {
          game.setSitPhase('up')
        }
      } else if (phase === 'lie') {
        loop('lying')
      } else if (sit) {
        // levantando: o mesmo sit-down, de trás para a frente
        if (current.current?.name === 'sit-down') {
          // E no meio do sentar: levanta dali mesmo (é a mesma animação; o
          // fadeOut da "anterior" desligava ela e ele ficava preso na frente
          // do assento)
          sit.paused = false
          sit.setEffectiveTimeScale(-sitSpeed)
          current.current = { name: 'stand-up', action: sit }
        } else if (current.current?.name !== 'stand-up') {
          sit.reset()
          sit.setLoop(LoopOnce, 1)
          sit.clampWhenFinished = true
          sit.time = SIT_END
          sit.setEffectiveTimeScale(-sitSpeed)
          sit.fadeIn(FADE).play()
          if (current.current?.action !== sit) current.current?.action?.fadeOut(FADE)
          current.current = { name: 'stand-up', action: sit }
        }
        if (sit.time <= SIT_START + 0.02) {
          model.position.set(0, FEET_Y, 0)
          game.finishSitting()
        }
      } else {
        game.finishSitting()
      }
      return
    }

    // Fora do treino: o estado do ecctrl (parado, andando, correndo).
    if (!training) {
      if (model) model.position.set(0, FEET_Y, 0)
      fight.current.step = -1
      const state = useEcctrlAnimationStore.getState().animationState
      loop((game.dizzy ? DIZZY_CLIPS : CLIPS)[state])
      if (model) model.rotation.y = dampAngle(model.rotation.y, 0, delta)
      return
    }
    if (!model?.parent) return

    // Vira o boneco para o saco (se o golpe for nele). Quem gira é só o
    // desenho: o corpo físico do ecctrl continua para onde estava, e o desenho
    // volta ao normal no fim.
    const { target, self } = tmp.current
    const bag = training.target
    model.parent.getWorldPosition(self)
    if (bag) {
      target.set(bag[0], self.y, bag[1])
      const local = model.parent.worldToLocal(target.clone())
      model.rotation.y = dampAngle(model.rotation.y, Math.atan2(local.x, local.z), delta)
    }

    const f = fight.current
    const juggle = training.juggle
    const bicycle = juggle && training.bicycle
    const s = bicycle ? BICYCLE : juggle ? touchAt(training.step) : training.ball ? PASS : training.special ? SPECIAL : STRIKES[training.step % STRIKES.length]
    const speed = juggle ? JUGGLE_SPEED : STRIKE_SPEED

    // Golpe novo (primeiro E, o próximo emendado, ou o secreto).
    if (f.step !== training.step) {
      f.step = training.step
      f.phase = 'strike'
      f.hits = 0
      strike(s, speed)
      // Primeiro toque da embaixadinha: a bola sai do chão até o pé.
      if (juggle && training.step === 0) {
        f.released = false
        game.juggleTouch(touchAt(0).height, (s.hits[0] - s.start) / speed, false)
      }
      // Bicicleta: a bola sobe até em cima do personagem, onde o pé vai passar.
      if (bicycle && !f.released) {
        const fx = target.x - self.x
        const fz = target.z - self.z
        const len = Math.hypot(fx, fz) || 1
        game.juggleTouch(BICYCLE_HEIGHT, (s.hits[0] - s.start) / speed, false, [self.x + (fx / len) * 0.12, self.z + (fz / len) * 0.12])
      }
    }

    if (f.phase === 'strike') {
      const time = current.current?.action?.time ?? s.end
      // Cada impacto no saco: som + saco balançando para longe.
      while (f.hits < s.hits.length && time >= s.hits[f.hits]) {
        f.hits++
        if (!bag) continue
        if (bicycle) {
          // O pé passou por cima: a bola sai para trás, forte e subindo.
          if (!f.released) {
            f.released = true
            game.juggleTouch(0, 0, true)
            game.kickBall([self.x - target.x, self.z - target.z], true)
          }
          continue
        }
        if (juggle) {
          // Segurando: manda a bola para o próximo toque. Soltou: este é o
          // último, a bola cai na frente.
          if (game.holding && !f.released) {
            const next = touchAt(training.step + 1)
            game.juggleTouch(next.height, (s.end - s.hits[0] + next.hits[0] - next.start) / speed, false)
          } else if (!f.released) {
            f.released = true
            game.juggleTouch(0, 0, true)
          }
          continue
        }
        if (training.ball) {
          game.kickBall([target.x - self.x, target.z - self.z])
          continue
        }
        game.landHit([target.x - self.x, target.z - self.z])
        playPunch()
      }
      if (time < s.end) return
      // Embaixadinha: emenda o próximo toque até a bola ser solta.
      if (juggle && !f.released) {
        game.nextStrike()
        return
      }
      // Passe (ou fim da embaixadinha): um só, sem guarda.
      if (training.ball) {
        game.finishTraining()
        return
      }
      // Fim do golpe secreto: conta o giro (no 4º seguido ele fica tonto e o
      // treino acaba ali); longe do saco, volta a andar.
      if (training.special && game.endSpecial()) return
      if (!bag) {
        game.finishTraining()
        return
      }
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
      <DizzyStars scene={scene} nodes={nodes} />
    </group>
  )
}

useGLTF.preload(URL)
useGLTF.preload(MIXAMO_URLS)
