import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { MeshStandardMaterial, type Mesh } from 'three'

// Teste do caminho "IA → site": saco de pancada gerado pelo Hunyuan3D-2.1 só
// com a forma (sem textura), depois da "dieta" com gltf-transform:
// 200 mil → 10 mil triângulos, 3,4 MB → 34 KB (simplify + meshopt).
// O drei já sabe descomprimir meshopt, então não precisa de mais nada.
const URL = '/models/test/bag-hunyuan.glb'

// O modelo tem ~2 unidades de altura com a origem no centro. 0,7 deixa o
// conjunto (saco + alças) com ~1,4 m, apoiado no chão.
const SCALE = 0.7
const HALF_HEIGHT = 0.997

const material = new MeshStandardMaterial({ color: '#d62828', roughness: 0.55 })

export function AiBag() {
  const { scene } = useGLTF(URL)

  // O arquivo veio sem normais (a informação de como a luz bate). Sem elas o
  // saco ficaria chapado; calculamos aqui e pintamos de vermelho.
  const bag = useMemo(() => {
    const copy = scene.clone()
    copy.traverse((obj) => {
      const mesh = obj as Mesh
      if (!mesh.isMesh) return
      mesh.geometry.computeVertexNormals()
      mesh.material = material
      mesh.castShadow = mesh.receiveShadow = true
    })
    return copy
  }, [scene])

  return (
    <RigidBody type="fixed" colliders={false}>
      <CylinderCollider args={[0.7, 0.27]} position={[0, 0.7, 0]} />
      <primitive object={bag} scale={SCALE} position-y={HALF_HEIGHT * SCALE} />
    </RigidBody>
  )
}

useGLTF.preload(URL)
