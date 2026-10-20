import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { AnimationMixer, MathUtils, Matrix4, Vector3, type Bone, type Group, type Mesh } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useI18n } from '../i18n'
import { useIsTouch } from '../state/device'
import { isPlaying, useGame } from '../state/game'
import { dog, player } from '../state/player'
import type { Area } from './Grass'

// O shih tzu do Mat (item 39), solto pelo terreno, com o rig e a animação de
// andar do Tripo (a única que ele tem para quadrúpedes): ela acelera quando ele
// corre e some quando ele para (fica a pose em pé, respirando). Ele passeia
// entre pontos sorteados, para um pouco em cada um e, se o personagem chega
// perto, para e olha para ele.
// Bolinha (item 9): perto dele, "E Jogar a bolinha". A bola sai das mãos do
// personagem num arco até um ponto livre; ele corre, pega com a boca, volta e
// solta aos pés do personagem.

const URL = '/models/dog/shihtzu.glb'
// O modelo tem 1 unidade de comprimento e olha para −x (girado 90° para olhar
// para +z, como o resto): 0,55 m de focinho a rabo.
const SCALE = 0.55
const MODEL_YAW = Math.PI / 2
const SPEED = 0.9
const RUN = 2.6 // correndo atrás da bola
const TURN = 6
// Perto assim do personagem, ele para e fica olhando.
const NOTICE = 1.4
const MARGIN = 0.6
// Bolinha: alcance do arremesso, duração do voo e onde ela fica na boca.
const THROW_MIN = 3
const THROW_MAX = 5
const FLIGHT_S = 0.9
// Boca no espaço do modelo (medida: a ponta do focinho fica em x −0,5, y 0,62;
// a boca, logo abaixo e atrás) e o osso da cabeça, que ela acompanha.
const MOUTH = new Vector3(-0.52, 0.57, -0.035)
const HEAD_BONE = 'tripoHead_2'
const BALL_R = 0.045

type Props = {
  start: [number, number]
  /** Meia-largura da área onde ele passeia. */
  half: number
  /** Retângulos onde ele não entra (casa, campo, lago...). */
  avoid: Area[]
}

const blocked = (x: number, z: number, avoid: Area[]) =>
  avoid.some((a) => x > a.x[0] - MARGIN && x < a.x[1] + MARGIN && z > a.z[0] - MARGIN && z < a.z[1] + MARGIN)

type Mode = 'wander' | 'wait' | 'chase' | 'return'

export default function Dog({ start, half, avoid }: Props) {
  const { scene, animations } = useGLTF(URL)
  // clone com esqueleto próprio (o clone simples dividiria os ossos)
  const model = useMemo(() => {
    const c = cloneSkinned(scene)
    c.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = o.receiveShadow = true
        o.frustumCulled = false // a malha anda com os ossos: a caixa original não serve
      }
    })
    // a boca no espaço do osso da cabeça (na pose parada): a cada quadro, a
    // bola vai para esse ponto do osso, então segue a cabeça na animação
    c.updateMatrixWorld(true)
    const head = c.getObjectByName(HEAD_BONE) as Bone | undefined
    const mouth = head ? MOUTH.clone().applyMatrix4(new Matrix4().copy(head.matrixWorld).invert()) : null
    return Object.assign(c, { head, mouth })
  }, [scene])
  const walkAnim = useMemo(() => {
    const mixer = new AnimationMixer(model)
    const action = mixer.clipAction(animations[0])
    action.play()
    action.setEffectiveWeight(0)
    return { mixer, action }
  }, [model, animations])
  const body = useRef<RapierRigidBody>(null)
  const look = useRef<Group>(null)
  const ballRef = useRef<Group>(null)
  const state = useRef({ x: start[0], z: start[1], yaw: 0, tx: start[0], tz: start[1], wait: 1, walk: 0, run: 0 })
  // A bolinha: no chão (rest), voando (do ponto `from` até `to`) ou na boca.
  const fetch = useRef({
    mode: 'wander' as Mode,
    seen: useGame.getState().fetch,
    from: new Vector3(),
    to: new Vector3(),
    t0: 0,
    inMouth: false,
    flying: false,
    rest: new Vector3(start[0] + 0.5, BALL_R, start[1] + 0.4),
    near: false,
  })
  const enter = useGame((s) => s.enter)
  const leave = useGame((s) => s.leave)
  const showPrompt = useGame((s) => s.nearby === 'dog' && isPlaying(s))
  const t = useI18n((s) => s.t)
  const key = useIsTouch() ? 'A' : 'E'
  const tmp = useMemo(() => new Vector3(), [])

  const freePath = (x0: number, z0: number, tx: number, tz: number, escaping: boolean) => {
    if (Math.abs(tx) > half || Math.abs(tz) > half || blocked(tx, tz, avoid)) return false
    for (let k = 1; k <= 12 && !escaping; k++) {
      const u = k / 12
      if (blocked(x0 + (tx - x0) * u, z0 + (tz - z0) * u, avoid)) return false
    }
    return true
  }

  // Próximo ponto: sorteado na área livre, com o caminho reto até ele também livre.
  // Se ele já está numa área proibida (nasceu ou foi empurrado para lá), só o
  // destino precisa ser livre: senão nenhum caminho passa e ele trava ali.
  const pickTarget = () => {
    const s = state.current
    const escaping = blocked(s.x, s.z, avoid)
    for (let i = 0; i < 30; i++) {
      const tx = (Math.random() * 2 - 1) * half
      const tz = (Math.random() * 2 - 1) * half
      if (Math.hypot(tx - s.x, tz - s.z) < 2) continue
      if (!freePath(s.x, s.z, tx, tz, escaping)) continue
      s.tx = tx
      s.tz = tz
      return
    }
  }

  // Arremesso: um ponto livre a 3–5 m do personagem, de preferência para o
  // lado de onde ele está andando (senão, para longe do cachorro).
  const throwBall = (now: number) => {
    const f = fetch.current
    const p = player.pos
    const v = player.vel
    const base = Math.hypot(v.x, v.z) > 0.3 ? Math.atan2(v.x, v.z) : Math.atan2(p.x - state.current.x, p.z - state.current.z)
    for (let i = 0; i < 40; i++) {
      const a = base + (Math.random() - 0.5) * (i < 20 ? 1.2 : Math.PI * 2)
      const d = THROW_MIN + Math.random() * (THROW_MAX - THROW_MIN)
      const tx = p.x + Math.sin(a) * d
      const tz = p.z + Math.cos(a) * d
      if (!freePath(p.x, p.z, tx, tz, true)) continue
      f.from.set(p.x, 1, p.z)
      f.to.set(tx, BALL_R, tz)
      f.t0 = now
      f.flying = true
      f.inMouth = false
      f.mode = 'wait'
      return
    }
  }

  useFrame(({ clock }, delta) => {
    const s = state.current
    const f = fetch.current
    const b = body.current
    if (!b || !look.current) return
    const now = clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    const toPlayer = Math.hypot(player.pos.x - s.x, player.pos.z - s.z)
    let moving = false
    let wantYaw = s.yaw

    // Zona do "E Jogar a bolinha": perto dele e com ele livre (sem bola no ar).
    const near = toPlayer < NOTICE && f.mode === 'wander'
    if (near !== f.near) {
      f.near = near
      if (near) enter('dog', [s.x, s.z])
      else leave('dog')
    }
    const game = useGame.getState()
    if (game.fetch !== f.seen) {
      f.seen = game.fetch
      if (f.mode === 'wander') throwBall(now)
    }

    // anda até (tx, tz) na velocidade dada; devolve true ao chegar
    const walkTo = (tx: number, tz: number, speed: number, stopAt = 0.1) => {
      const dx = tx - s.x
      const dz = tz - s.z
      const d = Math.hypot(dx, dz)
      if (d < stopAt) return true
      const step = Math.min(d - stopAt * 0.5, speed * dt)
      s.x += (dx / d) * step
      s.z += (dz / d) * step
      wantYaw = Math.atan2(dx, dz)
      moving = true
      return false
    }

    if (f.mode === 'wait') {
      // olha a bola voando e sai correndo quando ela cai
      wantYaw = Math.atan2(f.to.x - s.x, f.to.z - s.z)
      if (!f.flying) f.mode = 'chase'
    } else if (f.mode === 'chase') {
      if (walkTo(f.to.x, f.to.z, RUN, 0.3)) {
        f.inMouth = true
        f.mode = 'return'
      }
    } else if (f.mode === 'return') {
      if (walkTo(player.pos.x, player.pos.z, RUN * 0.8, 0.75)) {
        // solta aos pés do personagem
        f.inMouth = false
        f.rest.set(s.x + Math.sin(s.yaw) * 0.35, BALL_R, s.z + Math.cos(s.yaw) * 0.35)
        f.mode = 'wander'
        s.wait = 2 + Math.random() * 2
      }
    } else if (toPlayer < NOTICE) {
      // Olha para o personagem (colado nele, a direção não serve: ficava girando).
      if (toPlayer > 0.35) wantYaw = Math.atan2(player.pos.x - s.x, player.pos.z - s.z)
    } else if (s.wait > 0) {
      s.wait -= dt
      if (s.wait <= 0) pickTarget()
    } else if (walkTo(s.tx, s.tz, SPEED)) {
      s.wait = 1.5 + Math.random() * 3
    }

    // Vira pelo caminho mais curto.
    let diff = wantYaw - s.yaw
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    s.yaw += diff * (1 - Math.exp(-TURN * 1.5 * dt))
    s.walk = MathUtils.damp(s.walk, moving ? 1 : 0, 8, dt)
    s.run = MathUtils.damp(s.run, moving && f.mode !== 'wander' ? 1 : 0, 6, dt)

    b.setNextKinematicTranslation({ x: s.x, y: 0, z: s.z })
    b.setNextKinematicRotation({ x: 0, y: Math.sin(s.yaw / 2), z: 0, w: Math.cos(s.yaw / 2) })
    dog.pos.set(s.x, 0, s.z)

    // Andar: a animação do Tripo, mais rápida correndo; parado, respiração.
    const g = look.current
    walkAnim.action.setEffectiveWeight(s.walk)
    walkAnim.action.setEffectiveTimeScale(1.3 + s.run * 1.6)
    walkAnim.mixer.update(dt)
    g.position.y = Math.abs(Math.sin(now * 14)) * 0.02 * s.run
    g.rotation.x = -s.run * 0.05
    g.scale.y = 1 + Math.sin(now * 3) * 0.015 * (1 - s.walk)

    // A bolinha: voando num arco, na boca ou parada no chão.
    const ballObj = ballRef.current
    if (!ballObj) return
    if (f.flying) {
      const u = Math.min(1, (now - f.t0) / FLIGHT_S)
      tmp.lerpVectors(f.from, f.to, u)
      tmp.y += Math.sin(u * Math.PI) * 1.4
      ballObj.position.copy(tmp)
      if (u >= 1) {
        f.flying = false
        f.rest.copy(f.to)
      }
    } else if (f.inMouth) {
      const { head, mouth } = model
      if (head && mouth) {
        head.updateWorldMatrix(true, false)
        ballObj.position.copy(mouth).applyMatrix4(head.matrixWorld)
      }
    } else {
      ballObj.position.copy(f.rest)
    }
  })

  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[start[0], 0, start[1]]}>
        {/* 1 m de altura, bem mais que ele: a cápsula do personagem flutua
            30 cm e subia em cima de colisões baixas (como nos bancos) */}
        <CuboidCollider args={[0.13, 0.5, 0.27]} position={[0, 0.5, 0]} />
        <group ref={look}>
          <primitive object={model} scale={SCALE} rotation-y={MODEL_YAW} />
        </group>
        <Html position={[0, 1, 0]} center zIndexRange={[10, 0]}>
          <div className={`prompt${showPrompt ? ' prompt--visible' : ''}`} aria-hidden={!showPrompt}>
            <kbd>{key}</kbd>
            {t.dog}
          </div>
        </Html>
      </RigidBody>
      {/* bolinha de tênis */}
      <group ref={ballRef}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_R, 16, 12]} />
          <meshStandardMaterial color="#c8e03a" roughness={0.9} />
        </mesh>
      </group>
    </>
  )
}


useGLTF.preload(URL)
