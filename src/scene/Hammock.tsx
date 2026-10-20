import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { CanvasTexture, DoubleSide, MathUtils, PlaneGeometry, SRGBColorSpace, type Group } from 'three'
import { useGame, type Seat } from '../state/game'
import SeatZone from './SeatZone'

// Rede de dormir (item 7), com suporte de madeira próprio: dois postes em "A"
// nas pontas e o tecido listrado pendurado nas cordas, caído no meio. Dá para
// deitar pelos dois lados: senta de lado na beira, como numa rede de verdade,
// e vira para o comprimento ao deitar. Com alguém deitado, ela balança de leve.

const WOOD = '#8a5a2b'
const POST_X = 1.25 // meia-distância entre os postes
const TOP = 1.0 // altura onde as cordas amarram
const CLOTH_X = 0.8 // meia-largura do tecido no comprimento
const CLOTH_W = 0.7 // largura do tecido
const LOW = 0.42 // altura do meio do tecido
const SAG = 0.11 // quanto o meio cai em relação às pontas do tecido
const STRIPES = ['#e2553b', '#f2b134', '#2a9d8f', '#f4efe6', '#e2553b', '#3d6fb6', '#f2b134', '#f4efe6']
const SWAY = 0.07 // balanço com alguém deitado (rad)

function stripes() {
  const c = document.createElement('canvas')
  c.width = 16
  c.height = 256
  const g = c.getContext('2d')!
  const h = c.height / STRIPES.length
  STRIPES.forEach((color, i) => {
    g.fillStyle = color
    g.fillRect(0, i * h, c.width, h)
  })
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// O tecido: um plano caído (parábola no comprimento) e com as bordas um pouco
// levantadas (curvado na largura, como uma rede de verdade). As listras correm
// na largura.
function clothGeometry() {
  const g = new PlaneGeometry(CLOTH_X * 2, CLOTH_W, 24, 8)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / CLOTH_X // −1 a 1 no comprimento
    const z = pos.getZ(i) / (CLOTH_W / 2) // −1 a 1 na largura
    // nas pontas ele se fecha (as bordas se juntam na corda)
    const pinch = 1 - 0.55 * x * x
    pos.setZ(i, pos.getZ(i) * pinch)
    pos.setY(i, LOW + SAG * x * x + 0.07 * z * z * (1 - x * x))
  }
  g.computeVertexNormals()
  return g
}

type Props = { position: [number, number, number] }

export default function Hammock({ position }: Props) {
  const map = useMemo(stripes, [])
  const cloth = useMemo(clothGeometry, [])
  const [px, , pz] = position
  // onde quem deita fica: no meio do tecido, olhando para +x
  // Dois assentos, um de cada lado do tecido: senta de lado na beira (de
  // frente para fora) e, ao deitar, vira para o comprimento (pela frente a
  // cabeça vai para −x; por trás, para +x). A cápsula fica do lado de fora,
  // na frente de quem senta (o tecido tem colisão).
  const seats = useMemo<Seat[]>(
    () => [
      { center: [px, pz], yaw: 0, height: LOW, depth: 0.42, edge: 0.1, lie: { yaw: Math.PI / 2, shift: 0.22 } },
      { center: [px, pz], yaw: Math.PI, height: LOW, depth: 0.42, edge: 0.1, lie: { yaw: -Math.PI / 2, shift: 0.22 } },
    ],
    [px, pz],
  )
  const swing = useRef<Group>(null)
  const amp = useRef(0)
  const phase = useRef(0)

  useFrame((_, delta) => {
    const g = swing.current
    if (!g) return
    const s = useGame.getState().sitting
    const lying = !!s && seats.includes(s.seat) && s.phase === 'lie'
    amp.current = MathUtils.damp(amp.current, lying ? SWAY : 0, 1, delta)
    phase.current += delta * 1.6
    const a = Math.sin(phase.current) * amp.current
    g.rotation.x = a
    // quem está deitado acompanha (gira em volta da linha das cordas)
    const arm = TOP - LOW
    for (const seat of seats) {
      seat.center[1] = pz + Math.sin(a) * arm
      seat.height = TOP - Math.cos(a) * arm
    }
  })

  return (
    <>
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        {/* os postes e o tecido (alto: a cápsula flutua e subiria nele) */}
        {[-1, 1].map((side) => (
          <CuboidCollider key={side} args={[0.08, 0.5, 0.35]} position={[side * POST_X, 0.5, 0]} />
        ))}
        <CuboidCollider args={[CLOTH_X, 0.5, CLOTH_W / 2 - 0.05]} position={[0, 0.5, 0]} />
      </RigidBody>
      {/* suporte: em cada ponta, dois paus em "A" e uma travessa no alto */}
      {[-1, 1].map((side) => (
        <group key={side} position-x={side * POST_X}>
          {[-1, 1].map((leg) => (
            <mesh key={leg} position={[0, TOP / 2, leg * 0.18]} rotation-x={-leg * 0.3} castShadow>
              <cylinderGeometry args={[0.04, 0.05, TOP / Math.cos(0.3) + 0.08, 8]} />
              <meshStandardMaterial color={WOOD} roughness={0.85} />
            </mesh>
          ))}
          <mesh position={[0, TOP + 0.02, 0]} castShadow>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color={WOOD} roughness={0.85} />
          </mesh>
          {/* base no chão, ligando as duas pernas */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <boxGeometry args={[0.08, 0.08, 0.8]} />
            <meshStandardMaterial color={WOOD} roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* travessa no chão de um poste ao outro (o suporte fica em pé sozinho) */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[POST_X * 2, 0.07, 0.08]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      {/* a rede balança em volta da linha que liga o alto dos postes */}
      <group position-y={TOP}>
        <group ref={swing}>
          <group position-y={-TOP}>
            <mesh geometry={cloth} castShadow receiveShadow>
              <meshStandardMaterial map={map} side={DoubleSide} roughness={0.95} />
            </mesh>
            {/* cordas: do alto de cada poste até a ponta do tecido */}
            {[-1, 1].map((side) => {
              const x0 = side * POST_X
              const x1 = side * CLOTH_X
              const y1 = LOW + SAG
              const len = Math.hypot(x0 - x1, TOP - y1)
              return (
                <mesh
                  key={side}
                  position={[(x0 + x1) / 2, (TOP + y1) / 2, 0]}
                  rotation-z={Math.atan2(TOP - y1, x0 - x1) + Math.PI / 2}
                  castShadow
                >
                  <cylinderGeometry args={[0.012, 0.012, len, 6]} />
                  <meshStandardMaterial color="#efe6d3" roughness={1} />
                </mesh>
              )
            })}
          </group>
        </group>
      </group>
    </group>
    {seats.map((seat, i) => (
      <SeatZone key={i} seat={seat} label="hammock" width={0.55} />
    ))}
    </>
  )
}
