import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Mesh } from 'three'
import Prop from './Prop'

// Canto do escritório (tarefa 1.5): mesa, setup do PC e cadeira, gerados no
// Tripo (itens 6, 7 e 8 de docs/assets-ia.md).
const DESK_URL = '/models/ai/06-mesa.glb'
const CHAIR_URL = '/models/ai/08-cadeira.glb'
const SETUP_URL = '/models/ai/07-setup-pc.glb'

// A mesa vem com 1 unidade de comprimento (0,5 de fundo, 0,58 de altura),
// com a frente virada para −X: o giro de 90° vira ela para a câmera.
// 1,3 deixa ela com 1,3 m × 0,65 m e o tampo a 76 cm do chão.
const DESK_SCALE = 1.3
const DESK_TOP = 0.583 * DESK_SCALE
const DESK_CENTER: [number, number, number] = [0.73, 0, -0.05]
const DESK_HALF = { x: 0.5 * DESK_SCALE, z: 0.25 * DESK_SCALE }

function Desk() {
  const { scene } = useGLTF(DESK_URL)

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
  }, [scene])

  return (
    <RigidBody type="fixed" colliders={false} position={DESK_CENTER}>
      <CuboidCollider args={[DESK_HALF.x, DESK_TOP / 2, DESK_HALF.z]} position={[0, DESK_TOP / 2, 0]} />
      <primitive object={scene} scale={DESK_SCALE} rotation-y={Math.PI / 2} />
    </RigidBody>
  )
}

export default function Office() {
  // Corpos fixos: o personagem esbarra nos móveis em vez de atravessar.
  return (
    <>
      <Desk />
      {/* Setup (monitores, teclado, gabinete) numa base só: 1 unidade de
          largura; 1,15 m, apoiado no tampo, um pouco para o fundo da mesa. */}
      <Prop url={SETUP_URL} scale={1.15} position={[DESK_CENTER[0], DESK_TOP, DESK_CENTER[2] - 0.08]} />
      {/* Cadeira de tela: 1 unidade de altura com o encosto de cabeça; 1,2 m.
          Vem de frente para +Z, então gira 180° para olhar para a mesa. */}
      <Prop url={CHAIR_URL} scale={1.2} position={[DESK_CENTER[0] + 0.1, 0, DESK_CENTER[2] + 0.75]} rotationY={Math.PI} />
    </>
  )
}

useGLTF.preload(DESK_URL)
useGLTF.preload(CHAIR_URL)
useGLTF.preload(SETUP_URL)
