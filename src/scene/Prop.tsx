import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
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
  /** Raio (m) de um tronco no lugar da caixa: árvores não bloqueiam a copa toda. */
  trunk?: number
  /** Altura mínima da colisão (m). Móveis baixos (bancos) precisam: a cápsula
      do personagem flutua 30 cm e subia neles em vez de esbarrar. */
  minHeight?: number
  /** Caixas de colisão sob medida, em unidades do modelo ([xmin, ymin, zmin,
      xmax, ymax, zmax]), no lugar da caixa única do tamanho do modelo. */
  boxes?: [number, number, number, number, number, number][]
}

export default function Prop({ url, scale, position, rotationY = 0, trunk, minHeight = 0, boxes }: Props) {
  const { scene } = useGLTF(url)
  const { copy, half, center } = useMemo(() => {
    const c = scene.clone()
    c.traverse((obj) => {
      if ((obj as Mesh).isMesh) obj.castShadow = obj.receiveShadow = true
    })
    const box = new Box3().setFromObject(c)
    box.max.y = Math.max(box.max.y, minHeight / scale)
    return {
      copy: c,
      half: box.getSize(new Vector3()).multiplyScalar(scale / 2),
      center: box.getCenter(new Vector3()).multiplyScalar(scale),
    }
  }, [scene, scale, minHeight])

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      {boxes ? (
        boxes.map(([x0, y0, z0, x1, y1, z1], i) => (
          <CuboidCollider
            key={i}
            args={[((x1 - x0) * scale) / 2, ((y1 - y0) * scale) / 2, ((z1 - z0) * scale) / 2]}
            position={[((x0 + x1) * scale) / 2, ((y0 + y1) * scale) / 2, ((z0 + z1) * scale) / 2]}
          />
        ))
      ) : trunk ? (
        <CylinderCollider args={[half.y, trunk]} position={[0, half.y, 0]} />
      ) : (
        <CuboidCollider args={[half.x, half.y, half.z]} position={[center.x, center.y, center.z]} />
      )}
      <primitive object={copy} scale={scale} />
    </RigidBody>
  )
}
