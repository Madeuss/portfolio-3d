import { useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import { stoneTexture } from './Pond'

// Caminho do portão até a casa: pedras chatas de passagem na grama, como no
// worawork. Cada pedra é um polígono arredondado e torto, com borda boleada,
// desencontrada das vizinhas. Só desenho: são baixas, o personagem pisa por cima.

const GAP = 0.62 // distância entre pedras ao longo do caminho
const SIZE = 0.5 // largura média de uma pedra

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

// Contorno de uma pedra: 8 pontos num círculo com raio sorteado, alisados.
function stoneShape(rnd: () => number, r: number) {
  const n = 8
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const k = r * (0.8 + rnd() * 0.3)
    return [Math.cos(a) * k * 1.15, Math.sin(a) * k] as const
  })
  const s = new Shape()
  // curvas passando pelos pontos médios: cantos redondos
  const mid = (i: number) => {
    const [ax, ay] = pts[i % n]
    const [bx, by] = pts[(i + 1) % n]
    return [(ax + bx) / 2, (ay + by) / 2] as const
  }
  s.moveTo(...mid(0))
  for (let i = 1; i <= n; i++) s.quadraticCurveTo(pts[i % n][0], pts[i % n][1], ...mid(i))
  return s
}

type Props = { from: number; to: number }

export default function SteppingStones({ from, to }: Props) {
  const map = useMemo(stoneTexture, [])
  const stones = useMemo(() => {
    const rnd = seeded(31)
    const list = []
    for (let z = from + GAP / 2, i = 0; z < to; z += GAP, i++) {
      const geometry = new ExtrudeGeometry(stoneShape(rnd, SIZE / 2), {
        depth: 0.02,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.03,
        bevelSegments: 3,
        curveSegments: 6,
      })
      list.push({
        geometry,
        x: (i % 2 ? 0.16 : -0.16) + (rnd() - 0.5) * 0.1,
        z: z + (rnd() - 0.5) * 0.08,
        rot: rnd() * Math.PI,
        tone: rnd() > 0.5 ? '#efe7d8' : '#e2d8c6',
      })
    }
    return list
  }, [from, to])

  return (
    <>
      {stones.map((s, i) => (
        <mesh
          key={i}
          geometry={s.geometry}
          position={[s.x, 0.005, s.z]}
          rotation={[-Math.PI / 2, 0, s.rot]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial map={map} bumpMap={map} bumpScale={1.2} color={s.tone} roughness={1} />
        </mesh>
      ))}
    </>
  )
}
