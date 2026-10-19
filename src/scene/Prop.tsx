import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Box3, Vector3, type Mesh } from 'three'

// Móvel gerado por IA (public/models/ai), parado no chão, com uma caixa de
// colisão do tamanho dele. Cada uso é uma cópia da cena, então o mesmo
// modelo pode aparecer várias vezes.

type Props = {
  url: string
  /** Os modelos do Tripo vêm com 1 unidade no maior lado: escala = esse lado em metros. */
  scale: number
  position: [number, number, number]
  rotationY?: number
}

export default function Prop({ url, scale, position, rotationY = 0 }: Props) {
  const { scene } = useGLTF(url)
  const { copy, half, center } = useMemo(() => {
    const c = scene.clone()
    c.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
    const box = new Box3().setFromObject(c)
    return {
      copy: c,
      half: box.getSize(new Vector3()).multiplyScalar(scale / 2),
      center: box.getCenter(new Vector3()).multiplyScalar(scale),
    }
  }, [scene, scale])

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CuboidCollider args={[half.x, half.y, half.z]} position={[center.x, center.y, center.z]} />
      <primitive object={copy} scale={scale} />
    </RigidBody>
  )
}
