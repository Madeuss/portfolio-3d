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
import { playBark } from '../audio/sounds'
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
// folga em volta de cada obstáculo (ele tem 26 cm de largura e 55 de
// comprimento): mais que isso fechava passagens e ele ficava preso num pedaço
// do quintal
const MARGIN = 0.25
// Com o personagem parado perto, olha para ele por isso e volta a passear.
const LOOK_S = 4
// Não chega mais perto que isso do personagem (do centro dele ao da cápsula):
// ele é cinemático e empurrava o personagem por aí, até para cima da mureta.
// No caminho, contorna virando um pouco para um lado ou para o outro.
const PERSONAL = 0.6
const DODGE = [0, 0.7, -0.7, 1.4, -1.4]
// Passeio: o quintal vira uma grade de quadradinhos de 25 cm (livre ou não)
// e o caminho é achado nela, andando nas 8 direções. (Com 40, as passagens
// estreitas sumiam.)
const CELL = 0.25
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
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
  const state = useRef({
    x: start[0],
    z: start[1],
    yaw: 0,
    path: [] as [number, number][],
    // para onde o caminho atual leva (na bolinha, refeito se o alvo muda) e
    // se já está no mais perto que dá de lá
    goal: [start[0], start[1]] as [number, number],
    stuck: false,
    wait: 1,
    walk: 0,
    run: 0,
    look: 0,
  })
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
    // um teste a cada meio quadradinho (com poucos, a reta pulava obstáculos)
    const steps = Math.ceil(Math.hypot(tx - x0, tz - z0) / (CELL / 2))
    for (let k = 1; k <= steps && !escaping; k++) {
      const u = k / steps
      if (blocked(x0 + (tx - x0) * u, z0 + (tz - z0) * u, avoid)) return false
    }
    return true
  }

  // Mapa do quintal em quadradinhos de CELL: livre ou não (casa, campo,
  // árvores...). O passeio usa ele para achar caminho desviando das coisas.
  const grid = useMemo(() => {
    const n = Math.ceil((half * 2) / CELL)
    const free = new Uint8Array(n * n)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) free[i * n + j] = blocked(-half + (i + 0.5) * CELL, -half + (j + 0.5) * CELL, avoid) ? 0 : 1
    return { n, free }
  }, [half, avoid])
  const toCell = (v: number) => Math.min(grid.n - 1, Math.max(0, Math.floor((v + half) / CELL)))
  const center = (i: number) => -half + (i + 0.5) * CELL

  // Busca em largura pelos quadradinhos livres, de onde ele está: `from`
  // guarda de onde se chega em cada um; `order`, os alcançados, em ordem.
  const search = () => {
    const s = state.current
    const { n, free } = grid
    const start = toCell(s.x) * n + toCell(s.z)
    const from = new Int32Array(n * n).fill(-1)
    from[start] = start
    const order = [start]
    const around = (c: number, visit: (k: number) => boolean | void) => {
      const i = Math.floor(c / n)
      const j = c % n
      for (const [di, dj] of STEPS) {
        const a = i + di
        const b = j + dj
        if (a >= 0 && b >= 0 && a < n && b < n && visit(a * n + b)) return
      }
    }
    // Parado na beira de uma área proibida (o quadradinho dele não é livre):
    // sai pelo livre mais perto. Andar pelas proibidas até sair deixava ele
    // emendar uma na outra e atravessar tudo, até a casa.
    if (!free[start]) {
      const seen = new Uint8Array(n * n)
      seen[start] = 1
      const q = [start]
      let exit = -1
      for (let h = 0; h < q.length && exit < 0; h++)
        around(q[h], (k) => {
          if (seen[k]) return
          seen[k] = 1
          if (free[k]) return (exit = k) >= 0
          q.push(k)
        })
      if (exit >= 0) {
        from[exit] = start
        order.push(exit)
      }
    }
    // daí em diante, só por quadradinhos livres
    for (let q = 0; q < order.length; q++) {
      const c = order[q]
      if (!free[c]) continue
      around(c, (k) => {
        if (from[k] !== -1 || !free[k]) return
        from[k] = c
        order.push(k)
      })
    }
    return { from, order, start }
  }

  // O caminho até o quadradinho `c`, pulando os pontos do meio quando a reta
  // entre eles está livre.
  const pathTo = (c: number, { from, start }: ReturnType<typeof search>) => {
    const s = state.current
    const n = grid.n
    const cells: [number, number][] = []
    while (c !== start) {
      cells.push([center(Math.floor(c / n)), center(c % n)])
      c = from[c]
    }
    cells.reverse()
    // corta caminho: segue em reta enquanto dá e só vira onde precisa
    const path: [number, number][] = []
    let px = s.x
    let pz = s.z
    for (let k = 0; k < cells.length - 1; k++) {
      if (freePath(px, pz, cells[k + 1][0], cells[k + 1][1], false)) continue
      path.push(cells[k])
      ;[px, pz] = cells[k]
    }
    if (cells.length) path.push(cells[cells.length - 1])
    return path
  }

  // Próximo passeio: sorteia um destino alcançável a mais de 2 m.
  const pickTarget = () => {
    const s = state.current
    const found = search()
    const reach = found.order.filter((c) => grid.free[c] && Math.hypot(center(Math.floor(c / grid.n)) - s.x, center(c % grid.n) - s.z) > 2)
    if (!reach.length) {
      s.wait = 0.4
      return
    }
    s.path = pathTo(reach[Math.floor(Math.random() * reach.length)], found)
  }

  // Caminho até (tx, tz), ou até o ponto livre mais perto dele (o personagem
  // pode estar no campinho, onde ele não entra).
  const route = (tx: number, tz: number) => {
    const s = state.current
    const found = search()
    // (só vale ir para outro quadradinho se ele chega bem mais perto: na beira
    // da mureta, ia e voltava entre dois e nunca soltava a bola)
    let best = found.start
    let bestD = Math.hypot(s.x - tx, s.z - tz) - CELL
    for (const c of found.order) {
      if (!grid.free[c]) continue
      const d = Math.hypot(center(Math.floor(c / grid.n)) - tx, center(c % grid.n) - tz)
      if (d < bestD) {
        best = c
        bestD = d
      }
    }
    s.path = pathTo(best, found)
    s.goal = [tx, tz]
    s.stuck = !s.path.length
  }

  // Arremesso: um ponto livre a 3–5 m do personagem, de preferência para o
  // lado de onde ele está andando (senão, para longe do cachorro).
  const throwBall = (now: number) => {
    const f = fetch.current
    const p = player.pos
    const v = player.vel
    const base = Math.hypot(v.x, v.z) > 0.3 ? Math.atan2(v.x, v.z) : Math.atan2(p.x - state.current.x, p.z - state.current.z)
    // só onde ele consegue chegar andando (senão ele ia até o mais perto e a
    // bola aparecia na boca dele de longe)
    const { from } = search()
    for (let i = 0; i < 40; i++) {
      const a = base + (Math.random() - 0.5) * (i < 20 ? 1.2 : Math.PI * 2)
      const d = THROW_MIN + Math.random() * (THROW_MAX - THROW_MIN)
      const tx = p.x + Math.sin(a) * d
      const tz = p.z + Math.cos(a) * d
      if (!freePath(p.x, p.z, tx, tz, true) || from[toCell(tx) * grid.n + toCell(tz)] === -1) continue
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
    if (toPlayer > NOTICE + 0.5) s.look = 0 // longe de novo: na próxima, olha outra vez
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
      const dir = Math.atan2(dx, dz)
      wantYaw = dir
      for (const turn of DODGE) {
        const nx = s.x + Math.sin(dir + turn) * step
        const nz = s.z + Math.cos(dir + turn) * step
        const near = Math.hypot(nx - player.pos.x, nz - player.pos.z)
        if ((near < PERSONAL && near < toPlayer) || (turn !== 0 && blocked(nx, nz, avoid))) continue
        s.x = nx
        s.z = nz
        wantYaw = dir + turn
        moving = true
        break
      }
      return false
    }

    // corre até (tx, tz) sem atravessar nada: em reta quando ela está livre
    // (ou já pertinho: a bola na beira de algo); senão, pelo mapa. Devolve
    // true ao chegar. Sem como chegar mais perto, espera olhando para lá.
    const runTo = (tx: number, tz: number, speed: number, stopAt: number) => {
      const d = Math.hypot(tx - s.x, tz - s.z)
      if (d < stopAt) return true
      if (d < CELL * 2 || freePath(s.x, s.z, tx, tz, false)) {
        s.path = []
        s.stuck = false
        return walkTo(tx, tz, speed, stopAt)
      }
      if (Math.hypot(s.goal[0] - tx, s.goal[1] - tz) > 0.6 || (!s.path.length && !s.stuck)) route(tx, tz)
      if (!s.path.length) {
        wantYaw = Math.atan2(tx - s.x, tz - s.z)
        return false
      }
      if (walkTo(s.path[0][0], s.path[0][1], speed, 0.15)) s.path.shift()
      return false
    }

    if (f.mode === 'wait') {
      // olha a bola voando e sai correndo quando ela cai
      wantYaw = Math.atan2(f.to.x - s.x, f.to.z - s.z)
      if (!f.flying) {
        // a bola caiu: late e sai correndo
        f.mode = 'chase'
        s.path = []
        s.stuck = false
        playBark()
      }
    } else if (f.mode === 'chase') {
      if (runTo(f.to.x, f.to.z, RUN, 0.3)) {
        f.inMouth = true
        f.mode = 'return'
        s.path = []
        s.stuck = false
      }
    } else if (f.mode === 'return') {
      // (com o personagem onde ele não chega, como colado na mureta, solta no
      // mais perto que dá se estiver perto; longe, espera com a bola na boca)
      if (runTo(player.pos.x, player.pos.z, RUN * 0.8, 0.75) || (s.stuck && toPlayer < 1.8)) {
        // solta aos pés do personagem
        f.inMouth = false
        f.rest.set(s.x + Math.sin(s.yaw) * 0.35, BALL_R, s.z + Math.cos(s.yaw) * 0.35)
        f.mode = 'wander'
        playBark() // soltou aos pés: "joga de novo!"
        s.wait = 1.5 + Math.random() * 1.5
      }
    } else if (toPlayer < NOTICE && (s.look < LOOK_S || Math.hypot(player.vel.x, player.vel.z) > 0.3)) {
      // Olha para o personagem (colado nele, a direção não serve: ficava
      // girando). Com ele parado, depois de LOOK_S volta a passear.
      s.look += dt
      if (toPlayer > 0.35) wantYaw = Math.atan2(player.pos.x - s.x, player.pos.z - s.z)
    } else if (s.wait > 0) {
      s.wait -= dt
      if (s.wait <= 0) pickTarget()
    } else if (s.path.length) {
      // segue o caminho, ponto a ponto; no fim, para um pouco
      if (walkTo(s.path[0][0], s.path[0][1], SPEED, 0.15)) {
        s.path.shift()
        if (!s.path.length) s.wait = 1 + Math.random() * 2
      }
    } else {
      s.wait = 0.4
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
