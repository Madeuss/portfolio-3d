import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'

// Grama do terreno: tufinhos (3 folhas cruzadas) espalhados num InstancedMesh,
// que desenha todos de uma vez só, balançando com um vento leve no shader.
// Fora das áreas livres (caminho, casa, campo...), que vêm de quem usa.

export type Area = { x: [number, number]; z: [number, number] }

const BLADE_H = 0.12
const BLADE_W = 0.045

// Um tufo: 5 folhas triangulares em leque, levemente inclinadas.
// A cor vai do verde-escuro na base ao claro na ponta.
function tuftGeometry() {
  const pos: number[] = []
  const col: number[] = []
  const base = new Color('#4f9a3c')
  const tip = new Color('#9fd86a')
  const BLADES = 5
  for (let k = 0; k < BLADES; k++) {
    const a = (k * Math.PI) / BLADES
    const cx = Math.cos(a) * BLADE_W
    const cz = Math.sin(a) * BLADE_W
    // cada folha tomba para um lado, saindo de um ponto um pouco deslocado
    const ox = Math.cos(a * 2.3) * 0.03
    const oz = Math.sin(a * 2.3) * 0.03
    const lean = 0.06 * Math.cos(a * 3.1)
    const h = BLADE_H * (0.7 + ((k * 37) % 5) * 0.12)
    pos.push(ox - cx, 0, oz - cz, ox + cx, 0, oz + cz, ox + lean, h, oz + lean * 0.6)
    col.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

// Sorteio com semente: os tufos caem sempre no mesmo lugar.
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

const inside = (x: number, z: number, a: Area) => x > a.x[0] && x < a.x[1] && z > a.z[0] && z < a.z[1]

type Props = {
  /** Meia-largura da área onde a grama nasce (terreno quadrado). */
  half: number
  /** Retângulos sem grama. */
  clear: Area[]
  count?: number
}

export default function Grass({ half, clear, count = 9000 }: Props) {
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(tuftGeometry, [])
  const time = useRef({ value: 0 })

  const material = useMemo(() => {
    const m = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.9 })
    // Vento: a ponta de cada folha (y alto) oscila; a fase muda com a posição
    // do tufo no mundo, para não balançar tudo junto.
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = time.current
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vec4 worldBase = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float sway = sin(uTime * 1.6 + worldBase.x * 0.7 + worldBase.z * 0.5) * 0.04;
          transformed.x += sway * position.y / ${BLADE_H.toFixed(2)};`,
        )
    }
    return m
  }, [])

  useFrame((_, delta) => {
    time.current.value += delta
  })

  const placed = useMemo(() => {
    const rnd = seeded(42)
    const list: { x: number; z: number; s: number; r: number; tint: number }[] = []
    let tries = 0
    while (list.length < count && tries++ < count * 6) {
      const x = (rnd() * 2 - 1) * half
      const z = (rnd() * 2 - 1) * half
      if (clear.some((a) => inside(x, z, a))) continue
      list.push({ x, z, s: 0.8 + rnd() * 0.8, r: rnd() * Math.PI * 2, tint: 0.85 + rnd() * 0.25 })
    }
    return list
  }, [half, clear, count])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new Object3D()
    const c = new Color()
    placed.forEach(({ x, z, s, r, tint }, i) => {
      o.position.set(x, 0, z)
      o.rotation.set(0, r, 0)
      o.scale.setScalar(s)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
      mesh.setColorAt(i, c.setScalar(tint))
    })
    mesh.count = placed.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [placed])

  return <instancedMesh ref={ref} args={[geometry, material, count]} receiveShadow frustumCulled={false} />
}

/** Manchas suaves mais claras e mais escuras para o chão não ficar liso. */
export function groundPatches() {
  const s = 512
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  g.fillStyle = '#f2f2f2'
  g.fillRect(0, 0, s, s)
  const rnd = seeded(9)
  for (let i = 0; i < 40; i++) {
    const x = rnd() * s
    const y = rnd() * s
    const r = 30 + rnd() * 90
    const light = rnd() > 0.5
    // desenha 9 vezes (vizinhos) para a textura emendar sem costura ao repetir
    for (const dx of [-s, 0, s]) {
      for (const dy of [-s, 0, s]) {
        const grad = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r)
        grad.addColorStop(0, light ? 'rgba(255,255,255,0.18)' : 'rgba(150,170,140,0.1)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = grad
        g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2)
      }
    }
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(3, 3)
  return t
}
