import { useMemo, useRef } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import { ExtrudeGeometry, Matrix4, MeshStandardMaterial, Quaternion, Shape, Vector3, type Group, type Object3D } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { resetToRest, type GltfNode } from './retarget'
import { useGame } from '../state/game'

// Estrelinhas girando em volta da cabeça quando o personagem fica tonto
// (4 hurricane kicks seguidos). Ficam presas ao osso da cabeça, então
// balançam junto quando ele cambaleia.

const HEAD = 'mixamorigHead'
// Altura do anel (unidades do modelo, 1 = altura do boneco) e raio dele. A
// cabeça do chibi é bem maior que o esqueleto (o osso do topo da cabeça fica
// em 0,66 e o cabelo vai até 1,0), então a altura é a do topo da malha.
const HEIGHT = 1.03
const RADIUS = 0.2
const COUNT = 5
// Giro do anel (rad/s), tamanho de cada estrela e rapidez do aparecer/sumir.
const SPIN = 2.6
const SIZE = 0.045
const GROW = 8

function starShape(points = 5, outer = 1, inner = 0.45) {
  const shape = new Shape()
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return shape
}

const geometry = new ExtrudeGeometry(starShape(), { depth: 0.35, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2 })
geometry.center()
const material = new MeshStandardMaterial({ color: '#FFD23F', emissive: '#FFB800', emissiveIntensity: 0.6, roughness: 0.4 })

type Props = { scene: Object3D; nodes: GltfNode[] }

export default function DizzyStars({ scene, nodes }: Props) {
  const ring = useRef<Group>(null)
  const size = useRef(0)
  const head = scene.getObjectByName(HEAD)

  // Onde fica o anel no espaço do osso da cabeça: medido no avatar em
  // repouso, em pé (o osso tem giro próprio, então desfazemos esse giro).
  const placement = useMemo(() => {
    const rest = clone(scene)
    resetToRest(rest, nodes)
    rest.updateMatrixWorld(true)
    const restHead = rest.getObjectByName(HEAD)
    if (!restHead) return null
    const center = restHead.getWorldPosition(new Vector3()).setY(HEIGHT)
    const wanted = new Matrix4().compose(center, new Quaternion(), new Vector3(1, 1, 1))
    const local = restHead.matrixWorld.clone().invert().multiply(wanted)
    const position = new Vector3()
    const quaternion = new Quaternion()
    const scale = new Vector3()
    local.decompose(position, quaternion, scale)
    return { position, quaternion, scale }
  }, [scene, nodes])

  useFrame((_, delta) => {
    const g = ring.current
    if (!g) return
    // Cresce ao ficar tonto e encolhe ao passar.
    const target = useGame.getState().dizzy ? 1 : 0
    size.current += (target - size.current) * (1 - Math.exp(-GROW * delta))
    g.visible = size.current > 0.01
    g.scale.setScalar(size.current)
    g.rotation.y += SPIN * delta
    // Cada estrela gira em volta de si também.
    for (const star of g.children) star.rotation.y += SPIN * 1.5 * delta
  })

  if (!head || !placement) return null

  return createPortal(
    <group position={placement.position} quaternion={placement.quaternion} scale={placement.scale}>
      <group ref={ring} visible={false}>
        {Array.from({ length: COUNT }, (_, i) => {
          const a = (i / COUNT) * Math.PI * 2
          // Alturas alternadas, para o anel parecer ondulado.
          const y = i % 2 === 0 ? 0.015 : -0.015
          return (
            <mesh
              key={i}
              geometry={geometry}
              material={material}
              position={[Math.cos(a) * RADIUS, y, Math.sin(a) * RADIUS]}
              scale={SIZE}
            />
          )
        })}
      </group>
    </group>,
    head,
  )
}
