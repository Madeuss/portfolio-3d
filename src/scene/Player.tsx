import { useRef } from 'react'
import { KeyboardControls } from '@react-three/drei'
import { Ecctrl, type EcctrlHandle } from 'ecctrl'
import FollowCamera from './FollowCamera'

// Teclas → ações que o ecctrl entende. Setas e WASD fazem a mesma coisa.
const KEYS = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
]

// Medidas da cápsula de colisão. O ecctrl faz o corpo "flutuar" `FLOAT`
// acima do chão com uma mola, por isso a cápsula não encosta no piso.
const RADIUS = 0.3
const HALF_HEIGHT = 0.35
const FLOAT = 0.3

type Props = { position: [number, number, number] }

// Personagem provisório (tarefa 2.3): uma cápsula no lugar do boneco.
// Na tarefa 2.4 a cápsula vira o personagem animado, sem mexer no resto.
export default function Player({ position }: Props) {
  const ref = useRef<EcctrlHandle>(null)

  return (
    <KeyboardControls map={KEYS}>
      <Ecctrl
        ref={ref}
        capsuleRadius={RADIUS}
        capsuleHalfHeight={HALF_HEIGHT}
        floatHeight={FLOAT}
        props={{ position }}
      >
        <mesh castShadow>
          <capsuleGeometry args={[RADIUS, HALF_HEIGHT * 2, 8, 16]} />
          <meshStandardMaterial color="#14161c" />
        </mesh>
        {/* "Nariz" para dar para ver para onde a cápsula está virada. */}
        <mesh position={[0, 0.25, RADIUS]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.12]} />
          <meshStandardMaterial color="#0A3FB8" />
        </mesh>
      </Ecctrl>

      <FollowCamera target={ref} />
    </KeyboardControls>
  )
}
