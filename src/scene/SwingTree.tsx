import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { Float32BufferAttribute, MathUtils, Vector3, type BufferGeometry, type Group, type Material, type Matrix4, type Mesh } from 'three'
import { useGame, type Seat } from '../state/game'
import SeatZone from './SeatZone'
import { addWind } from './wind'

// Árvore do balanço (item 35). O modelo veio com o galho baixo (uns 20% da
// altura): aqui o tronco abaixo do galho é esticado (só os vértices abaixo de
// CUT sobem, o resto sobe junto sem deformar), e o galho vai para a altura
// certa de pendurar o balanço. A copa encolhe em volta do tronco (CANOPY),
// senão a árvore fica grande e, com a câmera alta, tapa o que está atrás.

const URL = '/models/ai/35-arvore-galho.glb'
// No espaço do modelo (1 unidade de altura): onde o galho começa e quanto o
// tronco abaixo dele cresce.
const CUT = 0.15
const STRETCH = 3.4
// A copa (acima de CANOPY_FROM, com uma faixa de transição) encolhe para
// CANOPY do tamanho, a partir da base dela; o galho, abaixo, fica igual.
const CANOPY_FROM = 0.26
const CANOPY_BLEND = 0.08
const CANOPY = 0.75

// A geometria vem comprimida (meshopt: inteiros de −1 a 1, e o nó escala e
// sobe): primeiro passa para as coordenadas do modelo (0 a 1 de altura) em
// números normais, depois estica. O nó da malha volta para a identidade.
function stretchTrunk(geometry: BufferGeometry, toModel: Matrix4) {
  const g = geometry.clone()
  const src = g.attributes.position
  const out = new Float32Array(src.count * 3)
  const v = new Vector3()
  for (let i = 0; i < src.count; i++) {
    v.fromBufferAttribute(src, i).applyMatrix4(toModel)
    // copa menor: 0 no galho, 1 da faixa de transição para cima
    const t = Math.min(1, Math.max(0, (v.y - CANOPY_FROM) / CANOPY_BLEND))
    const k = 1 + (CANOPY - 1) * t
    const y = v.y > CANOPY_FROM ? CANOPY_FROM + (v.y - CANOPY_FROM) * k : v.y
    out[i * 3] = v.x * k
    out[i * 3 + 1] = y < CUT ? y * STRETCH : y + CUT * (STRETCH - 1)
    out[i * 3 + 2] = v.z * k
  }
  g.setAttribute('position', new Float32BufferAttribute(out, 3))
  // as normais só passam por escala uniforme e translação: continuam valendo
  g.computeBoundingBox()
  g.computeBoundingSphere()
  return g
}

/** Altura do galho no espaço do modelo, depois de esticar. */
export const BRANCH_Y = CUT * STRETCH + 0.03
const TOP = CANOPY_FROM + (1 - CANOPY_FROM) * CANOPY + CUT * (STRETCH - 1)

// Balanço (item 6): pendurado no galho (que sai do tronco para +x no modelo),
// entre BRANCH_ROPES (no espaço do modelo), com o assento a SEAT_Y do chão.
const BRANCH_ROPES: [number, number] = [0.22, 0.42]
const SEAT_Y = 0.42
const SEAT = { w: 0.56, d: 0.26, h: 0.05 }
// Ângulo do balanço: parado, quase nada (o vento); com alguém, vai e volta.
const IDLE_SWING = 0.04
const RIDE_SWING = 0.5
const SWING_SPEED = 2.3 // rad/s da oscilação (um vai e volta a cada ~2,7 s)

// Onde o galho está, medido na geometria já esticada (espaço do modelo): em
// cada x das cordas, a face de baixo dele e o meio dele em z. O galho do Tripo
// é reto, mas sai na diagonal (uns 30° para −z), então cada corda tem o seu z.
function measureBranch(geometry: BufferGeometry, ropes: readonly number[]) {
  const pos = geometry.attributes.position
  const lo = ropes.map(() => Infinity)
  const zMin = ropes.map(() => Infinity)
  const zMax = ropes.map(() => -Infinity)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    // só o galho: entre o tronco esticado e o começo da copa
    if (y < BRANCH_Y - 0.06 || y > BRANCH_Y + 0.07) continue
    ropes.forEach((rx, k) => {
      if (Math.abs(x - rx) > 0.015) return
      const z = pos.getZ(i)
      lo[k] = Math.min(lo[k], y)
      zMin[k] = Math.min(zMin[k], z)
      zMax[k] = Math.max(zMax[k], z)
    })
  }
  return ropes.map((x, k) => ({
    x,
    y: Number.isFinite(lo[k]) ? lo[k] : BRANCH_Y,
    z: Number.isFinite(zMin[k]) ? (zMin[k] + zMax[k]) / 2 : 0,
  }))
}

type Props = { position: [number, number, number]; rotationY?: number; scale: number }

export default function SwingTree({ position, rotationY = 0, scale }: Props) {
  const { scene } = useGLTF(URL)
  const { tree, branch } = useMemo(() => {
    const c = scene.clone()
    c.updateMatrixWorld(true)
    let branch = BRANCH_ROPES.map((x) => ({ x, y: BRANCH_Y, z: 0 }))
    c.traverse((obj) => {
      const mesh = obj as Mesh
      if (!mesh.isMesh) return
      mesh.geometry = stretchTrunk(mesh.geometry, mesh.matrixWorld.clone())
      branch = measureBranch(mesh.geometry, BRANCH_ROPES)
      mesh.position.set(0, 0, 0)
      mesh.rotation.set(0, 0, 0)
      mesh.scale.set(1, 1, 1)
      mesh.castShadow = mesh.receiveShadow = true
      // a copa balança com o vento, o tronco e o galho não
      addWind(mesh.material as Material, { from: BRANCH_Y + 0.12, to: TOP, amount: 0.012 })
    })
    return { tree: c, branch }
  }, [scene])

  const trunkHalf = (BRANCH_Y * scale) / 2
  // Ponto onde as cordas pegam no galho (no espaço da árvore, já escalado) e
  // o comprimento delas até o assento.
  // As cordas pegam embaixo do galho, nos dois pontos medidos; o balanço fica
  // no meio deles, alinhado com o galho (giro `along` no espaço da árvore), e
  // gira em volta dele.
  const [a, b] = branch.map((p) => ({ x: p.x * scale, y: p.y * scale, z: p.z * scale }))
  const hangX = (a.x + b.x) / 2
  const hangZ = (a.z + b.z) / 2
  const along = -Math.atan2(b.z - a.z, b.x - a.x)
  const ropeGap = Math.hypot(b.x - a.x, b.z - a.z) / 2
  const ropeTops = [a.y, b.y]
  const hangY = (a.y + b.y) / 2
  const rope = hangY - SEAT_Y
  // O assento para sentar: quem senta olha para +z da árvore (perpendicular ao
  // galho). O objeto muda a cada quadro enquanto balança, e o sentar segue.
  const seat = useMemo<Seat>(() => {
    const c = Math.cos(rotationY)
    const s = Math.sin(rotationY)
    return {
      center: [position[0] + hangX * c + hangZ * s, position[2] - hangX * s + hangZ * c],
      yaw: rotationY + along,
      height: SEAT_Y + SEAT.h / 2,
      depth: SEAT.d / 2,
      edge: 0,
    }
  }, [position[0], position[2], rotationY, hangX, hangZ, along]) // eslint-disable-line react-hooks/exhaustive-deps

  const swing = useRef<Group>(null)
  const board = useRef<Group>(null)
  const amp = useRef(IDLE_SWING)
  const phase = useRef(0)
  const at = useMemo(() => new Vector3(), [])
  useFrame(({ clock }, delta) => {
    const g = swing.current
    if (!g || !board.current) return
    const riding = useGame.getState().sitting
    const mine = riding?.seat === seat
    amp.current = MathUtils.damp(amp.current, mine && riding?.phase === 'sit' ? RIDE_SWING : IDLE_SWING, 0.8, delta)
    phase.current += delta * SWING_SPEED
    g.rotation.set(Math.sin(phase.current) * amp.current + Math.sin(clock.elapsedTime * 1.3) * 0.01, along, 0, 'YXZ')
    // o assento no mundo: o sentar (Character e Player) vai atrás dele
    board.current.getWorldPosition(at)
    seat.center[0] = at.x
    seat.center[1] = at.z
    seat.height = at.y + SEAT.h / 2
  })

  return (
    <>
      <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
        <CylinderCollider args={[trunkHalf, 0.2]} position={[0, trunkHalf, 0]} />
        <primitive object={tree} scale={scale} />
        {/* o balanço gira em volta do galho */}
        <group ref={swing} position={[hangX, hangY, hangZ]} rotation-y={along}>
          {[-ropeGap, ropeGap].map((x, k) => {
            // cada corda vai da face de baixo do galho (no ponto dela) ao assento
            const top = ropeTops[k] - hangY
            const len = top + rope
            return (
              <mesh key={x} position={[x, top - len / 2, 0]} castShadow>
                <cylinderGeometry args={[0.012, 0.012, len, 6]} />
                <meshStandardMaterial color="#e8dcc0" roughness={1} />
              </mesh>
            )
          })}
          <group ref={board} position={[0, -rope, 0]}>
            <RoundedBox args={[SEAT.w, SEAT.h, SEAT.d]} radius={0.015} smoothness={3} castShadow receiveShadow>
              <meshStandardMaterial color="#b98552" roughness={0.85} />
            </RoundedBox>
          </group>
        </group>
      </RigidBody>
      <SeatZone seat={seat} label="swing" width={0.4} />
    </>
  )
}

useGLTF.preload(URL)
