import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Float32BufferAttribute, MeshStandardMaterial, Shape, ShapeGeometry } from 'three'
import { patchTrail, TrailPainter, useTrail } from './Trail'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useControls } from 'leva'
import Station from './Station'
import Prop from './Prop'
import { grassTexture, type Area } from './Grass'
import { FlowerBeds, Gate, GrassTufts, HedgeRow, LampPosts, Walls, type WallSide } from './YardModels'
import Pond from './Pond'
import Soccer from './Soccer'
import Dog from './Dog'
import SteppingStones from './SteppingStones'
import { Bench, Sign } from './Garden'
import Clothesline from './Clothesline'
import SwingTree from './SwingTree'
import Fireflies from './Fireflies'
import Hammock from './Hammock'
import { Cat, Smoke, SprinklerWater } from './YardLife'
import SeatZone from './SeatZone'
import type { Seat } from '../state/game'
import { Birds, Butterflies, Pebbles } from './Critters'

// Terreno (docs/planta.excalidraw, à esquerda): a planta tem 30 × 30 m com a
// casa de 10 m; aqui a casa tem 5,6 m e o terreno 16 × 16 m, com a mesma
// disposição, mais compacta e cercada de árvores. Norte = −z (fundo da tela),
// a câmera olha do sul.

const HALF = 8 // terreno de 16 × 16 m
const BORDER = 0.6 // espessura das bordas de madeira
const BORDER_HEIGHT = 0.5
// meia-largura do portão (sul, no fim do caminho): o arco do portão (42) tem a
// altura da largura, e mais largo que isso tapava o personagem na entrada
const GATE = 1.25

// Onde o personagem nasce: no caminho, logo depois do portão.
export const EXTERIOR_SPAWN: [number, number, number] = [0, 2, 5.6]
// Ao sair da casa: no pé da escada, logo fora da zona da porta.
export const EXTERIOR_DOOR_SPAWN: [number, number, number] = [0, 2, 1.2]


// Cantos arredondados do terreno: o raio da curva da mureta (no meio dela) e,
// para fora, o do gramado e da base de terra.
const CORNER = 1.1

/** Retângulo de cantos redondos, de meia-largura `half` (no plano XY). */
function roundedSquare(half: number, r: number) {
  const s = new Shape()
  s.moveTo(-half + r, -half)
  s.lineTo(half - r, -half)
  s.quadraticCurveTo(half, -half, half, -half + r)
  s.lineTo(half, half - r)
  s.quadraticCurveTo(half, half, half - r, half)
  s.lineTo(-half + r, half)
  s.quadraticCurveTo(-half, half, -half, half - r)
  s.lineTo(-half, -half + r)
  s.quadraticCurveTo(-half, -half, -half + r, -half)
  return s
}

function Ground() {
  // A cor vem da textura pintada; `tom` só tinge por cima (branco = original).
  const { color } = useControls('Chão', { color: { value: '#ffffff', label: 'tom' } })
  const trail = useTrail(HALF * 2)
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({ map: grassTexture(HALF * 2, 5), roughness: 0.95 })
    // a grama fica pisada onde o personagem anda (Trail)
    patchTrail(m, trail)
    return m
  }, [trail])
  useEffect(() => void material.color.set(color), [material, color])
  // gramado e base com os cantos redondos; o uv do gramado igual ao do plano
  // de antes (0 a 1 no terreno todo), que a textura e a trilha usam
  const { lawn, base } = useMemo(() => {
    const r = CORNER + BORDER / 2
    const lawn = new ShapeGeometry(roundedSquare(HALF, r), 12)
    const pos = lawn.attributes.position
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + HALF) / (HALF * 2)
      uv[i * 2 + 1] = (pos.getY(i) + HALF) / (HALF * 2)
    }
    lawn.setAttribute('uv', new Float32BufferAttribute(uv, 2))
    const base = new ExtrudeGeometry(roundedSquare(HALF - 0.04, r - 0.04), {
      depth: 0.36,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
      curveSegments: 12,
    })
    return { lawn, base }
  }, [])
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[HALF, 0.1, HALF]} position={[0, -0.1, 0]} />
      {/* O plano nasce em pé (eixo XY); girar -90° em X deita ele no chão. */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={material} geometry={lawn} />
      {/* base de terra embaixo do gramado: a beira do terreno tem espessura,
          como um diorama (a mureta fina já não faz essa moldura) */}
      <mesh rotation-x={Math.PI / 2} position={[0, -0.05, 0]} geometry={base}>
        <meshStandardMaterial color="#8a5a35" roughness={1} />
      </mesh>
      <TrailPainter trail={trail} />
    </RigidBody>
  )
}

// Onde não nascem moitinhas: caminho, casa (com a varanda), mini campo e a caixa de correio.
const NO_GRASS: Area[] = [
  { x: [-0.95, 0.95], z: [-0.8, HALF] },
  { x: [-4.1, 1.9], z: [-6.2, -0.5] },
  { x: [1.1, 7.5], z: [0.2, 4.2] },
  { x: [-2.1, -1.3], z: [1.1, 1.9] },
  { x: [-5.7, -2.7], z: [3.1, 6.1] }, // laguinho
  { x: [-6.8, -6.2], z: [3.9, 5.3] }, // banco
  { x: [-5.5, -3.35], z: [-0.3, 0.6] }, // varal
  { x: [3.1, 5.3], z: [-5.1, -1.7] }, // churrasqueira e mesa
  { x: [-6.4, -5.4], z: [-5.8, -2.5] }, // horta
  { x: [-6.3, -5.5], z: [-2.2, -1.4] }, // irrigador
  { x: [1.8, 3.5], z: [5.8, 6.7] }, // árvore do balanço e o balanço
  { x: [4.1, 7.5], z: [4.7, 5.9] }, // rede
]


type Box = { center: [number, number, number]; half: [number, number, number] }

// Bordas ("fim do mundo"): a mureta de madeira (item 41) em volta, aberta só no
// portão do sul (42). As colisões são caixas grossas, até a beira do terreno.
function Borders() {
  const blocks = useMemo<Box[]>(() => {
    const h = BORDER_HEIGHT / 2, t = BORDER / 2, edge = HALF - t
    const side = (HALF - GATE) / 2
    return [
      { center: [0, h, -edge], half: [HALF, h, t] },
      { center: [-edge, h, 0], half: [t, h, HALF - BORDER] },
      { center: [edge, h, 0], half: [t, h, HALF - BORDER] },
      { center: [-GATE - side, h, edge], half: [side, h, t] },
      { center: [GATE + side, h, edge], half: [side, h, t] },
    ]
  }, [])
  const e = HALF - BORDER / 2
  const r = CORNER
  // a mureta para antes de cada canto e faz a curva em 4 pedaços curtos
  const { sides, arcs } = useMemo(() => {
    const arcs: WallSide[] = []
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = sx * (e - r)
      const cz = sz * (e - r)
      const a0 = Math.atan2(sz, 0) // começa no lado de cima/baixo
      const steps = 4
      for (let k = 0; k < steps; k++) {
        const t0 = (k / steps) * (Math.PI / 2)
        const t1 = ((k + 1) / steps) * (Math.PI / 2)
        const p = (t: number): [number, number] => {
          // de (0, sz) até (sx, 0) girando pelo canto
          const a = a0 + (sx * sz > 0 ? -t : t)
          return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]
        }
        arcs.push({ from: p(t0), to: p(t1) })
      }
    }
    const sides: WallSide[] = [
      { from: [-e + r, -e], to: [e - r, -e] },
      { from: [-e, -e + r], to: [-e, e - r] },
      { from: [e, -e + r], to: [e, e - r] },
      { from: [-e + r, e], to: [-GATE, e] },
      { from: [GATE, e], to: [e - r, e] },
      ...arcs,
    ]
    return { sides, arcs }
  }, [e, r])
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {blocks.map((b, i) => (
          <CuboidCollider key={i} args={b.half} position={b.center} />
        ))}
        {/* nas curvas, uma caixa por pedaço (as retas de cima não chegam lá) */}
        {arcs.map(({ from, to }, i) => (
          <CuboidCollider
            key={`arc${i}`}
            args={[Math.hypot(to[0] - from[0], to[1] - from[1]) / 2 + 0.05, BORDER_HEIGHT / 2, BORDER / 2]}
            position={[(from[0] + to[0]) / 2, BORDER_HEIGHT / 2, (from[1] + to[1]) / 2]}
            rotation={[0, -Math.atan2(to[1] - from[1], to[0] - from[0]), 0]}
          />
        ))}
      </RigidBody>
      <Walls sides={sides} />
      <Gate z={e} width={GATE * 2} />
    </>
  )
}

// Colisão da casa (unidades do modelo, medidas na malha): o corpo até a
// frente da varanda e, à parte, os degraus que saem dela. Uma caixa só ia até
// a ponta dos degraus e fechava a passagem na frente da varanda à esquerda.
const HOUSE_BOXES: [number, number, number, number, number, number][] = [
  [-0.45, 0, -0.41, 0.45, 0.72, 0.34],
  [0.12, 0, 0.34, 0.29, 0.2, 0.48],
]

// Lampiões dos dois lados do caminho, do portão até a casa.
const LAMPS: [number, number][] = [
  [-1.15, 6.3],
  [1.15, 6.3],
  // abaixo da linha do campinho: ao lado da trave fechava a passagem
  [-1.1, 4.0],
  [1.1, 4.0],
  [1.1, 0.7],
]
// Banco no canto esquerdo, ao lado do lago, olhando para ele (+x); assento a
// 46 cm. Longe o bastante para o corpo de quem senta não encostar no lago.
const POND_BENCH: Seat = { center: [-6.5, 4.6], yaw: Math.PI / 2, height: 0.465, depth: 0.22, edge: 0.03 }
// Bancos da mesa de piquenique (34): quem senta fica de costas para a mesa (as
// pernas não cabem embaixo dela com o corpo físico); o da frente olha para a
// câmera e o de trás para a churrasqueira.
const PICNIC_FRONT: Seat = { center: [4.2, -2.0], yaw: 0, height: 0.44, depth: 0.15, edge: 0 }
const PICNIC_BACK: Seat = { center: [4.2, -3.2], yaw: Math.PI, height: 0.44, depth: 0.15, edge: 0 }

// Passarinhos ciscando pelo gramado (voltam para cá depois de fugir).
const BIRDS = [
  { home: [2.4, -1.4] as [number, number], color: '#6b7a8f' },
  { home: [-3.2, 1.6] as [number, number], color: '#c46a3d' },
  { home: [4.9, 4.3] as [number, number], color: '#6b7a8f' },
  { home: [-4.6, -1.4] as [number, number], color: '#e0c25a' },
]
// Canteiros de margaridas: [x, z, quantas].
const FLOWER_BEDS: [number, number, number][] = [
  [-2.9, 0.8, 9],
  [1.5, -0.1, 7],
  [-2.3, 3.2, 8],
  [-6.2, 2.6, 7],
  [4.6, 6.3, 8],
  [-0.9, 5.2, 5],
  [5.8, -0.6, 6],
]

// Cerca-viva ao longo da cerca da frente, dos dois lados do portão: moitas
// quadradas de quinas redondas, em dois verdes alternados (como no worawork).
const HEDGE_SIZE = 0.8
function Hedge() {
  const edge = HALF - BORDER - 0.35
  const bushes = useMemo(() => {
    const list: { x: number; h: number }[] = []
    for (const side of [-1, 1]) {
      // (para antes da curva da mureta no canto)
      for (let x = GATE + 0.6; x < HALF - BORDER - CORNER + 0.2; x += HEDGE_SIZE) {
        const i = list.length
        list.push({ x: side * x, h: 0.62 + ((i * 7) % 3) * 0.05 })
      }
    }
    return list
  }, [])
  const span = Math.ceil((HALF - BORDER - CORNER + 0.2 - (GATE + 0.6)) / HEDGE_SIZE) * HEDGE_SIZE
  return (
    <>
      <HedgeRow bushes={bushes} z={edge} size={HEDGE_SIZE} />
    <RigidBody type="fixed" colliders={false}>
      {[-1, 1].map((side) => (
        <CuboidCollider
          key={side}
          args={[span / 2, 0.35, 0.32]}
          position={[side * (GATE + 0.6 - HEDGE_SIZE / 2 + span / 2), 0.35, edge]}
        />
      ))}
    </RigidBody>
    </>
  )
}

type TreeKind = 'plain' | 'orange' | 'tall'
const TREE_URL: Record<TreeKind, string> = {
  plain: '/models/ai/22-arvore.glb',
  orange: '/models/ai/22-arvore-laranjas.glb',
  tall: '/models/ai/22-arvore-alta.glb',
}
const TREE_SCALE: Record<TreeKind, number> = { plain: 3, orange: 2.8, tall: 3.8 }
// [tipo, x, z, giro]
// [tipo, x, z, giro, tamanho] (tamanho multiplica a escala do tipo)
const TREES: [TreeKind, number, number, number, number][] = [
  // fundo, dos dois lados da casa
  ['tall', -6.6, -6.7, 0, 1],
  ['orange', -5, -6.5, 2, 0.95],
  ['plain', 3.3, -6.6, 0.5, 1.05],
  ['tall', 5, -6.8, 1.2, 0.9],
  ['plain', 6.7, -6.5, 2.5, 1],
  // lado oeste (esquerda)
  ['plain', -6.8, -4.6, 0.3, 0.95],
  ['orange', -6.7, -2.6, 1.1, 0.9],
  ['tall', -6.9, -0.6, 2.2, 0.85],
  // lado leste (direita), menos onde está o campo
  ['tall', 6.9, -2.5, 2.9, 0.9],
  ['orange', 6.8, -4.6, 0.8, 1],
  // na frente, perto da cerca-viva
  ['tall', -2.7, 6.6, 0.6, 0.8],
]

// Onde o doguinho não passa: as áreas de NO_GRASS menos o caminho, mais a casinha e os
// troncos das árvores.
const DOG_AVOID: Area[] = [
  ...NO_GRASS.slice(1),
  { x: [-6.3, -4.9], z: [0.5, 1.9] }, // casinha
  ...TREES.map(([, x, z]): Area => ({ x: [x - 0.3, x + 0.3], z: [z - 0.3, z + 0.3] })),
  // coisas pequenas que ele também contorna (a margem do Dog aumenta tudo)
  ...LAMPS.map(([x, z]): Area => ({ x: [x - 0.08, x + 0.08], z: [z - 0.08, z + 0.08] })),
  ...FLOWER_BEDS.map(([x, z]): Area => ({ x: [x - 0.3, x + 0.3], z: [z - 0.3, z + 0.3] })),
  { x: [-2.4, -1.8], z: [5.4, 5.7] }, // placa
  { x: [3.8, 4.8], z: [-0.25, 0.15] }, // placar do campinho
  // perto do gato na mureta: ele não vai até lá de propósito (ainda assusta o
  // gato quando passa perto, mas bem menos)
  { x: [-7.4, -6.6], z: [1.4, 3.2] },
]

export default function Exterior() {
  return (
    <>
      <Ground />
      <Borders />
      {/* Caminho: pedras de passagem do portão até os degraus da varanda. */}
      <SteppingStones from={-0.5} to={HALF - BORDER} />
      <Hedge />
      {/* Placa MADEUS logo depois do portão, apontando para a casa. */}
      <Sign position={[-2.1, 0, 5.55]} rotationY={0.25} />
      <LampPosts at={LAMPS} />
      {/* Rede (7) no canto da frente à direita, entre o balanço e a mureta. */}
      <Hammock position={[5.8, 0, 5.3]} />
      {/* vaga-lumes à noite */}
      <Fireflies half={HALF - BORDER - 0.5} />
      <FlowerBeds beds={FLOWER_BEDS} />
      {/* Bichinhos: borboletas nos canteiros e passarinhos que fogem de perto. */}
      <Butterflies around={FLOWER_BEDS.filter((_, i) => i % 2 === 0).map(([x, z]) => [x, z] as [number, number])} />
      <Birds birds={BIRDS} />
      <Pebbles half={HALF - BORDER - 0.3} clear={NO_GRASS} />
      {/* Churrasco (itens 33 e 34): no fundo à direita, entre a casa e as
          árvores, à frente das copas do fundo (a chaminé ficava embaixo delas),
          e a mesa na frente da churrasqueira. */}
      <Prop url="/models/ai/33-churrasqueira.glb" scale={1.6} position={[4.2, 0, -4.6]} />
      <Prop url="/models/ai/34-mesa-piquenique.glb" scale={1.8} position={[4.2, 0, -2.6]} rotationY={Math.PI / 2} />
      <SeatZone seat={PICNIC_FRONT} width={0.7} />
      <SeatZone seat={PICNIC_BACK} width={0.7} />
      <Smoke position={[3.92, 1.62, -4.7]} />
      {/* Horta (37): dois canteiros no comprimento, encostados nas árvores da
          esquerda (um girado, para não ficarem iguais), e o irrigador (36) na
          mesma linha: sobra a passagem ao lado da casa. */}
      <Prop url="/models/ai/37-horta.glb" scale={1.4} position={[-5.9, 0, -5.0]} rotationY={Math.PI / 2} />
      <Prop url="/models/ai/37-horta.glb" scale={1.4} position={[-5.9, 0, -3.3]} rotationY={-Math.PI / 2} />
      <Prop url="/models/ai/36-irrigador.glb" scale={0.7} position={[-5.9, 0, -1.8]} rotationY={-0.6} minHeight={0.6} />
      <SprinklerWater position={[-5.9, 0.3, -1.8]} />
      {/* Gato (38) sentado na mureta esquerda, perto da casinha do cachorro:
          quando o cachorro ou o personagem chega perto, pula para fora. */}
      <Cat position={[-HALF + BORDER / 2, BORDER_HEIGHT, 2.3]} rotationY={Math.PI / 2} scale={0.5} away={[-HALF - 0.8, 2.3]} />
      {/* Árvore do balanço (35), na frente à direita, no lugar da laranjeira
          que ficava ali, com a copa do mesmo tamanho (não tapa o campinho). O
          galho aponta para o caminho (−x): o balanço fica ao lado do tronco,
          à vista (atrás dele, a copa tapava). Quem senta olha para a casa. */}
      {/* (o galho do modelo sai a ~30° na diagonal: o giro compensa, para ele
          apontar reto para o caminho) */}
      <SwingTree position={[3.2, 0, 6.3]} rotationY={Math.PI - 0.52} scale={2.6} />
      {/* Varal no gramado à esquerda da varanda, longe das copas. */}
      <Clothesline from={[-5.3, 1.5, 0.05]} to={[-3.55, 1.5, 0.25]} />
      {/* Banco de madeira no canto esquerdo, olhando para o lago. */}
      <Bench position={[-6.5, 0, 4.6]} rotationY={Math.PI / 2} />
      <SeatZone seat={POND_BENCH} />
      <GrassTufts half={HALF - BORDER} clear={NO_GRASS} count={30} />
      {/* Laguinho no canto da frente, à esquerda do caminho. */}
      <Pond position={[-4.2, 0, 4.6]} />

      {/* Casa (item 16): 1 unidade de largura; 5,6 m. As janelas e os degraus
          vêm de scripts/house_glass.mts. Textura em 4k (o maior objeto da tela).
          Os degraus ficam 1,13 m à direita do centro da casa: ela vai 1,13 m
          para a esquerda para eles caírem no caminho (z ≈ −0,5). */}
      <Prop url="/models/ai/16-casa-v2.glb" scale={5.6} position={[-1.13, 0, -3.2]} boxes={HOUSE_BOXES} />
      {/* Porta: no pé da escada, E entra na casa (troca de cena). */}
      <Station id="door" position={[0, 0, 0]} zoneCenter={[0, 0.75, 0]} zoneSize={[0.8, 0.75, 0.5]} markerY={1.6} />

      {/* Árvores (item 22): uma moldura em volta do terreno. 1 unidade de
          altura: a lisa e a de laranjas com 3 m, a alta com 3,8 m (vezes o
          tamanho de cada uma). Só o tronco colide. */}
      {TREES.map(([kind, x, z, r, size], i) => (
        <Prop key={i} url={TREE_URL[kind]} scale={TREE_SCALE[kind] * size} position={[x, 0, z]} rotationY={r} trunk={0.2} wind />
      ))}

      {/* Casinha do dog (item 20): 1 unidade de fundo; 1,2 m. Vem de frente
          para +z: gira um pouco para olhar para o caminho. */}
      <Prop url="/models/ai/20-casinha-dog.glb" scale={1.2} position={[-5.6, 0, 1.2]} rotationY={Math.PI / 5} />
      <Dog start={[-3.6, 1.3]} half={HALF - BORDER - 0.5} avoid={DOG_AVOID} />

      {/* Portão / entrada: caixa de correio ao lado do caminho. */}
      <Station id="contact" position={[-1.7, 0, 1.5]} zoneCenter={[0, 0.75, 0]} zoneSize={[1, 0.75, 1]} markerY={1.8}>
        {/* Caixa de correio no poste: 1 unidade de altura; 1,2 m. */}
        <Prop url="/models/ai/17-caixa-correio.glb" scale={1.2} position={[0, 0, 0]} />
      </Station>

      <Soccer />
    </>
  )
}
