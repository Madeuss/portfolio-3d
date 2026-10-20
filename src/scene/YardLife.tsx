import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MeshStandardMaterial, Object3D, SphereGeometry, type Group, type InstancedMesh, type Mesh } from 'three'
import { dog, player } from '../state/player'

// O que mexe nas peças novas do quintal: a fumaça da churrasqueira (33), a
// água do irrigador (36) e o gato (38), que foge quando alguém chega perto.

// ---- Fumaça da churrasqueira -------------------------------------------------

const PUFFS = 9
const PUFF_LIFE = 3.2 // segundos de cada baforada, da chaminé até sumir

/** Baforadas subindo da chaminé: crescem, vão para o lado com o vento e somem. */
export function Smoke({ position }: { position: [number, number, number] }) {
  const ref = useRef<InstancedMesh>(null)
  const material = useMemo(
    () => new MeshStandardMaterial({ color: '#e9e6e1', roughness: 1, transparent: true, opacity: 0.55, depthWrite: false }),
    [],
  )
  const geometry = useMemo(() => new SphereGeometry(0.09, 10, 8), [])
  const o = useMemo(() => new Object3D(), [])

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock.elapsedTime
    for (let i = 0; i < PUFFS; i++) {
      // cada baforada nasce num tempo diferente e recomeça ao sumir
      const u = ((t + (i * PUFF_LIFE) / PUFFS) % PUFF_LIFE) / PUFF_LIFE
      const grow = 0.6 + u * 2.2
      // some no fim: encolhe o tamanho (a opacidade é uma só para todas)
      const fade = u < 0.15 ? u / 0.15 : 1 - Math.max(0, (u - 0.6) / 0.4)
      o.position.set(position[0] + u * 0.5 + Math.sin(t * 1.3 + i) * 0.05, position[1] + u * 1.6, position[2] + Math.cos(t + i * 2) * 0.05)
      o.scale.setScalar(grow * Math.max(0.001, fade))
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geometry, material, PUFFS]} frustumCulled={false} />
}

// ---- Água do irrigador -----------------------------------------------------------

const DROPS = 70
const DROP_LIFE = 0.75
const JET_SPEED = 1.9 // velocidade de saída (m/s), na horizontal
const JET_LIFT = 2.4 // e para cima
const SPIN = 2.2 // rad/s dos dois jatos girando
const GRAVITY = 9.8

/** Dois jatos girando, do topo do irrigador, caindo em arco. */
export function SprinklerWater({ position }: { position: [number, number, number] }) {
  const ref = useRef<InstancedMesh>(null)
  const material = useMemo(() => new MeshStandardMaterial({ color: '#9fd6ff', roughness: 0.2, transparent: true, opacity: 0.8 }), [])
  const geometry = useMemo(() => new SphereGeometry(0.018, 6, 4), [])
  const o = useMemo(() => new Object3D(), [])

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock.elapsedTime
    for (let i = 0; i < DROPS; i++) {
      // a gota i saiu há `age` segundos, na direção que o jato tinha naquela hora
      const age = ((t + (i * DROP_LIFE) / DROPS) % DROP_LIFE) + 0.001
      const born = t - age
      const a = born * SPIN + (i % 2) * Math.PI
      const spread = 0.85 + ((i * 7) % 5) * 0.06
      const h = JET_SPEED * spread * age
      o.position.set(position[0] + Math.sin(a) * h, position[1] + JET_LIFT * age - (GRAVITY / 2) * age * age, position[2] + Math.cos(a) * h)
      o.scale.setScalar(o.position.y < 0.01 ? 0.001 : 1)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geometry, material, DROPS]} frustumCulled={false} />
}

// ---- Gato -------------------------------------------------------------------------

const CAT_URL = '/models/ai/38-gato.glb'
const CAT_SCARE = 1.6 // o cachorro ou o personagem a essa distância: ele pula
const CAT_AWAY_S = 9 // quanto tempo fica fora antes de voltar
const CAT_JUMP_S = 0.55

type CatProps = {
  position: [number, number, number]
  rotationY: number
  scale: number
  /** Para onde ele pula ao fugir (x, z): para fora do quintal, atrás do muro. */
  away: [number, number]
}

/** O gato sentado no muro: foge pulando para fora e volta depois de um tempo. */
export function Cat({ position, rotationY, scale, away }: CatProps) {
  const { scene } = useGLTF(CAT_URL)
  const model = useMemo(() => {
    const c = scene.clone()
    c.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = o.receiveShadow = true
    })
    return c
  }, [scene])
  const g = useRef<Group>(null)
  const s = useRef({ mode: 'sit' as 'sit' | 'jump' | 'away' | 'back', t: 0 })

  useFrame(({ clock }, delta) => {
    const cat = g.current
    if (!cat) return
    const st = s.current
    const dt = Math.min(delta, 0.05)
    const near = (p: { x: number; z: number }) => Math.hypot(p.x - position[0], p.z - position[2]) < CAT_SCARE
    if (st.mode === 'sit') {
      if (near(player.pos) || near(dog.pos)) {
        st.mode = 'jump'
        st.t = 0
      }
    } else {
      st.t += dt
    }
    if (st.mode === 'jump' && st.t >= CAT_JUMP_S) {
      st.mode = 'away'
      st.t = 0
    } else if (st.mode === 'away' && st.t >= CAT_AWAY_S && !near(player.pos) && !near(dog.pos)) {
      st.mode = 'back'
      st.t = 0
    } else if (st.mode === 'back' && st.t >= CAT_JUMP_S) {
      st.mode = 'sit'
    }

    // pulo: arco do muro até `away` (e de volta, ao contrário), girando para lá
    const u = st.mode === 'jump' ? st.t / CAT_JUMP_S : st.mode === 'back' ? 1 - st.t / CAT_JUMP_S : st.mode === 'away' ? 1 : 0
    cat.visible = st.mode !== 'away'
    cat.position.set(
      position[0] + (away[0] - position[0]) * u,
      position[1] + Math.sin(Math.min(u, 1) * Math.PI) * 0.5 - u * 0.3,
      position[2] + (away[1] - position[2]) * u,
    )
    const out = Math.atan2(away[0] - position[0], away[1] - position[2])
    const turn = Math.min(1, u * 3)
    cat.rotation.y = rotationY + Math.atan2(Math.sin(out - rotationY), Math.cos(out - rotationY)) * turn
    // sentado: respira e mexe a cabeça de leve (o corpo todo, sem esqueleto)
    const t = clock.elapsedTime
    cat.scale.set(scale, scale * (1 + Math.sin(t * 2.4) * 0.02 * (st.mode === 'sit' ? 1 : 0)), scale)
  })

  return (
    <group ref={g}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(CAT_URL)
