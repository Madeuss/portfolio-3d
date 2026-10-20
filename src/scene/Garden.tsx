import { useMemo } from 'react'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { CanvasTexture, SRGBColorSpace } from 'three'

// Enfeites do quintal feitos em código: a placa MADEUS no portão e um banco de
// madeira perto do lago. (Os postes e as flores viraram modelos: YardModels.)

const WOOD = '#b98552'
const WOOD_DARK = '#7a4f27'

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

// ---- Banco --------------------------------------------------------------------

/** Banco de madeira de três ripas com pés escuros (a frente olha para +z). */
export function Bench({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const L = 1.3
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      {/* colisão mais alta que o banco: a cápsula do personagem flutua 30 cm
          e, com um banco baixo, subia nele em vez de esbarrar */}
      <CuboidCollider args={[L / 2, 0.5, 0.22]} position-y={0.5} />
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
