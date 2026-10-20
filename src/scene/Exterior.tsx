import { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useControls } from 'leva'
import { RoundedBox } from '@react-three/drei'
import Station from './Station'
import Prop from './Prop'
import GrassClumps, { grassTexture, type Area } from './Grass'
import Pond from './Pond'
import Soccer from './Soccer'
import Dog from './Dog'
import SteppingStones from './SteppingStones'
import { Bench, Flowers, Lamp, Sign } from './Garden'
import Clothesline from './Clothesline'
import { Birds, Butterflies, Pebbles } from './Critters'

// Terreno (docs/planta.excalidraw, à esquerda): a planta tem 30 × 30 m com a
// casa de 10 m; aqui a casa tem 5,6 m e o terreno 16 × 16 m, com a mesma
// disposição, mais compacta e cercada de árvores. Norte = −z (fundo da tela),
// a câmera olha do sul.

const HALF = 8 // terreno de 16 × 16 m
const BORDER = 0.6 // espessura das bordas de madeira
const BORDER_HEIGHT = 0.5
const GATE = 2.2 // meia-largura do portão (sul, no fim do caminho)

// Onde o personagem nasce: no caminho, logo depois do portão.
export const EXTERIOR_SPAWN: [number, number, number] = [0, 2, 5.6]
// Ao sair da casa: no pé da escada, logo fora da zona da porta.
export const EXTERIOR_DOOR_SPAWN: [number, number, number] = [0, 2, 1.2]

const WOOD = '#b98552'
const WOOD_DARK = '#8a5a2b'

function Ground() {
  // A cor vem da textura pintada; `tom` só tinge por cima (branco = original).
  const { color } = useControls('Chão', { color: { value: '#ffffff', label: 'tom' } })
  const map = useMemo(() => grassTexture(HALF * 2, 5), [])
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[HALF, 0.1, HALF]} position={[0, -0.1, 0]} />
      {/* O plano nasce em pé (eixo XY); girar -90° em X deita ele no chão. */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial color={color} map={map} roughness={0.95} />
      </mesh>
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
  { x: [-6.6, -5.8], z: [3.9, 5.3] }, // banco
  { x: [-5.5, -3.35], z: [-0.3, 0.6] }, // varal
]


type Box = { center: [number, number, number]; half: [number, number, number] }

function WoodBlock({ center, half, color = WOOD }: Box & { color?: string }) {
  return (
    <>
      <CuboidCollider args={half} position={center} />
      <mesh position={center} castShadow receiveShadow>
        <boxGeometry args={[half[0] * 2, half[1] * 2, half[2] * 2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </>
  )
}

// Bordas de madeira ("fim do mundo"), com o portão fechado no meio do sul.
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
  return (
    <RigidBody type="fixed" colliders={false}>
      {blocks.map((b, i) => (
        <WoodBlock key={i} {...b} />
      ))}
      {/* Portão: dois pilares e as tábuas entre eles. */}
      <WoodBlock center={[-GATE + 0.15, 0.55, HALF - BORDER / 2]} half={[0.15, 0.55, 0.35]} color={WOOD_DARK} />
      <WoodBlock center={[GATE - 0.15, 0.55, HALF - BORDER / 2]} half={[0.15, 0.55, 0.35]} color={WOOD_DARK} />
      {[0.25, 0.6].map((y) => (
        <WoodBlock key={y} center={[0, y, HALF - BORDER / 2]} half={[GATE - 0.3, 0.08, 0.05]} />
      ))}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => (
        <WoodBlock key={x} center={[x, 0.4, HALF - BORDER / 2 + 0.06]} half={[0.08, 0.38, 0.03]} />
      ))}
    </RigidBody>
  )
}

// Lampiões dos dois lados do caminho, do portão até a casa.
const LAMPS: [number, number][] = [
  [-1.15, 6.3],
  [1.15, 6.3],
  [-1.1, 3.4],
  [1.1, 3.4],
  [1.1, 0.7],
]
// Passarinhos ciscando pelo gramado (voltam para cá depois de fugir).
const BIRDS = [
  { home: [2.4, -1.4] as [number, number], color: '#6b7a8f' },
  { home: [-3.2, 1.6] as [number, number], color: '#c46a3d' },
  { home: [5.4, 5.1] as [number, number], color: '#6b7a8f' },
  { home: [-5.6, -1.6] as [number, number], color: '#e0c25a' },
]
// Canteiros de margaridas: [x, z, quantas].
const FLOWER_BEDS: [number, number, number][] = [
  [-2.9, 0.8, 9],
  [1.5, -0.1, 7],
  [-2.3, 3.2, 8],
  [-6.2, 2.6, 7],
  [3.2, 5.6, 8],
  [-0.9, 5.2, 5],
  [5.8, -0.6, 6],
]

// Cerca-viva ao longo da cerca da frente, dos dois lados do portão: moitas
// quadradas de quinas redondas, em dois verdes alternados (como no worawork).
const HEDGE_SIZE = 0.8
function Hedge() {
  const edge = HALF - BORDER - 0.35
  const bushes = useMemo(() => {
    const list: { x: number; tone: string; h: number }[] = []
    for (const side of [-1, 1]) {
      for (let x = GATE + 0.6; x < HALF - BORDER - 0.3; x += HEDGE_SIZE) {
        const i = list.length
        list.push({ x: side * x, tone: i % 2 ? '#5f9c45' : '#6aa94d', h: 0.62 + ((i * 7) % 3) * 0.05 })
      }
    }
    return list
  }, [])
  const span = HALF - BORDER - 0.3 - (GATE + 0.6) + HEDGE_SIZE
  return (
    <RigidBody type="fixed" colliders={false}>
      {[-1, 1].map((side) => (
        <CuboidCollider
          key={side}
          args={[span / 2, 0.35, 0.32]}
          position={[side * (GATE + 0.6 - HEDGE_SIZE / 2 + span / 2), 0.35, edge]}
        />
      ))}
      {bushes.map((b, i) => (
        <RoundedBox
          key={i}
          args={[HEDGE_SIZE + 0.04, b.h, 0.62]}
          radius={0.18}
          smoothness={4}
          position={[b.x, b.h / 2, edge]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={b.tone} roughness={0.9} />
        </RoundedBox>
      ))}
    </RigidBody>
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
  ['plain', -6.8, 6.2, 1.7, 1],
  // lado leste (direita), menos onde está o campo
  ['orange', 6.8, -4.6, 0.8, 1],
  ['tall', 6.9, -2.5, 2.9, 0.9],
  ['plain', 6.8, 5.6, 0.4, 0.95],
  // na frente, perto da cerca-viva
  ['orange', 4.2, 6.3, 1.4, 0.85],
  ['tall', -2.7, 6.6, 0.6, 0.8],
]

// Onde o doguinho não passa: as áreas de NO_GRASS menos o caminho, mais a casinha e os
// troncos das árvores.
const DOG_AVOID: Area[] = [
  ...NO_GRASS.slice(1),
  { x: [-6.3, -4.9], z: [0.5, 1.9] }, // casinha
  ...TREES.map(([, x, z]): Area => ({ x: [x - 0.3, x + 0.3], z: [z - 0.3, z + 0.3] })),
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
      <Sign position={[-1.5, 0, 6.5]} rotationY={0.25} />
      {LAMPS.map(([x, z]) => (
        <Lamp key={`${x},${z}`} position={[x, 0, z]} />
      ))}
      <Flowers beds={FLOWER_BEDS} />
      {/* Bichinhos: borboletas nos canteiros e passarinhos que fogem de perto. */}
      <Butterflies around={FLOWER_BEDS.filter((_, i) => i % 2 === 0).map(([x, z]) => [x, z] as [number, number])} />
      <Birds birds={BIRDS} />
      <Pebbles half={HALF - BORDER - 0.3} clear={NO_GRASS} />
      {/* Varal no gramado à esquerda da varanda, longe das copas. */}
      <Clothesline from={[-5.3, 1.5, 0.05]} to={[-3.55, 1.5, 0.25]} />
      {/* Banco de madeira à esquerda do lago, olhando para ele. */}
      <Bench position={[-6.2, 0, 4.6]} rotationY={Math.PI / 2} />
      <GrassClumps half={HALF - BORDER} clear={NO_GRASS} count={30} />
      {/* Laguinho no canto da frente, à esquerda do caminho. */}
      <Pond position={[-4.2, 0, 4.6]} />

      {/* Casa (item 16): 1 unidade de largura; 5,6 m. As janelas e os degraus
          vêm de scripts/house_glass.mts. Textura em 4k (o maior objeto da tela).
          Os degraus ficam 1,13 m à direita do centro da casa: ela vai 1,13 m
          para a esquerda para eles caírem no caminho (z ≈ −0,5). */}
      <Prop url="/models/ai/16-casa-v2.glb" scale={5.6} position={[-1.13, 0, -3.2]} />
      {/* Porta: no pé da escada, E entra na casa (troca de cena). */}
      <Station id="door" position={[0, 0, 0]} zoneCenter={[0, 0.75, 0]} zoneSize={[0.8, 0.75, 0.5]} markerY={1.6} />

      {/* Árvores (item 22): uma moldura em volta do terreno. 1 unidade de
          altura: a lisa e a de laranjas com 3 m, a alta com 3,8 m (vezes o
          tamanho de cada uma). Só o tronco colide. */}
      {TREES.map(([kind, x, z, r, size], i) => (
        <Prop key={i} url={TREE_URL[kind]} scale={TREE_SCALE[kind] * size} position={[x, 0, z]} rotationY={r} trunk={0.2} />
      ))}

      {/* Casinha do dog (item 20): 1 unidade de fundo; 1,2 m. Vem de frente
          para +z: gira um pouco para olhar para o caminho. */}
      <Prop url="/models/ai/20-casinha-dog.glb" scale={1.2} position={[-5.6, 0, 1.2]} rotationY={Math.PI / 5} />
      <Dog start={[-4.6, 0.4]} half={HALF - BORDER - 0.5} avoid={DOG_AVOID} />

      {/* Portão / entrada: caixa de correio ao lado do caminho. */}
      <Station id="contact" position={[-1.7, 0, 1.5]} zoneCenter={[0, 0.75, 0]} zoneSize={[1, 0.75, 1]} markerY={1.8}>
        {/* Caixa de correio no poste: 1 unidade de altura; 1,2 m. */}
        <Prop url="/models/ai/17-caixa-correio.glb" scale={1.2} position={[0, 0, 0]} />
      </Station>

      <Soccer />
    </>
  )
}
