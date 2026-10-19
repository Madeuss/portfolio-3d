import { useEffect } from 'react'
import {
  CanvasTexture,
  CylinderGeometry,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type Object3D,
} from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { resetToRest, type GltfNode } from './retarget'

// Nome e número nas costas da camisa ("MADEUS 9"). A textura do Tripo é
// picada em dezenas de pedaços, então em vez de pintar nela, o texto vai numa
// "plaquinha" curva presa ao osso das costas: acompanha todas as animações.
// Serve também para as camisas dos armários (MAGALU 7 etc.).

// Medidas tiradas da malha do avatar chibi em repouso (unidades do modelo,
// 1 = altura do boneco). O avatar olha para +Z, então as costas ficam em −Z.
const BONE = 'mixamorigSpine1'
// A câmera é alta e a cabeça do chibi tapa a parte de cima das costas: a
// estampa fica na faixa de baixo (0,31 a 0,44), logo acima do short.
const CENTER = new Vector3(0.002, 0.375, 0.0075) // eixo do tronco, meio da estampa
const RADIUS = 0.111 // do eixo até as costas, mais uma folga para não sumir no tecido
const HEIGHT = 0.13
const WIDTH = 0.17
// As costas inclinam para a frente conforme sobem (−0,105 → −0,085 em Z).
const TILT = (8 * Math.PI) / 180

type Props = { scene: Object3D; nodes: GltfNode[]; name: string; number: string }

function drawTexture(name: string, number: string) {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `800 ${size * 0.27}px Archivo, sans-serif`
  ctx.fillText(name, size / 2, size * 0.27, size * 0.98)
  ctx.font = `800 ${size * 0.66}px Archivo, sans-serif`
  ctx.fillText(number, size / 2, size * 0.96)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export default function JerseyPrint({ scene, nodes, name, number }: Props) {
  useEffect(() => {
    const bone = scene.getObjectByName(BONE)
    if (!bone) return

    // Pedaço de cilindro virado para trás (θ = π aponta para −Z).
    const arc = WIDTH / RADIUS
    const geometry = new CylinderGeometry(RADIUS, RADIUS, HEIGHT, 24, 1, true, Math.PI - arc / 2, arc)
    const material = new MeshStandardMaterial({ transparent: true, alphaTest: 0.5, roughness: 0.8 })
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = false

    let disposed = false
    // Espera a fonte Archivo carregar antes de desenhar o texto.
    document.fonts.load('800 100px Archivo').finally(() => {
      if (disposed) return
      material.map = drawTexture(name, number)
      material.needsUpdate = true
    })

    // Posição desejada no espaço do avatar em repouso → espaço local do osso.
    const rest = clone(scene)
    resetToRest(rest, nodes)
    rest.updateMatrixWorld(true)
    const restBone = rest.getObjectByName(BONE)!
    const placement = new Matrix4().compose(
      CENTER,
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), TILT),
      new Vector3(1, 1, 1),
    )
    const sceneInverse = rest.matrixWorld.clone().invert()
    const boneInScene = sceneInverse.multiply(restBone.matrixWorld)
    const local = boneInScene.invert().multiply(placement)
    local.decompose(mesh.position, mesh.quaternion, mesh.scale)

    bone.add(mesh)
    return () => {
      disposed = true
      bone.remove(mesh)
      geometry.dispose()
      material.map?.dispose()
      material.dispose()
    }
  }, [scene, nodes, name, number])

  return null
}
