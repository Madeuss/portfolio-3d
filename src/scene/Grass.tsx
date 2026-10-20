import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// Grama no estilo do worawork: em vez de folhas em pé, o volume vem de uma
// textura pintada no chão (verde vivo, manchas e pinceladas curtas, como
// grama "amassada"). Os tufos por cima são modelos (YardModels).

export type Area = { x: [number, number]; z: [number, number] }

// Sorteio com semente: tudo cai sempre no mesmo lugar.
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

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
