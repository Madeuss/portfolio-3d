import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { CanvasTexture, SRGBColorSpace, type Mesh } from 'three'

// Armário do vestiário (item 4 de docs/assets-ia.md): gerado no Tripo a
// partir de docs/refs/04-armario.jpg. Um modelo, usado 3 vezes (Magalu,
// Jinboo, AutoSeg); cada uso é uma cópia da cena.
const URL = '/models/ai/04-armario.glb'
// Camisa lisa no cabide (item 5), pendurada na porta, com o nome da empresa
// e o 7 nas costas (como o "MADEUS 9" do avatar).
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

/** `shirt`: nome nas costas da camisa pendurada (com o 7); sem ele, sem camisa. */
type Props = { position: [number, number, number]; rotationY?: number; shirt?: string }

// Nome e número na camisa (a frente do modelo é a parte de trás da camisa,
// lisa): uma plaquinha logo à frente do tecido, em unidades do modelo da
// camisa. O corpo vai de x −0,2 a 0,2 e de y 0 a 0,75, com a frente em z ≈ 0,11.
const PRINT = { y: 0.4, z: 0.14, w: 0.3, h: 0.34 }
const NUMBER = '7'

function printTexture(name: string) {
  const size = 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = '#15161b'
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'
  g.font = `800 ${size * 0.2}px Archivo, sans-serif`
  g.fillText(name, size / 2, size * 0.24, size * 0.94)
  g.font = `800 ${size * 0.7}px Archivo, sans-serif`
  g.fillText(NUMBER, size / 2, size * 0.94)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}

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

export default function Locker({ position, rotationY = 0, shirt }: Props) {
  const copy = useCopy(URL)
  const shirtCopy = useCopy(SHIRT_URL)
  const print = useMemo(() => (shirt ? printTexture(shirt) : null), [shirt])

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CuboidCollider args={[HALF.x, HALF.y, HALF.z]} position={[0, HALF.y, 0]} />
      <primitive object={copy} scale={SCALE} />
      {shirt && (
        <group scale={SHIRT_SCALE} position={[0, SHIRT_HOOK - SHIRT_SCALE, HALF.z + SHIRT_DEPTH]}>
          <primitive object={shirtCopy} />
          <mesh position={[0, PRINT.y, PRINT.z]}>
            <planeGeometry args={[PRINT.w, PRINT.h]} />
            <meshStandardMaterial map={print} transparent alphaTest={0.4} roughness={0.9} />
          </mesh>
        </group>
      )}
    </RigidBody>
  )
}

useGLTF.preload(URL)
useGLTF.preload(SHIRT_URL)
