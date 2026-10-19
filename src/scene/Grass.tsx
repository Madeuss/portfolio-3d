import { useLayoutEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, IcosahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D, RepeatWrapping, SRGBColorSpace } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Grama no estilo do worawork: em vez de folhas em pé, o volume vem de uma
// textura pintada no chão (verde vivo, manchas e pinceladas curtas, como
// grama "amassada") e de moitinhas redondas e baixas espalhadas por cima.

export type Area = { x: [number, number]; z: [number, number] }

// Sorteio com semente: tudo cai sempre no mesmo lugar.
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

const inside = (x: number, z: number, a: Area) => x > a.x[0] && x < a.x[1] && z > a.z[0] && z < a.z[1]

// ---- Chão pintado ----------------------------------------------------------

const BASE = '#86b94f'
const LIGHT = [150, 200, 96]
const DARK = [92, 140, 52]

/** Textura de grama pintada, emendável, para um chão de `size` metros (1 repetição = `tile` metros). */
export function grassTexture(size: number, tile: number) {
  const s = 1024
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const rnd = seeded(5)
  g.fillStyle = BASE
  g.fillRect(0, 0, s, s)

  // desenha nos 9 vizinhos para a textura emendar sem costura ao repetir
  const wrapped = (draw: (ox: number, oy: number) => void) => {
    for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) draw(ox, oy)
  }

  // manchas grandes e suaves, mais claras e mais escuras
  for (let i = 0; i < 26; i++) {
    const x = rnd() * s
    const y = rnd() * s
    const r = 80 + rnd() * 160
    const [cr, cg, cb] = rnd() > 0.5 ? LIGHT : DARK
    wrapped((ox, oy) => {
      const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.45)`)
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
      g.fillStyle = grad
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
    })
  }

  // pinceladas curtas e deitadas: a grama "amassada"
  g.lineCap = 'round'
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * s
    const y = rnd() * s
    const len = 7 + rnd() * 10
    const a = -0.9 + rnd() * 0.5 // quase todas inclinadas para o mesmo lado
    const [cr, cg, cb] = rnd() > 0.45 ? LIGHT : DARK
    g.strokeStyle = `rgba(${cr},${cg},${cb},${0.35 + rnd() * 0.3})`
    g.lineWidth = 2 + rnd() * 2
    wrapped((ox, oy) => {
      if (x + ox < -20 || x + ox > s + 20 || y + oy < -20 || y + oy > s + 20) return
      g.beginPath()
      g.moveTo(x + ox, y + oy)
      g.quadraticCurveTo(x + ox + Math.cos(a) * len * 0.5 + 2, y + oy + Math.sin(a) * len * 0.5, x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len)
      g.stroke()
    })
  }

  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(size / tile, size / tile)
  t.anisotropy = 8
  return t
}

// ---- Moitinhas -------------------------------------------------------------

// Uma moitinha: 3 bolinhas achatadas encostadas, facetadas de leve.
function clumpGeometry() {
  const parts = [
    [0, 0.06, 0, 0.11],
    [0.09, 0.045, 0.03, 0.08],
    [-0.07, 0.04, -0.04, 0.075],
  ].map(([x, y, z, r]) => {
    const g = new IcosahedronGeometry(r, 1)
    g.scale(1, 0.8, 1)
    g.translate(x, y, z)
    return g
  })
  return mergeGeometries(parts)!
}

type Props = {
  /** Meia-largura da área onde as moitinhas nascem (terreno quadrado). */
  half: number
  /** Retângulos sem moitinhas. */
  clear: Area[]
  count?: number
}

export default function GrassClumps({ half, clear, count = 140 }: Props) {
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(clumpGeometry, [])
  const material = useMemo(() => new MeshStandardMaterial({ color: '#5f9b3e', roughness: 0.85, flatShading: true }), [])

  const placed = useMemo(() => {
    const rnd = seeded(42)
    const list: { x: number; z: number; s: number; r: number; tint: number }[] = []
    let tries = 0
    while (list.length < count && tries++ < count * 20) {
      const x = (rnd() * 2 - 1) * half
      const z = (rnd() * 2 - 1) * half
      if (clear.some((a) => inside(x, z, a))) continue
      list.push({ x, z, s: 0.8 + rnd() * 0.9, r: rnd() * Math.PI * 2, tint: 0.85 + rnd() * 0.3 })
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

  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow receiveShadow />
}
