import { useEffect, useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { BLUE } from './InteriorShell'

// Enfeites do interior feitos em código (sem gastar crédito no Tripo):
// tapetes e a camisa do Corinthians emoldurada (estação Sobre mim).

function texture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}

// ---- Tapetes ------------------------------------------------------------

// Redondo, bege, com anéis concêntricos (quarto, ao pé da cama).
const roundRug = () =>
  texture(512, 512, (g) => {
    const rings = ['#e7dccb', '#d9cbb4', '#efe6d8', '#cdbda3', '#e7dccb']
    rings.forEach((color, i) => {
      g.fillStyle = color
      g.beginPath()
      g.arc(256, 256, 256 - i * 34, 0, Math.PI * 2)
      g.fill()
    })
  })

// Retangular, cinza-chumbo com faixa azul (escritório, embaixo da cadeira).
const officeRug = () =>
  texture(512, 384, (g) => {
    g.fillStyle = '#3b3d42'
    g.fillRect(0, 0, 512, 384)
    g.strokeStyle = BLUE
    g.lineWidth = 14
    g.strokeRect(30, 30, 452, 324)
    g.strokeStyle = '#55585e'
    g.lineWidth = 4
    g.strokeRect(54, 54, 404, 276)
  })

export function RoundRug({ position, radius }: { position: [number, number, number]; radius: number }) {
  const map = useMemo(roundRug, [])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[position[0], 0.012, position[2]]} receiveShadow>
      <circleGeometry args={[radius, 48]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}

export function OfficeRug({ position, size }: { position: [number, number, number]; size: [number, number] }) {
  const map = useMemo(officeRug, [])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[position[0], 0.012, position[2]]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}

// ---- Camisa emoldurada ---------------------------------------------------

// Camisa do Corinthians (a listrada preta, de fora): preta com listras brancas
// finas, gola redonda branca com um V pequeno, punhos brancos e o escudo no
// peito, vindo do SVG em public/images (sem logo de fornecedor).
const CREST_URL = '/images/brazil_corinthians.football-logos.cc.svg'
const INK = '#15161b'
const WHITE = '#f4f2ec'

const COLLAR_L: [number, number] = [198, 62]
const COLLAR_R: [number, number] = [314, 62]
const BODY: [number, number][] = [
  COLLAR_R, [402, 90], [394, 200], [392, 462], [120, 462], [118, 200], [110, 90], COLLAR_L,
]
// mangas curtas: [ombro, ponta de fora, ponta de dentro, axila]
const SLEEVES: [number, number][][] = [
  [[402, 90], [474, 194], [424, 236], [394, 200]],
  [[110, 90], [38, 194], [88, 236], [118, 200]],
]

function poly(points: [number, number][]) {
  const p = new Path2D()
  points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)))
  p.closePath()
  return p
}

// Listras brancas finas sobre o preto, inclinadas em `angle` (mangas seguem o braço).
function stripes(g: CanvasRenderingContext2D, area: Path2D, angle: number) {
  g.save()
  g.clip(area)
  g.fillStyle = INK
  g.fillRect(0, 0, 512, 512)
  g.translate(256, 256)
  g.rotate(angle)
  g.fillStyle = WHITE
  for (let x = -400; x < 400; x += 30) g.fillRect(x, -400, 5, 800)
  g.restore()
}

const jersey = () =>
  texture(512, 512, (g) => {
    const body = poly(BODY)
    const sleeves = SLEEVES.map(poly)
    sleeves.forEach((sl, i) => stripes(g, sl, i ? 0.6 : -0.6))
    stripes(g, body, 0)

    // punhos brancos na ponta das mangas
    g.strokeStyle = WHITE
    g.lineCap = 'round'
    g.lineWidth = 12
    for (const sl of SLEEVES) {
      g.beginPath()
      g.moveTo(...sl[1])
      g.lineTo(...sl[2])
      g.stroke()
    }

    // gola redonda branca, com o V pequeno na frente
    g.lineWidth = 11
    g.beginPath()
    g.moveTo(...COLLAR_L)
    g.quadraticCurveTo(256, 112, ...COLLAR_R)
    g.stroke()
    g.lineWidth = 5
    g.beginPath()
    g.moveTo(240, 96)
    g.lineTo(256, 116)
    g.lineTo(272, 96)
    g.stroke()

    // contorno suave
    g.strokeStyle = 'rgba(0,0,0,0.4)'
    g.lineWidth = 3
    sleeves.forEach((sl) => g.stroke(sl))
    g.stroke(body)
  })

// O SVG do escudo não tem largura/altura (só viewBox): sem elas o Firefox não
// desenha no canvas, então elas entram antes de carregar.
async function loadCrest() {
  const svg = await (await fetch(CREST_URL)).text()
  const sized = svg.replace('<svg ', '<svg width="1077" height="1312" ')
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))
  const img = new Image()
  img.src = url
  await img.decode()
  URL.revokeObjectURL(url)
  return img
}

const FRAME_W = 0.9
const FRAME_H = 1.05
const FRAME_D = 0.05
const BORDER = 0.06

/** Quadro com a camisa, para pendurar na parede (a frente olha para +z). */
export function JerseyFrame({ position }: { position: [number, number, number] }) {
  const map = useMemo(jersey, [])

  // Escudo no peito esquerdo (direita de quem olha), desenhado quando o SVG chega.
  useEffect(() => {
    let alive = true
    loadCrest()
      .then((img) => {
        if (!alive) return
        const g = (map.image as HTMLCanvasElement).getContext('2d')!
        const h = 78
        g.drawImage(img, 318 - (h * 1077) / 1312 / 2, 120, (h * 1077) / 1312, h)
        map.needsUpdate = true
      })
      .catch(() => {}) // sem escudo, a camisa continua
    return () => {
      alive = false
    }
  }, [map])

  return (
    <group position={position}>
      {/* moldura preta brilhante e o fundo off-white */}
      <RoundedBox args={[FRAME_W, FRAME_H, FRAME_D]} radius={0.015} smoothness={3} castShadow>
        <meshStandardMaterial color="#111113" roughness={0.25} metalness={0.1} />
      </RoundedBox>
      <mesh position-z={FRAME_D / 2 + 0.001}>
        <planeGeometry args={[FRAME_W - BORDER * 2, FRAME_H - BORDER * 2]} />
        <meshStandardMaterial color="#f3f1ec" roughness={0.9} />
      </mesh>
      <mesh position-z={FRAME_D / 2 + 0.003}>
        <planeGeometry args={[FRAME_W - BORDER * 2, FRAME_W - BORDER * 2]} />
        <meshStandardMaterial map={map} transparent roughness={0.8} />
      </mesh>
    </group>
  )
}
