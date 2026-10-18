import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import type { Group } from 'three'

type Props = { position: [number, number, number]; onClick: () => void }

const BLUE = '#0A3FB8'
const HOVER = '#f08c00'

// Marcador de estação (tarefa 1.6): sobe e desce sozinho, muda de cor com o
// mouse em cima e avisa o clique (tarefa 1.7).
export default function Marker({ position, onClick }: Props) {
  const ref = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  // Troca a seta do mouse pela mãozinha enquanto estiver em cima.
  useCursor(hovered)

  // Flutuação: seno do tempo dá um vai e vem suave de 10 cm.
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2) * 0.1
    ref.current.rotation.y += 0.01
  })

  return (
    <group
      ref={ref}
      position={position}
      // stopPropagation: o evento para aqui e não chega aos objetos atrás.
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => (e.stopPropagation(), onClick())}
    >
      {/* Pino: esfera em cima de um cone de ponta para baixo. */}
      <mesh position-y={0.18} castShadow>
        <sphereGeometry args={[0.16, 24, 16]} />
        <meshStandardMaterial color={hovered ? HOVER : BLUE} />
      </mesh>
      <mesh rotation-x={Math.PI} castShadow>
        <coneGeometry args={[0.1, 0.25, 24]} />
        <meshStandardMaterial color={hovered ? HOVER : BLUE} />
      </mesh>
    </group>
  )
}
