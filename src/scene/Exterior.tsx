import { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useControls } from 'leva'
import Station from './Station'
import Prop from './Prop'
import GrassClumps, { grassTexture, type Area } from './Grass'
import Pond from './Pond'
import Soccer from './Soccer'
import Dog from './Dog'

// Terreno (docs/planta.excalidraw, à esquerda): a planta tem 30 × 30 m com a
// casa de 10 m; aqui a casa tem 5,6 m e o terreno 20 × 20 m, com a mesma
// disposição, mais compacta. Norte = −z (fundo da tela), a câmera olha do sul.

const HALF = 10 // terreno de 20 × 20 m
const BORDER = 0.6 // espessura das bordas de madeira
const BORDER_HEIGHT = 0.5
const GATE = 2.2 // meia-largura do portão (sul, no fim do caminho)

// Onde o personagem nasce: no caminho, logo depois do portão.
export const EXTERIOR_SPAWN: [number, number, number] = [0, 2, 7]
// Ao sair da casa: no pé da escada, logo fora da zona da porta.
export const EXTERIOR_DOOR_SPAWN: [number, number, number] = [0, 2, 0.8]

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
  { x: [-0.95, 0.95], z: [-1.2, HALF] },
  { x: [-4.1, 1.9], z: [-6.6, -0.9] },
  { x: [2.4, 8.8], z: [0.5, 4.7] },
  { x: [-2.1, -1.3], z: [0.6, 1.4] },
  { x: [-6.1, -3.1], z: [4.7, 7.7] }, // laguinho
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

// Caminho de terra batida do portão até os degraus da varanda.
function Path() {
  const from = -0.9, to = HALF - BORDER
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, (from + to) / 2]} receiveShadow>
      <planeGeometry args={[1.5, to - from]} />
      <meshStandardMaterial color="#e9d6b0" />
    </mesh>
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
const TREES: [TreeKind, number, number, number][] = [
  ['tall', -8.2, -8, 0],
  ['plain', -6.4, -7.4, 1],
  ['orange', -4.8, -8.2, 2],
  ['orange', 4.6, -8, 0.5],
  ['plain', 6.4, -7.3, 2.5],
  ['tall', 8.2, -8.1, 1.2],
  ['plain', -8.3, -2.2, 0.3],
  ['tall', 8.4, 6.6, 0.8],
  ['orange', -8.2, 7.4, 1.7],
]

// Onde o doguinho não passa: as áreas de NO_GRASS menos o caminho, mais a casinha e os
// troncos das árvores.
const DOG_AVOID: Area[] = [
  ...NO_GRASS.slice(1),
  { x: [-7.5, -6.1], z: [2.7, 4.1] },
  ...TREES.map(([, x, z]): Area => ({ x: [x - 0.3, x + 0.3], z: [z - 0.3, z + 0.3] })),
]

export default function Exterior() {
  return (
    <>
      <Ground />
      <Borders />
      <Path />
      <GrassClumps half={HALF - BORDER} clear={NO_GRASS} count={30} />
      {/* Laguinho no canto da frente, à esquerda do caminho. */}
      <Pond position={[-4.6, 0, 6.2]} />

      {/* Casa (item 16): 1 unidade de largura; 5,6 m. As janelas e os degraus
          vêm de scripts/house_glass.mts. Textura em 4k (o maior objeto da tela).
          Os degraus ficam 1,13 m à direita do centro da casa: ela vai 1,13 m
          para a esquerda para eles caírem no caminho (z ≈ −0,9). */}
      <Prop url="/models/ai/16-casa-v2.glb" scale={5.6} position={[-1.13, 0, -3.6]} />
      {/* Porta: no pé da escada, E entra na casa (troca de cena). */}
      <Station id="door" position={[0, 0, -0.4]} zoneCenter={[0, 0.75, 0]} zoneSize={[0.8, 0.75, 0.5]} markerY={1.6} />

      {/* Árvores (item 22): fileira no fundo, dos dois lados da casa, e
          algumas soltas. 1 unidade de altura: a lisa e a de laranjas com 3 m,
          a alta com 3,8 m. Só o tronco colide. */}
      {TREES.map(([kind, x, z, r], i) => (
        <Prop key={i} url={TREE_URL[kind]} scale={TREE_SCALE[kind]} position={[x, 0, z]} rotationY={r} trunk={0.2} />
      ))}

      {/* Casinha do dog (item 20): 1 unidade de fundo; 1,2 m. Vem de frente
          para +z: gira um pouco para olhar para o caminho. */}
      <Prop url="/models/ai/20-casinha-dog.glb" scale={1.2} position={[-6.8, 0, 3.4]} rotationY={Math.PI / 5} />
      <Dog start={[-6, 2.2]} half={HALF - BORDER - 0.5} avoid={DOG_AVOID} />

      {/* Portão / entrada: caixa de correio ao lado do caminho. */}
      <Station id="contact" position={[-1.7, 0, 1]} zoneCenter={[0, 0.75, 0]} zoneSize={[1, 0.75, 1]} markerY={1.8}>
        {/* Caixa de correio no poste: 1 unidade de altura; 1,2 m. */}
        <Prop url="/models/ai/17-caixa-correio.glb" scale={1.2} position={[0, 0, 0]} />
      </Station>

      <Soccer />
    </>
  )
}
