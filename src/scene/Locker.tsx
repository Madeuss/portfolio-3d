import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Mesh } from 'three'

// Armário do vestiário (item 4 de docs/assets-ia.md): gerado no Tripo a
// partir de docs/refs/04-armario.jpg. Um modelo, usado 3 vezes (Magalu,
// Jinboo, AutoSeg); cada uso é uma cópia da cena.
const URL = '/models/ai/04-armario.glb'
// Camisa lisa no cabide (item 5), pendurada na porta: o nome e o número
// entram depois, como no "MADEUS 9" das costas do avatar.
const SHIRT_URL = '/models/ai/05-camisa.glb'
// 1 unidade de altura com o cabide; 0,8 deixa ela com 80 cm, o gancho do
// cabide a 1,65 m do chão, encostada na frente da porta.
const SHIRT_SCALE = 0.8
const SHIRT_HOOK = 1.65
const SHIRT_DEPTH = 0.13 * SHIRT_SCALE

// O modelo vem com 1 unidade de altura (0,33 × 0,30 de base); 1,8 deixa
// ele com 1,8 m, como um armário de vestiário de verdade.
const SCALE = 1.8
const HALF = { x: 0.164 * SCALE, y: 0.5 * SCALE, z: 0.15 * SCALE }

type Props = { position: [number, number, number]; rotationY?: number; shirt?: boolean }

function useCopy(url: string) {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const c = scene.clone()
    c.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
    return c
  }, [scene])
}

export default function Locker({ position, rotationY = 0, shirt = false }: Props) {
  const copy = useCopy(URL)
  const shirtCopy = useCopy(SHIRT_URL)

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CuboidCollider args={[HALF.x, HALF.y, HALF.z]} position={[0, HALF.y, 0]} />
      <primitive object={copy} scale={SCALE} />
      {shirt && (
        <primitive
          object={shirtCopy}
          scale={SHIRT_SCALE}
          position={[0, SHIRT_HOOK - SHIRT_SCALE, HALF.z + SHIRT_DEPTH]}
        />
      )}
    </RigidBody>
  )
}

useGLTF.preload(URL)
useGLTF.preload(SHIRT_URL)
