import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { KeyboardControls, useKeyboardControls } from '@react-three/drei'
import { Ecctrl, type EcctrlHandle, type MovementInput } from 'ecctrl'
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

// O ecctrl 2 não lê o teclado sozinho: a cada quadro a gente pega o estado
// das teclas e entrega com setMovement. Isso deixa trocar a fonte (joystick
// no celular, tarefa 7.3) sem mexer no personagem.
function KeyboardInput({ target }: { target: RefObject<EcctrlHandle | null> }) {
  const [, getKeys] = useKeyboardControls()

  useFrame(() => {
    target.current?.setMovement(getKeys() as MovementInput)
  })

  return null
}

// Rede de segurança: se cair do mapa, volta para o ponto de partida.
// No mapa de verdade as bordas de madeira impedem a queda; isto fica de reserva.
const FALL_LIMIT = -10

function Respawn({ target, spawn }: { target: RefObject<EcctrlHandle | null>; spawn: [number, number, number] }) {
  useFrame(() => {
    const player = target.current
    if (!player || player.currPos.y > FALL_LIMIT) return
    const [x, y, z] = spawn
    player.body.setTranslation({ x, y, z }, true)
    player.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
  })

  return null
}

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
        // Por padrão o Shift liga/desliga a corrida; assim é "segurar para correr".
        enableToggleRun={false}
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

      <KeyboardInput target={ref} />
      <Respawn target={ref} spawn={position} />
      <FollowCamera target={ref} />
    </KeyboardControls>
  )
}
