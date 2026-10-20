import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, MeshStandardMaterial, Object3D, type Group, type InstancedMesh } from 'three'
import { player } from '../state/player'
import { stoneGeometry, stoneTexture } from './Pond'
import type { Area } from './Grass'

// Vida no quintal: borboletas voando em volta dos canteiros, passarinhos
// ciscando que fogem quando o personagem chega perto, e pedrinhas soltas.

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

// ---- Borboletas ---------------------------------------------------------------

const WING_COLORS = ['#ffd43b', '#ffffff', '#f08c00', '#74c0fc', '#f783ac']

function Butterfly({ center, seed }: { center: [number, number]; seed: number }) {
  const body = useRef<Group>(null)
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  const color = WING_COLORS[seed % WING_COLORS.length]
  const phase = seed * 1.7

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    const g = body.current
    if (!g) return
    // passeio em "8" em volta do canteiro, subindo e descendo
    const x = center[0] + Math.sin(t * 0.5) * 0.9
    const z = center[1] + Math.sin(t) * 0.5
    const y = 0.55 + Math.sin(t * 2.3) * 0.18
    g.position.set(x, y, z)
    g.rotation.y = Math.atan2(Math.cos(t * 0.5) * 0.45, Math.cos(t) * 0.5)
    const flap = Math.sin(t * 22) * 0.9
    if (left.current) left.current.rotation.z = 0.2 + flap
    if (right.current) right.current.rotation.z = -0.2 - flap
  })

  return (
    <group ref={body} scale={1.3}>
      <mesh rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.008, 0.05, 3, 6]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      {[left, right].map((ref, i) => (
        <group key={i} ref={ref}>
          <mesh position={[i ? -0.045 : 0.045, 0, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.045, 10]} />
            <meshStandardMaterial color={color} side={DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Butterflies({ around }: { around: [number, number][] }) {
  return (
    <>
      {around.map((c, i) => (
        <Butterfly key={i} center={c} seed={i + 1} />
      ))}
    </>
  )
}

// ---- Passarinhos --------------------------------------------------------------

const SCARE = 1.8 // distância do personagem que faz o passarinho voar
const AWAY_S = 7 // quanto tempo ele fica longe antes de voltar

type Bird = { home: [number, number]; color: string }

function Birdie({ home, color, seed }: Bird & { seed: number }) {
  const g = useRef<Group>(null)
  const head = useRef<Group>(null)
  const wings = useRef<(Group | null)[]>([])
  const s = useRef({ flying: false, away: 0, dir: 0, x: home[0], z: home[1], y: 0 })

  useFrame(({ clock }, delta) => {
    const b = g.current
    if (!b) return
    const st = s.current
    const t = clock.elapsedTime + seed
    const dt = Math.min(delta, 0.05)

    if (!st.flying && st.away <= 0 && Math.hypot(player.pos.x - st.x, player.pos.z - st.z) < SCARE) {
      st.flying = true
      st.dir = Math.atan2(st.x - player.pos.x, st.z - player.pos.z) + (Math.random() - 0.5) * 0.8
    }
    if (st.flying) {
      // sobe e se afasta até sumir de vista; depois de um tempo volta para casa
      st.x += Math.sin(st.dir) * 4 * dt
      st.z += Math.cos(st.dir) * 4 * dt
      st.y += 2.2 * dt
      if (st.y > 6) {
        st.flying = false
        st.away = AWAY_S
      }
    } else if (st.away > 0) {
      st.away -= dt
      if (st.away <= 0) {
        st.x = home[0]
        st.z = home[1]
        st.y = 0
      }
    }
    b.visible = st.away <= 0
    b.position.set(st.x, st.y, st.z)
    b.rotation.y = st.flying ? st.dir : Math.sin(t * 0.4) * 1.2
    // ciscando no chão: a cabeça desce e sobe de vez em quando
    if (head.current) head.current.rotation.x = st.flying ? 0 : Math.max(0, Math.sin(t * 3)) * 0.9
    const flap = st.flying ? Math.sin(t * 30) * 0.9 : 0
    wings.current.forEach((w, i) => {
      if (w) w.rotation.z = (i ? -1 : 1) * (0.1 + flap)
    })
  })

  return (
    <group ref={g} scale={1.4}>
      <group position-y={0.07}>
        <mesh castShadow scale={[1, 0.85, 1.3]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <group ref={head} position={[0, 0.045, 0.05]}>
          <mesh position={[0, 0.01, 0.015]} castShadow>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.005, 0.055]} rotation-x={Math.PI / 2}>
            <coneGeometry args={[0.012, 0.03, 6]} />
            <meshStandardMaterial color="#f08c00" />
          </mesh>
        </group>
        {[1, -1].map((side, i) => (
          <group key={side} ref={(w) => void (wings.current[i] = w)} position={[side * 0.045, 0.01, 0]}>
            <mesh position={[side * 0.03, 0, 0]} scale={[1, 0.25, 1.2]}>
              <sphereGeometry args={[0.035, 8, 6]} />
              <meshStandardMaterial color="#8a5a2b" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

export function Birds({ birds }: { birds: Bird[] }) {
  return (
    <>
      {birds.map((b, i) => (
        <Birdie key={i} {...b} seed={i * 2.1} />
      ))}
    </>
  )
}

// ---- Pedrinhas ----------------------------------------------------------------

const inside = (x: number, z: number, a: Area) => x > a.x[0] && x < a.x[1] && z > a.z[0] && z < a.z[1]

/** Pedrinhas soltas pelo gramado (com a textura das pedras do lago). */
export function Pebbles({ half, clear, count = 28 }: { half: number; clear: Area[]; count?: number }) {
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => stoneGeometry(3.7), [])
  const material = useMemo(() => new MeshStandardMaterial({ map: stoneTexture(), color: '#ddd6ca', roughness: 1 }), [])
  const placed = useMemo(() => {
    const rnd = seeded(77)
    const list: { x: number; z: number; s: number; r: number }[] = []
    let tries = 0
    while (list.length < count && tries++ < count * 30) {
      const x = (rnd() * 2 - 1) * half
      const z = (rnd() * 2 - 1) * half
      if (clear.some((a) => inside(x, z, a))) continue
      // em grupinhos: às vezes uma segunda pedra encostada
      list.push({ x, z, s: 0.05 + rnd() * 0.05, r: rnd() * Math.PI * 2 })
      if (rnd() < 0.4) list.push({ x: x + 0.12, z: z + 0.05, s: 0.035 + rnd() * 0.03, r: rnd() * Math.PI * 2 })
    }
    return list.slice(0, count)
  }, [half, clear, count])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new Object3D()
    placed.forEach(({ x, z, s, r }, i) => {
      o.position.set(x, s * 0.35, z)
      o.rotation.set(0, r, 0)
      o.scale.set(s * 1.3, s * 0.7, s)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.count = placed.length
    mesh.instanceMatrix.needsUpdate = true
  }, [placed])

  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow receiveShadow />
}
