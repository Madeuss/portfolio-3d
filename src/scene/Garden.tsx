import { useLayoutEffect, useMemo, useRef } from 'react'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { CanvasTexture, Color, Object3D, SRGBColorSpace, type InstancedMesh } from 'three'

// Enfeites do quintal feitos em código: a placa MADEUS no portão, lampiões no
// caminho, canteiros de margaridas e um banco de madeira perto do lago.

const WOOD = '#b98552'
const WOOD_DARK = '#7a4f27'

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

// ---- Placa --------------------------------------------------------------------

// Placa em forma de seta apontando para a casa, com "MADEUS" pintado.
function signTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 160
  const g = c.getContext('2d')!
  g.fillStyle = WOOD
  g.fillRect(0, 0, c.width, c.height)
  // veios da madeira
  g.strokeStyle = 'rgba(90,55,25,0.25)'
  g.lineWidth = 3
  for (let y = 18; y < c.height; y += 26) {
    g.beginPath()
    g.moveTo(0, y)
    g.bezierCurveTo(170, y - 6, 340, y + 6, 512, y - 2)
    g.stroke()
  }
  g.font = '800 92px Archivo, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineWidth = 10
  g.strokeStyle = '#5a3412'
  g.strokeText('MADEUS', 236, 86)
  g.fillStyle = '#fffaf0'
  g.fillText('MADEUS', 236, 86)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

export function Sign({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const map = useMemo(signTexture, [])
  const W = 1.1
  const H = 0.34
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CylinderCollider args={[0.55, 0.06]} position-y={0.55} />
      <mesh position-y={0.55} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.1, 8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
      </mesh>
      {/* tábua com a ponta de seta (um prisma de 5 lados achatado) */}
      <group position={[0.3, 0.92, 0.07]}>
        <mesh castShadow>
          <boxGeometry args={[W, H, 0.06]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
        <mesh position={[W / 2 + 0.11, 0, 0]} rotation-z={Math.PI / 4} castShadow>
          <boxGeometry args={[H / Math.SQRT2, H / Math.SQRT2, 0.06]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
        <mesh position-z={0.031}>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial map={map} roughness={0.85} />
        </mesh>
      </group>
    </RigidBody>
  )
}

// ---- Lampiões -----------------------------------------------------------------

// Poste de madeira com uma lanterna de luz quente (só brilho, sem luz de
// verdade: luzes pontuais pesariam no celular).
export function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CylinderCollider args={[0.5, 0.07]} position-y={0.5} />
      <mesh position-y={0.45} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 0.9, 8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
      </mesh>
      <mesh position-y={1.02} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.2, 8]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffb547" emissiveIntensity={1.2} roughness={0.4} />
      </mesh>
      <mesh position-y={1.16} castShadow>
        <coneGeometry args={[0.17, 0.12, 8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
      </mesh>
      <mesh position-y={0.91}>
        <cylinderGeometry args={[0.13, 0.13, 0.03, 8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
      </mesh>
    </RigidBody>
  )
}

// ---- Margaridas ---------------------------------------------------------------

type Flower = { x: number; z: number; h: number; s: number; r: number; petals: string }

const PETAL_COLORS = ['#ffffff', '#ffffff', '#fff6d6', '#ffe066']

/** Canteiros de margaridas: `beds` = [x, z, quantas]. Três InstancedMesh (caule, pétalas, miolo). */
export function Flowers({ beds }: { beds: [number, number, number][] }) {
  const stems = useRef<InstancedMesh>(null)
  const petals = useRef<InstancedMesh>(null)
  const centers = useRef<InstancedMesh>(null)
  const flowers = useMemo(() => {
    const rnd = seeded(11)
    const list: Flower[] = []
    for (const [bx, bz, n] of beds) {
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2
        const d = Math.sqrt(rnd()) * 0.45
        list.push({
          x: bx + Math.cos(a) * d,
          z: bz + Math.sin(a) * d,
          h: 0.16 + rnd() * 0.14,
          s: 0.8 + rnd() * 0.5,
          r: rnd() * Math.PI,
          petals: PETAL_COLORS[Math.floor(rnd() * PETAL_COLORS.length)],
        })
      }
    }
    return list
  }, [beds])

  useLayoutEffect(() => {
    const o = new Object3D()
    const c = new Color()
    flowers.forEach((f, i) => {
      o.rotation.set(0, f.r, 0)
      o.scale.set(1, f.h / 0.2, 1)
      o.position.set(f.x, f.h / 2, f.z)
      o.updateMatrix()
      stems.current?.setMatrixAt(i, o.matrix)
      o.scale.setScalar(f.s * 1.6)
      o.position.set(f.x, f.h, f.z)
      o.updateMatrix()
      petals.current?.setMatrixAt(i, o.matrix)
      petals.current?.setColorAt(i, c.set(f.petals))
      o.position.set(f.x, f.h + 0.02 * f.s, f.z)
      o.updateMatrix()
      centers.current?.setMatrixAt(i, o.matrix)
    })
    for (const m of [stems.current, petals.current, centers.current]) {
      if (!m) continue
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  }, [flowers])

  const n = flowers.length
  return (
    <>
      <instancedMesh ref={stems} args={[undefined, undefined, n]} castShadow>
        <cylinderGeometry args={[0.008, 0.01, 0.2, 5]} />
        <meshStandardMaterial color="#4f8f3a" />
      </instancedMesh>
      {/* pétalas: um "asterisco" de 7 pontas, achatado (círculo de 14 lados
          com raio alternado ficaria caro; um cilindro baixo serve de longe) */}
      <instancedMesh ref={petals} args={[undefined, undefined, n]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.02, 7]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={centers} args={[undefined, undefined, n]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color="#f2b705" roughness={0.6} />
      </instancedMesh>
    </>
  )
}

// ---- Banco --------------------------------------------------------------------

/** Banco de madeira de três ripas com pés escuros (a frente olha para +z). */
export function Bench({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const L = 1.3
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CuboidCollider args={[L / 2, 0.24, 0.22]} position-y={0.24} />
      {[-0.13, 0, 0.13].map((z) => (
        <mesh key={z} position={[0, 0.44, z]} castShadow receiveShadow>
          <boxGeometry args={[L, 0.05, 0.11]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
      ))}
      {/* encosto */}
      {[0.62, 0.76].map((y) => (
        <mesh key={y} position={[0, y, -0.2]} rotation-x={-0.12} castShadow>
          <boxGeometry args={[L, 0.09, 0.04]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
      ))}
      {[-L / 2 + 0.12, L / 2 - 0.12].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.21, 0.1]} castShadow>
            <boxGeometry args={[0.07, 0.42, 0.07]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
          </mesh>
          <mesh position={[x, 0.4, -0.18]} castShadow>
            <boxGeometry args={[0.07, 0.8, 0.07]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </RigidBody>
  )
}
