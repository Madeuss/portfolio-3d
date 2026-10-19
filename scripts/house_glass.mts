// Retoques na casa do Tripo: troca as janelas (vãos com caixilho torto) por
// janelas limpas, com um vidro âmbar aceso reto por painel e uma moldura escura
// em volta, um pouco à frente da parede (sem fresta nem calombo preto), e
// refaz os degraus da varanda.
// Uso (antes da dieta): node --experimental-strip-types scripts/house_glass.mts in.glb out.glb
// Depende de @gltf-transform/core, @gltf-transform/extensions, three e
// three-mesh-bvh: rodar numa pasta à parte com eles instalados.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { BufferAttribute, BufferGeometry, DoubleSide, Ray, Vector3 } from 'three'
import { MeshBVH } from 'three-mesh-bvh'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const [, , src, dst] = process.argv
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(src)
const mesh = doc.getRoot().listMeshes()[0]
const prim = mesh.listPrimitives()[0]
const geom = new BufferGeometry()
geom.setAttribute('position', new BufferAttribute(new Float32Array(prim.getAttribute('POSITION')!.getArray()!), 3))
geom.setIndex(new BufferAttribute(new Uint32Array(prim.getIndices()!.getArray()!), 1))
const bvh = new MeshBVH(geom)

const STEP = 0.002 // resolução do mapa de profundidade (a casa tem 1 unidade de largura)
const HOLE_Z = 0.12 // atrás disso o raio já passou da parede da frente
const RING = 0.012 // faixa em volta do vão onde se mede a parede
const MIN_AREA = 0.0003 // vãos menores que isso são ruído
const BAR = 0.005 // largura da moldura nova (≈ 3,5 cm na casa de 7 m)
const SILL = 0.02 // até onde a moldura de baixo desce para encostar no chão
const OUT = 0.003 // quanto a janela nova fica à frente da parede

// mapa de profundidade visto de frente (+Z olhando para −Z)
const N = Math.round(1 / STEP)
const z: number[][] = []
for (let i = 0; i <= N; i++) {
  z[i] = []
  for (let j = 0; j <= N; j++) {
    const hit = bvh.raycastFirst(new Ray(new Vector3(-0.5 + i * STEP, j * STEP, 3), new Vector3(0, 0, -1)), DoubleSide)
    z[i][j] = hit ? hit.point.z : -Infinity
  }
}
const median = (v: number[]) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)]
// vão = o raio atravessa a casa (bem atrás da parede, que fica em z ≈ 0,23–0,30)
const deepAt = (i: number, j: number) => z[i][j] > -Infinity && z[i][j] < HOLE_Z

type Pane = { i0: number; i1: number; j0: number; j1: number; front: number }
const panes: Pane[] = []
const seen = z.map((row) => row.map(() => false))
for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
  if (seen[i][j] || !deepAt(i, j)) continue
  const cells: [number, number][] = [[i, j]]
  seen[i][j] = true
  for (let q = 0; q < cells.length; q++) {
    const [a, b] = cells[q]
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = a + di, jj = b + dj
      if (ii < 0 || jj < 0 || ii > N || jj > N || seen[ii][jj] || !deepAt(ii, jj)) continue
      seen[ii][jj] = true
      cells.push([ii, jj])
    }
  }
  let i0 = N, i1 = 0, j0 = N, j1 = 0
  for (const [a, b] of cells) { i0 = Math.min(i0, a); i1 = Math.max(i1, a); j0 = Math.min(j0, b); j1 = Math.max(j1, b) }
  const area = cells.length * STEP * STEP
  const fill = cells.length / ((i1 - i0 + 1) * (j1 - j0 + 1))
  // ignora ruído e as regiões que tocam a borda do mapa (telhado, céu)
  if (area < MIN_AREA || i0 <= 1 || i1 >= N - 1 || j1 >= N - 1) continue
  // o telhado da ala esquerda também vai fundo (inclina para trás): fica acima do beiral
  if (-0.5 + i1 * STEP < -0.09 && j0 * STEP > 0.3) continue
  // parede: mediana da faixa em volta do vão
  const r = Math.round(RING / STEP), ring: number[] = []
  for (let a = i0 - r; a <= i1 + r; a++) for (let b = j0 - r; b <= j1 + r; b++) {
    if (a < 0 || b < 0 || a > N || b > N) continue
    if (a >= i0 && a <= i1 && b >= j0 && b <= j1) continue
    if (z[a][b] > -Infinity) ring.push(z[a][b])
  }
  const front = median(ring)
  panes.push({ i0, i1, j0, j1, front })
  console.log(`vão x ${(-0.5 + i0 * STEP).toFixed(3)}..${(-0.5 + i1 * STEP).toFixed(3)} y ${(j0 * STEP).toFixed(3)}..${(j1 * STEP).toFixed(3)} parede z ${front.toFixed(3)} área ${area.toFixed(4)} cheio ${fill.toFixed(2)}`)
}

// caixas: [xmin, ymin, zmin, xmax, ymax, zmax]
const glassBoxes: number[][] = [], frameBoxes: number[][] = []
for (const p of panes) {
  const x0 = -0.5 + p.i0 * STEP, x1 = -0.5 + p.i1 * STEP, y0 = p.j0 * STEP, y1 = p.j1 * STEP
  const zg = p.front + OUT
  // vidro: do fundo do vão até a frente, para não deixar ver nada por cima/baixo
  glassBoxes.push([x0, y0, p.front - 0.06, x1, y1, zg])
  const zf = zg + 0.002, zb = p.front - 0.004
  // baixo: se o chão está logo abaixo, a moldura desce até ele (cobre a
  // faixa manchada entre o caixilho e o deck)
  const floor = bvh.raycastFirst(new Ray(new Vector3((x0 + x1) / 2, y0 - BAR - 0.0005, zf + 0.001), new Vector3(0, -1, 0)), DoubleSide)
  const yb = floor && floor.distance < SILL ? floor.point.y : y0 - BAR
  frameBoxes.push([x0 - BAR, yb, zb, x1 + BAR, y0, zf])
  frameBoxes.push([x0 - BAR, y1, zb, x1 + BAR, y1 + BAR, zf]) // cima
  frameBoxes.push([x0 - BAR, y0, zb, x0, y1, zf]) // esquerda
  frameBoxes.push([x1, y0, zb, x1 + BAR, y1, zf]) // direita
}

// caixa → 12 triângulos com normais
function boxGeo(boxes: number[][]) {
  const pos: number[] = [], nor: number[] = []
  for (const [a, b, c, d, e, f] of boxes) {
    const faces: [number[], number[][]][] = [
      [[0, 0, 1], [[a, b, f], [d, b, f], [d, e, f], [a, e, f]]],
      [[0, 0, -1], [[d, b, c], [a, b, c], [a, e, c], [d, e, c]]],
      [[1, 0, 0], [[d, b, f], [d, b, c], [d, e, c], [d, e, f]]],
      [[-1, 0, 0], [[a, b, c], [a, b, f], [a, e, f], [a, e, c]]],
      [[0, 1, 0], [[a, e, f], [d, e, f], [d, e, c], [a, e, c]]],
      [[0, -1, 0], [[a, b, c], [d, b, c], [d, b, f], [a, b, f]]],
    ]
    for (const [n, q] of faces) for (const t of [0, 1, 2, 0, 2, 3]) { pos.push(...q[t]); nor.push(...n) }
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor) }
}

const buffer = doc.getRoot().listBuffers()[0]
function addPart(boxes: number[][], mat: ReturnType<typeof doc.createMaterial>) {
  const g = boxGeo(boxes)
  const p = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(g.pos).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(g.nor).setBuffer(buffer))
    .setMaterial(mat)
  mesh.addPrimitive(p)
}
addPart(glassBoxes, doc.createMaterial('vidro_aceso').setBaseColorFactor([0.95, 0.6, 0.22, 1]).setEmissiveFactor([0.6, 0.33, 0.08]).setRoughnessFactor(0.3).setMetallicFactor(0))
addPart(frameBoxes, doc.createMaterial('caixilho').setBaseColorFactor([0.035, 0.04, 0.07, 1]).setRoughnessFactor(0.6).setMetallicFactor(0))
console.log('vãos:', panes.length)

// Degraus: os do Tripo saíram tortos. Dois degraus retos por cima deles (um
// pouco maiores, para engolir os originais), com a textura do próprio deck:
// cada face pega um retângulo da textura (UV dos 4 cantos, medidos no modelo).
const DECK_TOP = [[0.2935, 0.1989], [0.2651, 0.1971], [0.2657, 0.1683], [0.2878, 0.1771]]
const DECK_FRONT = [[0.975, 0.9721], [0.9617, 0.9635], [0.959, 0.9682], [0.9725, 0.9784]]
const ROUND = 0.005 // raio das quinas dos degraus (≈ 3,5 cm)
const STEPS = [
  // [xmin, xmax, altura do topo, z de trás, z da frente]
  [0.12, 0.285, 0.034, 0.405, 0.448],
  [0.12, 0.285, 0.0185, 0.448, 0.482],
]
{
  const pos: number[] = [], nor: number[] = [], uvs: number[] = []
  // bilinear: (s, t) de 0 a 1 dentro do retângulo de textura
  const lerpUV = (r: number[][], s: number, t: number) => [0, 1].map((k) =>
    (1 - s) * (1 - t) * r[0][k] + s * (1 - t) * r[1][k] + s * t * r[2][k] + (1 - s) * t * r[3][k])
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  for (const [a, d, top, c, f] of STEPS) {
    // caixa de quinas arredondadas, como as bordas do deck
    const g = new RoundedBoxGeometry(d - a, top, f - c, 3, ROUND).toNonIndexed()
    g.translate((a + d) / 2, top / 2, (c + f) / 2)
    const P = g.getAttribute('position'), Nn = g.getAttribute('normal')
    for (let k = 0; k < P.count; k++) {
      const x = P.getX(k), y = P.getY(k), zz = P.getZ(k)
      const sx = clamp((x - a) / (d - a))
      // virada para cima: pisada (textura do topo do deck); senão, a da frente
      const uv = Nn.getY(k) > 0.5 ? lerpUV(DECK_TOP, sx, clamp((f - zz) / (f - c))) : lerpUV(DECK_FRONT, Math.abs(Nn.getX(k)) > 0.5 ? clamp((zz - c) / (f - c)) : sx, clamp(y / top))
      pos.push(x, y, zz); nor.push(Nn.getX(k), Nn.getY(k), Nn.getZ(k)); uvs.push(...uv)
    }
  }
  const p = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uvs)).setBuffer(buffer))
    .setMaterial(prim.getMaterial())
  mesh.addPrimitive(p)
}
await io.write(dst, doc)
