import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import type { Mesh } from 'three'

// Saco de pancada (item 2 de docs/assets-ia.md): gerado no Tripo a partir de
// docs/refs/02-saco.jpg. Depois da dieta: textura 1024 em WebP + meshopt.
const URL = '/models/ai/02-saco.glb'

// O modelo vem com 1 unidade de altura (corrente incluída), com a base em 0.
// 1,4 deixa o conjunto com 1,4 m, apoiado no chão até o suporte (item 3)
// chegar; aí ele sobe e fica pendurado no gancho.
const SCALE = 1.4
// Raio do saco no modelo (0,167) × escala, arredondado para cima.
const RADIUS = 0.24
// Só o corpo do saco colide; a corrente fica de fora.
const BODY_HEIGHT = 1.0

export default function PunchingBag() {
  const { scene } = useGLTF(URL)

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
  }, [scene])

  return (
    <RigidBody type="fixed" colliders={false}>
      <CylinderCollider args={[BODY_HEIGHT / 2, RADIUS]} position={[0, BODY_HEIGHT / 2, 0]} />
      <primitive object={scene} scale={SCALE} />
    </RigidBody>
  )
}

useGLTF.preload(URL)
