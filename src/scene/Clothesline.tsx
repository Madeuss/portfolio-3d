import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, DoubleSide, SRGBColorSpace, type Group } from 'three'

// Varal com dois postes de madeira e roupas penduradas: a amarela do Brasil
// de costas (só cores, sem escudo), uma camiseta branca e um samba-canção de
// bolinhas. Balançam com o vento.

type Piece =
  | { kind: 'shirt'; body: string; trim?: [string, string] }
  | { kind: 'shorts'; body: string; dots: string }

const PIECES: Piece[] = [
  { kind: 'shirt', body: '#f7d417', trim: ['#1fa14a', '#1d3fa8'] },
  { kind: 'shirt', body: '#f7f6f2' },
  { kind: 'shorts', body: '#8ec5f0', dots: '#ffffff' },
]

const W = 0.55 // largura de uma peça
const H = 0.62
const SAG = 0.08 // quanto a corda cai no meio

// Camiseta vista de costas: corpo, mangas curtas e a gola redonda.
function shirtPath() {
  const p = new Path2D()
  p.moveTo(96, 18)
  p.quadraticCurveTo(128, 30, 160, 18)
  p.lineTo(214, 40)
  p.lineTo(246, 96)
  p.lineTo(208, 112)
  p.lineTo(200, 96)
  p.lineTo(198, 244)
  p.lineTo(58, 244)
  p.lineTo(56, 96)
  p.lineTo(48, 112)
  p.lineTo(10, 96)
  p.lineTo(42, 40)
  p.closePath()
  return p
}

// Samba-canção: cós em cima e as duas pernas largas.
function shortsPath() {
  const p = new Path2D()
  p.moveTo(52, 30)
  p.lineTo(204, 30)
  p.lineTo(226, 200)
  p.lineTo(140, 212)
  p.lineTo(128, 120)
  p.lineTo(116, 212)
  p.lineTo(30, 200)
  p.closePath()
  return p
}

// Peça num canvas (fundo transparente).
function pieceTexture(piece: Piece) {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const shape = piece.kind === 'shirt' ? shirtPath() : shortsPath()
  g.save()
  g.clip(shape)
  g.fillStyle = piece.body
  g.fillRect(0, 0, s, s)
  if (piece.kind === 'shirt' && piece.trim) {
    // gola e punhos verdes com a beirada azul
    const [green, blue] = piece.trim
    g.lineCap = 'round'
    for (const [color, width] of [
      [blue, 16],
      [green, 10],
    ] as const) {
      g.strokeStyle = color
      g.lineWidth = width
      g.beginPath()
      g.moveTo(96, 16)
      g.quadraticCurveTo(128, 30, 160, 16)
      g.stroke()
      g.beginPath()
      g.moveTo(246, 96)
      g.lineTo(208, 112)
      g.moveTo(10, 96)
      g.lineTo(48, 112)
      g.stroke()
    }
  }
  if (piece.kind === 'shorts') {
    g.fillStyle = piece.dots
    for (let y = 50; y < 220; y += 26) {
      for (let x = (y / 26) % 2 ? 40 : 53; x < 230; x += 26) {
        g.beginPath()
        g.arc(x, y, 6, 0, Math.PI * 2)
        g.fill()
      }
    }
    // cós branco
    g.fillStyle = '#f7f6f2'
    g.fillRect(0, 30, s, 18)
  }
  g.restore()
  g.strokeStyle = 'rgba(0,0,0,0.25)'
  g.lineWidth = 3
  g.stroke(shape)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

const sag = (u: number) => -SAG * 4 * u * (1 - u)

type Props = { from: [number, number, number]; to: [number, number, number] }

export default function Clothesline({ from, to }: Props) {
  const maps = useMemo(() => PIECES.map(pieceTexture), [])
  const shirts = useRef<(Group | null)[]>([])
  const [x0, y0, z0] = from
  const [x1, y1, z1] = to
  const len = Math.hypot(x1 - x0, z1 - z0)
  const yaw = -Math.atan2(z1 - z0, x1 - x0)
  const rise = y1 - y0

  // Vento: cada camisa balança para a frente e para trás, defasada.
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    shirts.current.forEach((g, i) => {
      if (g) g.rotation.x = Math.sin(t * 1.7 + i * 1.3) * 0.12 + Math.sin(t * 3.1 + i) * 0.03
    })
  })

  return (
    <group position={from} rotation-y={yaw}>
      {/* postes nas pontas, com a travessa onde a corda amarra */}
      {[
        [0, y0],
        [len, y1],
      ].map(([x, top]) => (
        <group key={x} position-x={x}>
          <mesh position-y={-top / 2 + 0.06} castShadow>
            <cylinderGeometry args={[0.035, 0.045, top + 0.12, 8]} />
            <meshStandardMaterial color="#8a5a2b" roughness={0.9} />
          </mesh>
          <mesh position-y={0.04} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
            <meshStandardMaterial color="#8a5a2b" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* corda, em 4 pedaços para cair um pouco no meio */}
      {[0, 1, 2, 3].map((k) => {
        const a = k / 4
        const b = (k + 1) / 4
        const ya = rise * a + sag(a)
        const yb = rise * b + sag(b)
        const dx = (b - a) * len
        return (
          <mesh key={k} position={[((a + b) / 2) * len, (ya + yb) / 2, 0]} rotation-z={Math.atan2(yb - ya, dx) + Math.PI / 2}>
            <cylinderGeometry args={[0.008, 0.008, Math.hypot(dx, yb - ya), 5]} />
            <meshStandardMaterial color="#efe6d3" />
          </mesh>
        )
      })}
      {PIECES.map((_, i) => {
        const u = (i + 1) / (PIECES.length + 1)
        return (
          <group key={i} position={[u * len, rise * u + sag(u), 0]}>
            <group ref={(g) => void (shirts.current[i] = g)}>
              <mesh position-y={-H / 2 + 0.02} castShadow>
                <planeGeometry args={[W, H]} />
                <meshStandardMaterial map={maps[i]} transparent alphaTest={0.5} side={DoubleSide} roughness={0.95} />
              </mesh>
            </group>
            {/* prendedores */}
            {[-0.1, 0.1].map((dx) => (
              <mesh key={dx} position={[dx, -0.02, 0]}>
                <boxGeometry args={[0.02, 0.06, 0.025]} />
                <meshStandardMaterial color="#b98552" />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}
