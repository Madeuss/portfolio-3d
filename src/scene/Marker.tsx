import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { DoubleSide, ExtrudeGeometry, Shape, type Group } from 'three'
import type { ZoneId } from '../state/game'

export type MarkerIcon = Exclude<ZoneId, 'ball'>

type Props = { position: [number, number, number]; icon: MarkerIcon; active?: boolean; onClick: () => void }

const BLUE = '#0A3FB8'
const HOVER = '#f08c00'
const WHITE = '#FAFAF7'

// Marcador de estação (tarefa 1.6): uma medalha flutuante com o ícone do que a
// estação faz (envelope no correio, luva no saco, monitor na mesa...), para dá
// para saber de longe. Sobe e desce, gira devagar, fica laranja com o mouse em
// cima ou com o personagem na zona (`active`) e avisa o clique.

const SIZE = 0.19 // raio da medalha na tela (o desenho é feito com raio R)
const R = 0.22
const TILT = 0.55
const DEPTH = 0.05
const ICON_DEPTH = 0.025

// ---- Desenhos dos ícones (em metros, centrados, cabem num quadrado de 0,26) ----

function rect(s: Shape | ReturnType<typeof hole>, x: number, y: number, w: number, h: number) {
  s.moveTo(x, y)
  s.lineTo(x + w, y)
  s.lineTo(x + w, y + h)
  s.lineTo(x, y + h)
  s.lineTo(x, y)
}
const hole = () => new Shape()

function roundRect(x: number, y: number, w: number, h: number, r: number) {
  const s = new Shape()
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

// Envelope: retângulo com a aba em "V" vazada.
function envelope() {
  const s = roundRect(-0.13, -0.085, 0.26, 0.17, 0.02)
  const v = new Shape()
  v.moveTo(-0.1, 0.065)
  v.lineTo(0.1, 0.065)
  v.lineTo(0, -0.01)
  v.lineTo(-0.1, 0.065)
  s.holes.push(v)
  return [s]
}

// Luva de boxe: a mão (círculo grande), o polegar e o punho.
function glove() {
  const hand = new Shape()
  hand.absellipse(0.01, 0.03, 0.095, 0.1, 0, Math.PI * 2, false, 0)
  const thumb = new Shape()
  thumb.absellipse(-0.085, -0.005, 0.04, 0.055, 0, Math.PI * 2, false, 0.4)
  const cuff = roundRect(-0.07, -0.13, 0.15, 0.07, 0.015)
  return [hand, thumb, cuff]
}

// Monitor: tela (moldura com o vão), pé e base.
function monitor() {
  const screen = roundRect(-0.13, -0.03, 0.26, 0.17, 0.02)
  const glass = hole()
  rect(glass, -0.105, -0.007, 0.21, 0.125)
  screen.holes.push(glass)
  const neck = new Shape()
  rect(neck, -0.02, -0.08, 0.04, 0.05)
  const base = roundRect(-0.075, -0.11, 0.15, 0.035, 0.012)
  return [screen, neck, base]
}

// Camisa: corpo com mangas curtas e a gola recortada.
function jersey() {
  const s = new Shape()
  s.moveTo(-0.04, 0.12)
  s.quadraticCurveTo(0, 0.085, 0.04, 0.12)
  s.lineTo(0.13, 0.08)
  s.lineTo(0.105, 0.02)
  s.lineTo(0.075, 0.03)
  s.lineTo(0.075, -0.12)
  s.lineTo(-0.075, -0.12)
  s.lineTo(-0.075, 0.03)
  s.lineTo(-0.105, 0.02)
  s.lineTo(-0.13, 0.08)
  s.lineTo(-0.04, 0.12)
  return [s]
}

// Casa: telhado em triângulo e a porta vazada.
function house() {
  const s = new Shape()
  s.moveTo(0, 0.13)
  s.lineTo(0.135, 0.01)
  s.lineTo(0.095, 0.01)
  s.lineTo(0.095, -0.11)
  s.lineTo(-0.095, -0.11)
  s.lineTo(-0.095, 0.01)
  s.lineTo(-0.135, 0.01)
  s.lineTo(0, 0.13)
  const door = hole()
  rect(door, -0.03, -0.11, 0.06, 0.09)
  s.holes.push(door)
  return [s]
}

const ICONS: Record<MarkerIcon, () => Shape[]> = {
  contact: envelope,
  skills: glove,
  projects: monitor,
  about: jersey,
  door: house,
}

export default function Marker({ position, icon, active = false, onClick }: Props) {
  const ref = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const color = hovered || active ? HOVER : BLUE

  const iconGeometry = useMemo(() => {
    const g = new ExtrudeGeometry(ICONS[icon](), {
      depth: ICON_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 12,
    })
    g.center()
    return g
  }, [icon])

  // Troca a seta do mouse pela mãozinha enquanto estiver em cima.
  useCursor(hovered)

  // Flutuação: seno do tempo dá um vai e vem suave de 10 cm; o giro vai e
  // volta (meia volta para cada lado), para o ícone nunca ficar de costas
  // por muito tempo.
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = position[1] + Math.sin(t * 2) * 0.1
    ref.current.rotation.y = Math.sin(t * 0.9) * 0.6
  })

  return (
    <group
      ref={ref}
      scale={SIZE / R}
      position={position}
      // stopPropagation: o evento para aqui e não chega aos objetos atrás.
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => (e.stopPropagation(), onClick())}
    >
      {/* Medalha: disco com borda branca, e o ícone em relevo dos dois lados.
          Inclinada para trás, de frente para a câmera, que olha de cima. */}
      <group rotation-x={-TILT}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[R, R, DEPTH, 40]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh>
        <torusGeometry args={[R, 0.018, 10, 40]} />
        <meshStandardMaterial color={WHITE} roughness={0.4} side={DoubleSide} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} geometry={iconGeometry} position-z={(side * (DEPTH + ICON_DEPTH)) / 2} rotation-y={side === 1 ? 0 : Math.PI}>
          <meshStandardMaterial color={WHITE} roughness={0.4} />
        </mesh>
      ))}
      </group>
      {/* Pontinha embaixo, apontando para o objeto. */}
      <mesh position-y={-R - 0.05} rotation-x={Math.PI} castShadow>
        <coneGeometry args={[0.06, 0.1, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
    </group>
  )
}
