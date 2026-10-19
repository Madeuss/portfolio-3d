import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// Casca do interior (docs/conceito.md, "dentro = madeusdev"): a casa sem teto
// numa laje, com o piso de cada cômodo diferente, paredes off-white e o fundo
// azul #0A3FB8 com o halftone da hero do madeusdev.

export const HALF = 5 // casa de 10 × 10 m
const WALL = 0.2 // espessura das paredes
const WALL_HEIGHT = 2.2
// A parede da frente (sul) é baixa: a câmera olha por cima dela.
const FRONT_HEIGHT = 0.45
const DOOR = 0.8 // meia-largura da porta (sul, no meio)
const SLAB = 0.35 // espessura da laje

const OFF_WHITE = '#FAFAF7'
export const BLUE = '#0A3FB8'

// ---- Texturas desenhadas num canvas (sem arquivos) ---------------------

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat: [number, number]) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d')!, size)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(...repeat)
  t.anisotropy = 4
  return t
}

// Sorteio com semente: a textura sai sempre igual a cada carregamento.
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

// Piso laminado: tábuas de 20 cm × 1,2 m no sentido norte-sul, emendas
// desencontradas, tom variando de tábua a tábua, veios e alguns nós.
// `tones`: cores das tábuas; `grain`: cor dos veios e emendas.
// 1 repetição = 2 m.
const laminate = (tones: string[], grain: string, seed: number) => (w: number, d: number) =>
  canvasTexture(1024, (g, s) => {
    const rnd = seeded(seed)
    const cols = 10
    const cw = s / cols
    const len = s * 0.6
    for (let c = 0; c < cols; c++) {
      const start = -rnd() * len
      for (let y = start; y < s; y += len) {
        const x = c * cw
        g.fillStyle = tones[Math.floor(rnd() * tones.length)]
        g.fillRect(x, y, cw, len)
        // veios: riscos finos ao comprido
        g.strokeStyle = grain
        for (let k = 0; k < 14; k++) {
          g.globalAlpha = 0.05 + rnd() * 0.12
          g.lineWidth = 0.6 + rnd() * 1.6
          const gx = x + 3 + rnd() * (cw - 6)
          g.beginPath()
          g.moveTo(gx, y)
          g.bezierCurveTo(gx + rnd() * 6 - 3, y + len / 3, gx + rnd() * 6 - 3, y + (2 * len) / 3, gx + rnd() * 4 - 2, y + len)
          g.stroke()
        }
        // nó, às vezes
        if (rnd() < 0.35) {
          g.globalAlpha = 0.25
          g.fillStyle = grain
          g.beginPath()
          g.ellipse(x + cw * (0.3 + rnd() * 0.4), y + rnd() * len, 3 + rnd() * 3, 5 + rnd() * 4, 0, 0, Math.PI * 2)
          g.fill()
        }
        g.globalAlpha = 0.55
        g.fillStyle = grain
        g.fillRect(x, y, cw, 1.5) // emenda da ponta
        g.globalAlpha = 1
      }
      g.globalAlpha = 0.5
      g.fillStyle = grain
      g.fillRect(c * cw, 0, 1.5, s) // emenda do lado
      g.globalAlpha = 1
    }
  }, [w / 2, d / 2])

// Quarto e escritório: laminado claro acinzentado.
const lightWood = laminate(['#d9d6d0', '#d2cec7', '#e0ddd8', '#cbc7c0', '#d6d2cb'], '#8f8a83', 7)
// Corredor: madeira escura.
const darkWood = laminate(['#5b4030', '#503827', '#644636', '#4a3324', '#573c2c'], '#2a1c13', 11)

// Tatame preto: placas de 1 × 2 m em dois tons, com a emenda mais escura.
// 1 repetição = 2 m.
const tatami = (w: number, d: number) =>
  canvasTexture(256, (g, s) => {
    g.fillStyle = '#0c0c0e'
    g.fillRect(0, 0, s, s)
    const m = 3
    g.fillStyle = '#1d1d21'
    g.fillRect(m, m, s / 2 - 2 * m, s - 2 * m)
    g.fillStyle = '#25252a'
    g.fillRect(s / 2 + m, m, s / 2 - 2 * m, s - 2 * m)
  }, [w / 2, d / 2])

// Piso de vestiário: azulejo claro com rejunte cinza. 1 repetição = 0,5 m.
const tiles = (w: number, d: number) =>
  canvasTexture(128, (g, s) => {
    g.fillStyle = '#c9cdd2'
    g.fillRect(0, 0, s, s)
    g.fillStyle = '#eef0f2'
    g.fillRect(2, 2, s - 4, s - 4)
  }, [w * 2, d * 2])

// Halftone da hero: bolinhas azul-claras que crescem para as bordas, sobre o azul.
function halftone() {
  return canvasTexture(2048, (g, s) => {
    g.fillStyle = BLUE
    g.fillRect(0, 0, s, s)
    const step = 16
    g.fillStyle = '#2a5ad0'
    for (let y = step / 2; y < s; y += step) {
      for (let x = step / 2; x < s; x += step) {
        const r = Math.hypot(x - s / 2, y - s / 2) / (s / 2)
        const radius = Math.max(0, Math.min(1, (r - 0.22) / 0.6)) * step * 0.42
        if (radius < 0.5) continue
        g.beginPath()
        g.arc(x, y, radius, 0, Math.PI * 2)
        g.fill()
      }
    }
  }, [1, 1])
}

// ---- Peças ------------------------------------------------------------

type Room = { x: [number, number]; z: [number, number]; texture: (w: number, d: number) => CanvasTexture }

// Cômodos da planta (−z = norte). O corredor é a faixa do meio.
const ROOMS: Room[] = [
  { x: [-4.8, -0.6], z: [-4.8, -0.6], texture: tatami }, // academia
  { x: [0.6, 4.8], z: [-4.8, -0.6], texture: lightWood }, // quarto
  { x: [0.6, 4.8], z: [0.6, 4.8], texture: lightWood }, // escritório
  { x: [-4.8, -0.6], z: [0.6, 4.8], texture: tiles }, // vestiário
]

function Floors() {
  const floors = useMemo(
    () => [
      ...ROOMS.map((r) => ({ ...r, map: r.texture(r.x[1] - r.x[0], r.z[1] - r.z[0]), y: 0.004 })),
      // corredor e o resto da laje
      { x: [-HALF, HALF], z: [-HALF, HALF], map: darkWood(HALF * 2, HALF * 2), y: 0.002 },
    ],
    [],
  )
  return (
    <>
      {floors.map(({ x, z, map, y }, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[(x[0] + x[1]) / 2, y, (z[0] + z[1]) / 2]} receiveShadow>
          <planeGeometry args={[x[1] - x[0], z[1] - z[0]]} />
          <meshStandardMaterial map={map} roughness={0.85} />
        </mesh>
      ))}
    </>
  )
}

type Box = { c: [number, number, number]; h: [number, number, number] }

function Walls() {
  const walls = useMemo<Box[]>(() => {
    const e = HALF - WALL / 2
    const side = (HALF - DOOR) / 2
    const H = WALL_HEIGHT / 2
    const F = FRONT_HEIGHT / 2
    return [
      { c: [0, H, -e], h: [HALF, H, WALL / 2] }, // norte
      { c: [-e, H, 0], h: [WALL / 2, H, HALF - WALL] }, // oeste
      { c: [e, H, 0], h: [WALL / 2, H, HALF - WALL] }, // leste
      { c: [-DOOR - side, F, e], h: [side, F, WALL / 2] }, // sul, dos dois lados da porta
      { c: [DOOR + side, F, e], h: [side, F, WALL / 2] },
    ]
  }, [])
  return (
    <RigidBody type="fixed" colliders={false}>
      {walls.map(({ c, h }, i) => (
        <group key={i}>
          <CuboidCollider args={h} position={c} />
          <mesh position={c} castShadow receiveShadow>
            <boxGeometry args={[h[0] * 2, h[1] * 2, h[2] * 2]} />
            <meshStandardMaterial color={OFF_WHITE} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Porta fechada: só se sai pelo capacho (E). */}
      <CuboidCollider args={[DOOR, 1, WALL / 2]} position={[0, 1, HALF - WALL / 2]} />
      {/* Laje: o chão da física e a borda grossa da "maquete". */}
      <CuboidCollider args={[HALF, SLAB / 2, HALF]} position={[0, -SLAB / 2, 0]} />
      <mesh position-y={-SLAB / 2} receiveShadow>
        <boxGeometry args={[HALF * 2 + 0.02, SLAB, HALF * 2 + 0.02]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.9} />
      </mesh>
    </RigidBody>
  )
}

// Capacho de fibra escura com uma faixa azul madeusdev por dentro da borda.
const doormatTexture = () =>
  canvasTexture(512, (g, s) => {
    const rnd = seeded(3)
    g.fillStyle = '#2a2a2d'
    g.fillRect(0, 0, s, s)
    // fibras: tracinhos curtos em tons de cinza
    for (let i = 0; i < 9000; i++) {
      const v = 30 + Math.floor(rnd() * 40)
      g.fillStyle = `rgb(${v},${v},${v + 3})`
      g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 3 + rnd() * 4)
    }
    g.strokeStyle = BLUE
    g.lineWidth = s * 0.035
    g.strokeRect(s * 0.09, s * 0.09, s * 0.82, s * 0.82)
  }, [1, 1])

/** Capacho da porta: borrachão baixo de quinas redondas. */
export function Doormat() {
  const map = useMemo(doormatTexture, [])
  return (
    <group>
      <RoundedBox args={[1.3, 0.03, 0.65]} radius={0.012} smoothness={3} position-y={0.015} receiveShadow castShadow>
        <meshStandardMaterial color="#2a2a2d" roughness={1} />
      </RoundedBox>
      {/* O RoundedBox não tem UV inteiro no topo: a textura vai num plano por cima. */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.031} receiveShadow>
        <planeGeometry args={[1.27, 0.62]} />
        <meshStandardMaterial map={map} roughness={1} />
      </mesh>
    </group>
  )
}

function Backdrop() {
  const map = useMemo(halftone, [])
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-1.5}>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial map={map} />
    </mesh>
  )
}

export default function InteriorShell() {
  return (
    <>
      <Backdrop />
      <Floors />
      <Walls />
    </>
  )
}
