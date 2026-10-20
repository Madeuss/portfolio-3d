import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { AdditiveBlending, CanvasTexture, SRGBColorSpace } from 'three'
import { player } from '../state/player'

// Janela nas paredes do interior: moldura preta (como as da fachada), uma
// vista do quintal pintada atrás do vidro que desliza um pouco conforme o
// personagem anda (dá sensação de profundidade), uma mancha de sol no chão e,
// se pedir, cortinas.

const FRAME = '#16171b'
const BAR = 0.06
const DEPTH = 0.08

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

// Vista: céu claro, copas redondas de árvores ao fundo, cerca de madeira e grama.
function viewTexture(seed: number) {
  const w = 512
  const h = 320
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const rnd = seeded(seed)
  const sky = g.createLinearGradient(0, 0, 0, h * 0.7)
  sky.addColorStop(0, '#9fd3f2')
  sky.addColorStop(1, '#e3f3fb')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  // nuvens
  g.fillStyle = 'rgba(255,255,255,0.9)'
  for (let i = 0; i < 3; i++) {
    const x = rnd() * w
    const y = 30 + rnd() * 50
    for (let k = 0; k < 4; k++) {
      g.beginPath()
      g.arc(x + k * 22, y + (k % 2) * 6, 18 + rnd() * 8, 0, Math.PI * 2)
      g.fill()
    }
  }
  // copas de árvores, duas camadas (a de trás mais clara)
  for (const [tone, base, size] of [
    ['#8cc77a', 205, 46],
    ['#5f9e4f', 228, 40],
  ] as const) {
    g.fillStyle = tone
    for (let x = -20; x < w + 40; x += size * 1.2 + rnd() * 30) {
      const y = base - rnd() * 30
      g.beginPath()
      g.arc(x, y, size + rnd() * 14, 0, Math.PI * 2)
      g.arc(x + size * 0.7, y + 12, size * 0.8, 0, Math.PI * 2)
      g.fill()
    }
  }
  // grama e cerca
  g.fillStyle = '#86b94f'
  g.fillRect(0, 238, w, h - 238)
  g.fillStyle = '#b98552'
  g.fillRect(0, 250, w, 9)
  g.fillRect(0, 272, w, 9)
  for (let x = 6; x < w; x += 34) g.fillRect(x, 238, 10, 58)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.repeat.set(0.8, 1)
  return t
}

// Cortina: tecido bege com pregas (um plano ondulado em zigue-zague).
function Curtain({ x, height }: { x: number; height: number }) {
  return (
    <group position={[x, 0, 0.09]}>
      {[-0.09, -0.03, 0.03, 0.09].map((dx, i) => (
        <mesh key={dx} position={[dx, -height / 2, i % 2 ? 0.02 : 0]} castShadow>
          <boxGeometry args={[0.07, height, 0.03]} />
          <meshStandardMaterial color={i % 2 ? '#e3d4bd' : '#eadcc6'} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

type Props = {
  /** Centro da janela na face de dentro da parede. */
  position: [number, number, number]
  /** Giro: 0 = parede do fundo (olha para +z); −π/2 = parede leste. */
  rotationY?: number
  width: number
  height: number
  curtains?: boolean
  seed?: number
}

export default function InteriorWindow({ position, rotationY = 0, width, height, curtains = false, seed = 1 }: Props) {
  const view = useMemo(() => viewTexture(seed), [seed])
  const parallax = useMemo(() => ({ x: position[0], z: position[2], r: rotationY }), [position, rotationY])

  // Vista desliza ao contrário do personagem, só um pouco.
  useFrame(() => {
    const along = parallax.r === 0 ? player.pos.x - parallax.x : player.pos.z - parallax.z
    view.offset.x = 0.1 + Math.max(-0.1, Math.min(0.1, -along * 0.025))
  })

  const w = width
  const h = height
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position-z={0.002}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={view} toneMapped={false} />
      </mesh>
      {/* reflexo leve no vidro */}
      <mesh position-z={0.01}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </mesh>
      {/* moldura: 4 lados e a travessa do meio */}
      {[
        [0, h / 2, w + BAR * 2, BAR],
        [0, -h / 2, w + BAR * 2, BAR],
        [-w / 2, 0, BAR, h],
        [w / 2, 0, BAR, h],
        [0, 0, BAR * 0.6, h],
      ].map(([x, y, bw, bh], i) => (
        <mesh key={i} position={[x, y, DEPTH / 2]} castShadow>
          <boxGeometry args={[bw, bh, DEPTH]} />
          <meshStandardMaterial color={FRAME} roughness={0.4} />
        </mesh>
      ))}
      {/* peitoril */}
      <RoundedBox args={[w + BAR * 3, 0.04, 0.16]} radius={0.012} position={[0, -h / 2 - BAR / 2 - 0.02, 0.08]} castShadow>
        <meshStandardMaterial color="#f2efe9" roughness={0.8} />
      </RoundedBox>
      {curtains && (
        <>
          {/* varão e as duas cortinas abertas, dos lados */}
          <mesh position={[0, h / 2 + 0.14, 0.12]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.015, 0.015, w + 0.7, 8]} />
            <meshStandardMaterial color={FRAME} roughness={0.4} />
          </mesh>
          <group position-y={h / 2 + 0.14}>
            <Curtain x={-w / 2 - 0.16} height={h + 0.5} />
            <Curtain x={w / 2 + 0.16} height={h + 0.5} />
          </group>
        </>
      )}
    </group>
  )
}

/** Mancha de sol no chão, em frente a uma janela (x, z do centro; largura e fundo). */
export function SunPatch({ position, size, rotationY = 0 }: { position: [number, number]; size: [number, number]; rotationY?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, rotationY]} position={[position[0], 0.014, position[1]]}>
      <planeGeometry args={size} />
      <meshBasicMaterial color="#ffcf7a" transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}
