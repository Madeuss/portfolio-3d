import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import type { Mesh } from 'three'

// Suporte de chão do saco, em "Γ" (item 3 de docs/assets-ia.md): gerado no
// Tripo a partir de docs/refs/03-suporte-saco.jpg.
const URL = '/models/ai/03-suporte.glb'

// Medidas do modelo (1 unidade de altura, base em 0), tiradas da malha:
// o gancho fica na ponta do braço, a haste atrás dele.
const HOOK = { x: 0.051, y: 0.872, z: 0.238 }
const POST = { x: 0.051, z: -0.183, radius: 0.035 }
const BASE = { minX: -0.23, maxX: 0.23, minZ: -0.31, maxZ: 0.17, top: 0.054 }

// Altura do gancho no mundo: o saco (1,4 m com a corrente) fica com a base
// a ~30 cm do chão, na altura dos socos do chibi.
export const HOOK_HEIGHT = 1.7
const SCALE = HOOK_HEIGHT / HOOK.y

// O suporte se posiciona sozinho para o gancho ficar exatamente em cima do
// ponto (0, 0) do grupo, que é onde o saco está.
export default function BagStand() {
  const { scene } = useGLTF(URL)

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
  }, [scene])

  const s = SCALE
  const baseW = ((BASE.maxX - BASE.minX) / 2) * s
  const baseD = ((BASE.maxZ - BASE.minZ) / 2) * s
  const baseH = (BASE.top / 2) * s

  return (
    <group position={[-HOOK.x * s, 0, -HOOK.z * s]}>
      <RigidBody type="fixed" colliders={false}>
        {/* Haste */}
        <CylinderCollider args={[HOOK.y * s * 0.5, POST.radius * s]} position={[POST.x * s, HOOK.y * s * 0.5, POST.z * s]} />
        {/* Base: chapa baixa, dá para pisar nela */}
        <CuboidCollider
          args={[baseW, baseH, baseD]}
          position={[((BASE.minX + BASE.maxX) / 2) * s, baseH, ((BASE.minZ + BASE.maxZ) / 2) * s]}
        />
      </RigidBody>
      <primitive object={scene} scale={s} />
    </group>
  )
}

useGLTF.preload(URL)
