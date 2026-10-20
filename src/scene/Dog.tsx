import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { MathUtils, type Group, type Mesh } from 'three'
import { player } from '../state/player'
import type { Area } from './Grass'

// Doguinho solto pelo terreno (provisório: "Cartoon Dog", de assetfactory no
// Sketchfab, até gerar um shih tzu igual ao do Mat). O modelo não tem
// esqueleto: o andar é um balanço feito aqui (sobe e desce e gira de leve).
// Ele passeia entre pontos sorteados, para um pouco em cada um e, se o
// personagem chega perto, para e olha para ele.

const URL = '/models/dog/cartoon-dog.glb'
// O modelo tem 4 unidades de altura e olha para +z; 0,14 deixa ele com 57 cm
// (um pouco maior que um shih tzu, para aparecer de longe).
const SCALE = 0.14
const SPEED = 0.9
const TURN = 6
// Perto assim do personagem, ele para e fica olhando.
const NOTICE = 1.4
const MARGIN = 0.6

type Props = {
  start: [number, number]
  /** Meia-largura da área onde ele passeia. */
  half: number
  /** Retângulos onde ele não entra (casa, campo, lago...). */
  avoid: Area[]
}

const blocked = (x: number, z: number, avoid: Area[]) =>
  avoid.some((a) => x > a.x[0] - MARGIN && x < a.x[1] + MARGIN && z > a.z[0] - MARGIN && z < a.z[1] + MARGIN)

export default function Dog({ start, half, avoid }: Props) {
  const { scene } = useGLTF(URL)
  const model = useMemo(() => {
    const c = scene.clone()
    c.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = o.receiveShadow = true
    })
    return c
  }, [scene])
  const body = useRef<RapierRigidBody>(null)
  const look = useRef<Group>(null)
  const state = useRef({ x: start[0], z: start[1], yaw: 0, tx: start[0], tz: start[1], wait: 1, walk: 0 })

  // Próximo ponto: sorteado na área livre, com o caminho reto até ele também livre.
  const pickTarget = () => {
    const s = state.current
    for (let i = 0; i < 30; i++) {
      const tx = (Math.random() * 2 - 1) * half
      const tz = (Math.random() * 2 - 1) * half
      if (Math.hypot(tx - s.x, tz - s.z) < 2) continue
      let free = true
      for (let k = 1; k <= 12 && free; k++) {
        const u = k / 12
        free = !blocked(s.x + (tx - s.x) * u, s.z + (tz - s.z) * u, avoid)
      }
      if (!free) continue
      s.tx = tx
      s.tz = tz
      return
    }
  }

  useFrame(({ clock }, delta) => {
    const s = state.current
    const b = body.current
    if (!b || !look.current) return
    const dt = Math.min(delta, 0.05)
    const toPlayer = Math.hypot(player.pos.x - s.x, player.pos.z - s.z)
    let moving = false
    let wantYaw = s.yaw

    if (toPlayer < NOTICE) {
      // Olha para o personagem.
      wantYaw = Math.atan2(player.pos.x - s.x, player.pos.z - s.z)
    } else if (s.wait > 0) {
      s.wait -= dt
      if (s.wait <= 0) pickTarget()
    } else {
      const dx = s.tx - s.x
      const dz = s.tz - s.z
      const d = Math.hypot(dx, dz)
      if (d < 0.1) {
        s.wait = 1.5 + Math.random() * 3
      } else {
        const step = Math.min(d, SPEED * dt)
        s.x += (dx / d) * step
        s.z += (dz / d) * step
        wantYaw = Math.atan2(dx, dz)
        moving = true
      }
    }

    // Vira pelo caminho mais curto.
    let diff = wantYaw - s.yaw
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    s.yaw += diff * (1 - Math.exp(-TURN * dt))
    s.walk = MathUtils.damp(s.walk, moving ? 1 : 0, 8, dt)

    b.setNextKinematicTranslation({ x: s.x, y: 0, z: s.z })
    b.setNextKinematicRotation({ x: 0, y: Math.sin(s.yaw / 2), z: 0, w: Math.cos(s.yaw / 2) })

    // Balanço: andando, pulinho e gingado; parado, respiração.
    const t = clock.elapsedTime
    const g = look.current
    g.position.y = Math.abs(Math.sin(t * 11)) * 0.035 * s.walk
    g.rotation.z = Math.sin(t * 11) * 0.07 * s.walk
    g.rotation.x = Math.sin(t * 22) * 0.03 * s.walk
    g.scale.y = 1 + Math.sin(t * 3) * 0.015 * (1 - s.walk)
  })

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[start[0], 0, start[1]]}>
      <CuboidCollider args={[0.2, 0.28, 0.45]} position={[0, 0.28, 0.02]} />
      <group ref={look}>
        <primitive object={model} scale={SCALE} />
      </group>
    </RigidBody>
  )
}

useGLTF.preload(URL)
