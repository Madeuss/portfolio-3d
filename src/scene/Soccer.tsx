import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BallCollider, CuboidCollider, RigidBody, interactionGroups, type RapierCollider, type RapierRigidBody } from '@react-three/rapier'
import { CanvasTexture, Color, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, Object3D, SRGBColorSpace, Vector3, type Group, type InstancedMesh } from 'three'
import { useI18n } from '../i18n'
import { useIsTouch } from '../state/device'
import { isPlaying, useGame } from '../state/game'
import { PLAYER_GROUP, ball as ballState, player } from '../state/player'
import { play } from '../audio/sounds'

// Mini campo de futebol: a bola é conduzida encostando nela, chutada com E e
// fica presa no campo (só ela: o personagem entra e sai livre). Gol = a bola
// passou inteira da linha entre as traves: comemoração, placar e a bola volta
// para o meio.

const FIELD = { center: [4.3, 2.2] as const, half: [2.6, 1.7] as const }
const LINE = 0.06

// Golzinho: meia-largura, altura e fundo (m).
const GOAL = { w: 0.6, h: 0.7, d: 0.45 }
const POST = 0.035

const BALL_R = 0.2
// Distância (centro a centro) em que aparece o "E Chutar".
const NEAR = 0.95
// Condução: encostou andando, a bola vai na frente um pouco mais rápido.
const DRIBBLE_REACH = 0.3 + BALL_R + 0.08 // raio da cápsula + bola + folga
const DRIBBLE_BOOST = 1.3
// Chute: velocidade de saída (m/s) e um pouco para cima.
const KICK_SPEED = 7
const KICK_LIFT = 1.4
// Bicicleta: sai para trás, mais forte e mais alta que o passe.
const BICYCLE_SPEED = 6.5
const BICYCLE_LIFT = 2.6
// Quique nas linhas do campo (bola presa) e na rede, que amortece.
const BOUNCE = 0.6
const NET_BOUNCE = 0.2
// Depois do gol, a bola volta para o meio em RESET_MS.
const RESET_MS = 2200
// Fim da embaixadinha: a bola cai um pouco à frente.
const DROP_FORWARD = 1.4
const DROP_UP = 2.6
const GRAVITY = 9.8

// ---- Campo e gols (desenho) ---------------------------------------------------

function netTexture() {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  g.strokeStyle = 'rgba(255,255,255,0.9)'
  g.lineWidth = 3
  for (let i = 0; i <= s; i += 16) {
    g.beginPath()
    g.moveTo(i, 0)
    g.lineTo(i, s)
    g.moveTo(0, i)
    g.lineTo(s, i)
    g.stroke()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// Grupos de colisão: o corpo do gol (rede) é sólido para o personagem, mas a
// bola não o enxerga (ela entra no gol e quem a segura na rede é o código).
const GOAL_GROUP = 2
const GOAL_SOLID = interactionGroups(GOAL_GROUP)
const ALL_GROUPS = Array.from({ length: 16 }, (_, i) => i)
const BALL_GROUPS = interactionGroups(1, ALL_GROUPS.filter((g) => g !== GOAL_GROUP))
// Logo depois da bicicleta a bola também ignora o personagem (sai do pé dele,
// que está em cima do corpo).
const BALL_GHOST = interactionGroups(1, ALL_GROUPS.filter((g) => g !== GOAL_GROUP && g !== PLAYER_GROUP))
const GHOST_MS = 500

// Golzinho: traves e travessão brancos e a rede quadriculada. As traves batem
// em tudo; o volume da rede só segura o personagem.
function Goal({ x, facing }: { x: number; facing: 1 | -1 }) {
  const { w, h, d } = GOAL
  const net = useMemo(netTexture, [])
  const netMat = <meshBasicMaterial map={net} transparent alphaTest={0.3} side={DoubleSide} />
  return (
    <group position={[x, 0, 0]} rotation-y={facing === 1 ? 0 : Math.PI}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[d / 2, h / 2, w]} position={[-d / 2, h / 2, 0]} collisionGroups={GOAL_SOLID} />
        {[-w, w].map((z) => (
          <group key={z}>
            <CuboidCollider args={[POST, h / 2, POST]} position={[0, h / 2, z]} />
            <mesh position={[0, h / 2, z]} castShadow>
              <cylinderGeometry args={[POST, POST, h, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </RigidBody>
      <mesh position={[0, h, 0]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[POST, POST, w * 2, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* rede: fundo, laterais e teto */}
      <mesh position={[-d, h / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[w * 2, h]} />
        {netMat}
      </mesh>
      {[-w, w].map((z) => (
        <mesh key={z} position={[-d / 2, h / 2, z]}>
          <planeGeometry args={[d, h]} />
          {netMat}
        </mesh>
      ))}
      <mesh position={[-d / 2, h, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[d, w * 2]} />
        {netMat}
      </mesh>
    </group>
  )
}

// Gramado de estádio (como o da Neo Química Arena): verde escuro em faixas de
// corte alternadas, uma mais clara e outra mais escura, ao longo do campo.
const TURF = ['#1f5e26', '#2a7230']
const STRIPES = 10

function turfTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 64
  const g = c.getContext('2d')!
  const w = c.width / STRIPES
  for (let i = 0; i < STRIPES; i++) {
    g.fillStyle = TURF[i % 2]
    g.fillRect(i * w, 0, w, c.height)
  }
  // fiapos de grama para não ficar chapado
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 1, 2)
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

function Pitch() {
  const [hx, hz] = FIELD.half
  const turf = useMemo(turfTexture, [])
  const lines: [number, number, number, number][] = [
    // [x, z, largura, comprimento]
    [0, -hz, hx * 2, LINE],
    [0, hz, hx * 2, LINE],
    [-hx, 0, LINE, hz * 2],
    [hx, 0, LINE, hz * 2],
    [0, 0, LINE, hz * 2],
  ]
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={0.006} receiveShadow>
        <planeGeometry args={[hx * 2 + 0.4, hz * 2 + 0.4]} />
        <meshStandardMaterial map={turf} roughness={0.9} />
      </mesh>
      {lines.map(([x, z, w, l], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.008, z]}>
          <planeGeometry args={[w, l]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={0.008}>
        <ringGeometry args={[0.6 - LINE, 0.6, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Goal x={-hx} facing={1} />
      <Goal x={hx} facing={-1} />
    </>
  )
}

// ---- Placar -------------------------------------------------------------------

function drawScore(canvas: HTMLCanvasElement, label: string, goals: number) {
  const g = canvas.getContext('2d')!
  g.fillStyle = '#1d1d21'
  g.fillRect(0, 0, canvas.width, canvas.height)
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '700 34px Archivo, sans-serif'
  g.fillText(label, canvas.width / 2, 40)
  g.fillStyle = '#f08c00'
  g.font = '800 72px Archivo, sans-serif'
  g.fillText(String(goals), canvas.width / 2, 108)
}

// Placa de madeira na lateral do campo com os gols da visita.
function Scoreboard({ position }: { position: [number, number, number] }) {
  const label = useI18n((s) => s.t.soccer.score)
  const goals = useGame((s) => s.goals)
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 150
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return t
  }, [])
  useLayoutEffect(() => {
    drawScore(texture.image as HTMLCanvasElement, label, goals)
    texture.needsUpdate = true
  }, [texture, label, goals])

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      {/* sólida: postes e a placa */}
      <CuboidCollider args={[0.36, 0.45, 0.06]} position-y={0.45} />
      <CuboidCollider args={[0.41, 0.25, 0.04]} position-y={0.85} />
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
          <meshStandardMaterial color="#8a5a2b" />
        </mesh>
      ))}
      <mesh position-y={0.85} castShadow>
        <boxGeometry args={[0.82, 0.5, 0.05]} />
        <meshStandardMaterial color="#b98552" />
      </mesh>
      <mesh position={[0, 0.85, 0.027]}>
        <planeGeometry args={[0.72, 0.42]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </RigidBody>
  )
}

// ---- Confete ------------------------------------------------------------------

const CONFETTI = 140
const CONFETTI_LIFE = 2.6
const CONFETTI_COLORS = ['#0A3FB8', '#f08c00', '#ffffff', '#ffd43b', '#2f9e44']

// Chuva de papeizinhos saindo do gol a cada gol (um InstancedMesh só).
function Confetti() {
  const ref = useRef<InstancedMesh>(null)
  const goal = useGame((s) => s.goal)
  const parts = useRef<{ p: number[]; v: number[]; r: number[]; w: number[] }[]>([])
  const age = useRef(Infinity)
  const tmp = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const c = new Color()
    for (let i = 0; i < CONFETTI; i++) mesh.setColorAt(i, c.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  // Gol que já aconteceu antes de o campo montar (ao voltar de dentro da
  // casa) não solta confete: só os gols novos.
  const seen = useRef(useGame.getState().goal?.id ?? 0)

  useEffect(() => {
    if (!goal || goal.id === seen.current) return
    seen.current = goal.id
    const [x, z] = goal.at
    parts.current = Array.from({ length: CONFETTI }, () => {
      const a = Math.random() * Math.PI * 2
      const s = 1 + Math.random() * 2.5
      return {
        p: [x, 0.6, z],
        v: [Math.cos(a) * s, 3 + Math.random() * 3, Math.sin(a) * s],
        r: [Math.random() * 6, Math.random() * 6, Math.random() * 6],
        w: [Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4],
      }
    })
    age.current = 0
  }, [goal])

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    age.current += delta
    const alive = age.current < CONFETTI_LIFE
    mesh.visible = alive
    if (!alive) return
    const shrink = Math.min(1, (CONFETTI_LIFE - age.current) / 0.6)
    parts.current.forEach((q, i) => {
      q.v[1] -= 6 * delta // gravidade, com o ar segurando (abaixo)
      for (let k = 0; k < 3; k++) {
        q.v[k] *= 1 - 1.6 * delta
        q.p[k] += q.v[k] * delta
        q.r[k] += q.w[k] * delta
      }
      if (q.p[1] < 0.02) q.p[1] = 0.02
      tmp.position.set(q.p[0], q.p[1], q.p[2])
      tmp.rotation.set(q.r[0], q.r[1], q.r[2])
      tmp.scale.setScalar(shrink)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, CONFETTI]} visible={false} frustumCulled={false}>
      <planeGeometry args={[0.06, 0.035]} />
      <meshBasicMaterial side={DoubleSide} />
    </instancedMesh>
  )
}

// ---- Bola ---------------------------------------------------------------------

// Bola clássica (a de gomos pretos e brancos): uma esfera bem dividida em que
// cada triângulo pega a cor do gomo mais próximo. Os 12 pentágonos pretos ficam
// nos vértices de um icosaedro, os 20 hexágonos brancos no centro das faces
// dele; perto da divisa entre dois gomos, a costura em cinza.
function classicBall(radius: number) {
  const g = new IcosahedronGeometry(radius, 5)
  const pos = g.getAttribute('position')
  const ico = new IcosahedronGeometry(1, 0)
  const ip = ico.getAttribute('position')
  const pentagons: Vector3[] = []
  const hexagons: Vector3[] = []
  const v = new Vector3()
  for (let i = 0; i < ip.count; i++) {
    v.fromBufferAttribute(ip, i).normalize()
    if (!pentagons.some((p) => p.distanceTo(v) < 1e-3)) pentagons.push(v.clone())
  }
  for (let i = 0; i < ip.count; i += 3) {
    const c = new Vector3()
    for (let k = 0; k < 3; k++) c.add(v.fromBufferAttribute(ip, i + k))
    hexagons.push(c.normalize())
  }
  const colors: number[] = []
  const black = new Color('#1d1d21')
  const white = new Color('#f7f7f4')
  const seam = new Color('#9a9a9a')
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i)
    b.fromBufferAttribute(pos, i + 1)
    c.fromBufferAttribute(pos, i + 2)
    const center = a.add(b).add(c).normalize()
    // ângulo até o gomo mais próximo de cada tipo
    const toPent = Math.min(...pentagons.map((p) => p.angleTo(center)))
    const toHex = Math.min(...hexagons.map((h) => h.angleTo(center)))
    const near = [...pentagons.map((p) => p.angleTo(center)), ...hexagons.map((h) => h.angleTo(center))].sort((x, y) => x - y)
    const color = near[1] - near[0] < 0.035 ? seam : toPent < toHex ? black : white
    for (let k = 0; k < 3; k++) colors.push(color.r, color.g, color.b)
  }
  g.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return g
}

function Ball() {
  const body = useRef<RapierRigidBody>(null)
  const collider = useRef<RapierCollider>(null)
  const label = useRef<Group>(null)
  const ballGeometry = useMemo(() => classicBall(BALL_R), [])
  const scoring = useRef(false)
  // Embaixadinha: o trecho de parábola atual (alturas, início e duração em s).
  const flight = useRef<{ y0: number; y1: number; t0: number; dur: number; from: [number, number]; at?: [number, number] } | null>(null)
  const t = useI18n((s) => s.t)
  const key = useIsTouch() ? 'A' : 'E'
  const showPrompt = useGame((s) => s.nearby === 'ball' && isPlaying(s))
  const [cx, cz] = FIELD.center
  const [hx, hz] = FIELD.half

  // Chute (o Character avisa no instante em que o pé encosta na bola).
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        const b = body.current
        if (!b || !s.kick || s.kick === prev.kick) return
        const [dx, dz] = s.kick.dir
        const len = Math.hypot(dx, dz) || 1
        const speed = s.kick.bicycle ? BICYCLE_SPEED : KICK_SPEED
        // Bicicleta: a bola sai do pé direito, que está por cima do corpo; por
        // meio segundo ela atravessa o personagem em vez de bater nele.
        if (s.kick.bicycle) {
          const { x, y, z } = player.foot
          b.setTranslation({ x, y: Math.max(y, BALL_R), z }, true)
          collider.current?.setCollisionGroups(BALL_GHOST)
          setTimeout(() => collider.current?.setCollisionGroups(BALL_GROUPS), GHOST_MS)
        }
        b.setLinvel({ x: (dx / len) * speed, y: s.kick.bicycle ? BICYCLE_LIFT : KICK_LIFT, z: (dz / len) * speed }, true)
        play('kick')
      }),
    [],
  )

  // Embaixadinha: a cada toque o Character manda a altura do próximo e o
  // tempo até lá; no último, a bola volta para a física e cai na frente.
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        const b = body.current
        const e = s.juggle
        if (!b || !e || e === prev.juggle) return
        const pos = b.translation()
        if (e.release) {
          flight.current = null
          b.setGravityScale(1, true)
          const dx = pos.x - player.pos.x
          const dz = pos.z - player.pos.z
          const len = Math.hypot(dx, dz) || 1
          b.setLinvel({ x: (dx / len) * DROP_FORWARD, y: DROP_UP, z: (dz / len) * DROP_FORWARD }, true)
          play('juggle')
          return
        }
        // o primeiro trecho só tira a bola do chão; os outros são toques
        if (flight.current) play('juggle')
        flight.current = { y0: pos.y, y1: e.y, t0: performance.now() / 1000, dur: Math.max(e.flight, 0.05), from: [pos.x, pos.z], at: e.at }
      }),
    [],
  )

  useFrame(() => {
    const b = body.current
    if (!b) return
    const game = useGame.getState()
    const juggling = game.training?.juggle ? game.training.target : null
    if (juggling && flight.current) {
      // Parábola entre dois toques, com a altura que a gravidade daria nesse tempo.
      const f = flight.current
      const u = Math.min(1, (performance.now() / 1000 - f.t0) / f.dur)
      const y = f.y0 + (f.y1 - f.y0) * u + ((GRAVITY * f.dur * f.dur) / 8) * 4 * u * (1 - u)
      // sem `at`, a bola fica no alvo (na frente do pé); com ele, vai até lá
      const [ex, ez] = f.at ?? juggling
      const x = f.at ? f.from[0] + (ex - f.from[0]) * u : ex
      const z = f.at ? f.from[1] + (ez - f.from[1]) * u : ez
      b.setGravityScale(0, true)
      b.setTranslation({ x, y, z }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
      b.setAngvel({ x: 4, y: 0, z: 0 }, true)
      label.current?.position.set(x, y + 0.75, z)
      return
    }
    if (!juggling && b.gravityScale() === 0) {
      // embaixadinha interrompida (porta, painel): a bola volta para a física
      flight.current = null
      b.setGravityScale(1, true)
    }
    const pos = b.translation()
    const vel = b.linvel()
    ballState.pos.set(pos.x, pos.y, pos.z)
    label.current?.position.set(pos.x, pos.y + 0.75, pos.z)

    // Perto o bastante para chutar: mostra o "E Chutar" (posição atualizada
    // só quando a bola anda um pouco, para não mexer na store todo quadro).
    const dx = pos.x - player.pos.x
    const dz = pos.z - player.pos.z
    const dist = Math.hypot(dx, dz)
    if (dist < NEAR && !scoring.current) {
      const at = game.nearbyAt
      if (game.nearby !== 'ball' || !at || Math.hypot(at[0] - pos.x, at[1] - pos.z) > 0.1) game.enter('ball', [pos.x, pos.z])
    } else if (game.nearby === 'ball') {
      game.leave('ball')
    }

    // Condução: a cápsula do personagem flutua acima do chão e passaria por
    // cima da bola; então, encostou andando, a bola ganha velocidade na
    // direção do empurrão.
    const speed = Math.hypot(player.vel.x, player.vel.z)
    if (dist < DRIBBLE_REACH && dist > 0.01 && speed > 0.2 && !game.training) {
      const nx = dx / dist
      const nz = dz / dist
      const along = vel.x * nx + vel.z * nz
      const want = speed * DRIBBLE_BOOST
      if (along < want) {
        const m = b.mass()
        b.applyImpulse({ x: nx * (want - along) * m, y: 0, z: nz * (want - along) * m }, true)
      }
    }

    // Bola presa no campo: nas linhas ela quica de volta, menos na boca do
    // gol, onde entra até a rede (fundo, laterais e teto), que segura a bola
    // e amortece. Vale também durante a comemoração do gol.
    const lx = pos.x - cx
    const lz = pos.z - cz
    const mouth = Math.abs(lz) < GOAL.w - BALL_R && pos.y < GOAL.h
    const inGoal = Math.abs(lx) > hx
    let { x, y, z } = pos
    let { x: vx, y: vy, z: vz } = vel
    let hit = false
    const bounce = inGoal ? NET_BOUNCE : BOUNCE
    const maxX = mouth || inGoal ? hx + GOAL.d - BALL_R : hx - BALL_R
    if (Math.abs(lx) > maxX) {
      x = cx + Math.sign(lx) * maxX
      vx = -Math.sign(lx) * Math.abs(vx) * bounce
      hit = true
    }
    const maxZ = inGoal ? GOAL.w - BALL_R : hz - BALL_R
    if (Math.abs(lz) > maxZ) {
      z = cz + Math.sign(lz) * maxZ
      vz = -Math.sign(lz) * Math.abs(vz) * bounce
      hit = true
    }
    if (inGoal && y > GOAL.h - BALL_R) {
      y = GOAL.h - BALL_R
      vy = -Math.abs(vy) * bounce
      hit = true
    }
    if (hit) {
      b.setTranslation({ x, y, z }, true)
      b.setLinvel({ x: vx, y: vy, z: vz }, true)
    }

    // Gol: a bola passou inteira da linha, entre as traves e abaixo do travessão.
    if (!scoring.current && Math.abs(lx) > hx + BALL_R && Math.abs(lz) < GOAL.w && pos.y < GOAL.h) {
      scoring.current = true
      game.scoreGoal([cx + Math.sign(lx) * (hx + GOAL.d / 2), cz])
      setTimeout(() => {
        body.current?.setTranslation({ x: cx, y: 0.6, z: cz }, true)
        body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true)
        body.current?.setAngvel({ x: 0, y: 0, z: 0 }, true)
        scoring.current = false
      }, RESET_MS)
    }
  })

  return (
    <>
      <RigidBody
        ref={body}
        colliders={false}
        position={[cx, 0.6, cz]}
        restitution={0.6}
        friction={0.6}
        linearDamping={0.7}
        angularDamping={0.6}
        ccd
      >
        <BallCollider ref={collider} args={[BALL_R]} mass={0.4} collisionGroups={BALL_GROUPS} />
        <mesh geometry={ballGeometry} castShadow>
          <meshStandardMaterial vertexColors roughness={0.45} />
        </mesh>
      </RigidBody>
      <group ref={label}>
        <Html center zIndexRange={[10, 0]}>
          <div className={`prompt${showPrompt ? ' prompt--visible' : ''}`} aria-hidden={!showPrompt}>
            <kbd>{key}</kbd>
            {t.soccer.kick}
          </div>
        </Html>
      </group>
    </>
  )
}

export default function Soccer() {
  const [cx, cz] = FIELD.center
  const [, hz] = FIELD.half
  return (
    <>
      <group position={[cx, 0, cz]}>
        <Pitch />
      </group>
      <Scoreboard position={[cx, 0, cz - hz - 0.55]} />
      <Ball />
      <Confetti />
    </>
  )
}
