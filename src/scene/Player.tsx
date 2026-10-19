import { Suspense, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { KeyboardControls, useKeyboardControls } from '@react-three/drei'
import { Ecctrl, type EcctrlHandle, type MovementInput } from 'ecctrl'
import { EcctrlAnimationStateController } from 'ecctrl/animation'
import { useButtonStore, useJoystickStore } from 'ecctrl/input'
import { isPlaying, useGame } from '../state/game'
import Footsteps from '../audio/Footsteps'
import Character from './Character'
import FollowCamera from './FollowCamera'

// Teclas → ações que o ecctrl entende. Setas e WASD fazem a mesma coisa.
const KEYS = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'run', keys: ['Shift'] },
]

// Medidas da cápsula de colisão. O ecctrl faz o corpo "flutuar" `FLOAT`
// acima do chão com uma mola, por isso a cápsula não encosta no piso.
const RADIUS = 0.3
const HALF_HEIGHT = 0.35
const FLOAT = 0.3

// Velocidades em m/s (o padrão do ecctrl é 2 andando e 5 correndo). Mais
// baixas, combinam com o passo curto do avatar sem o pé patinar.
const WALK_SPEED = 1.3
const RUN_SPEED = 2.2

// Mola que gira o corpo para a direção do movimento (padrão 0,08 e 0,006).
// Mais fraca, o personagem vira devagar em vez de "estalar" de lado.
const TURN_SPRING = 0.03
const TURN_DAMPING = 0.0037

// O ecctrl 2 não lê o teclado sozinho: a cada quadro a gente junta o estado
// das teclas com o do joystick e do botão B (celular, tarefa 7.3) e entrega
// tudo com setMovement.
function MovementInputs({ target }: { target: RefObject<EcctrlHandle | null> }) {
  const [, getKeys] = useKeyboardControls()

  useFrame(() => {
    // Com painel, ajuda ou carregamento por cima, o personagem fica parado.
    if (!isPlaying(useGame.getState())) {
      target.current?.setMovement(STOPPED)
      return
    }
    const keys = getKeys() as MovementInput
    const { x, y } = useJoystickStore.getState().joysticks.default ?? NO_STICK
    const runButton = useButtonStore.getState().buttons.run ?? false
    // Sem pulo no jogo: jump sempre falso.
    target.current?.setMovement({ ...keys, joystick: { x, y }, run: keys.run || runButton, jump: false })
  })

  return null
}

const NO_STICK = { x: 0, y: 0 }

const STOPPED: MovementInput = {
  forward: false,
  backward: false,
  leftward: false,
  rightward: false,
  joystick: NO_STICK,
  run: false,
  jump: false,
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

// No treino, encosta o personagem no saco: para a ~0,62 m do centro dele
// (o mínimo é 0,57: raio da cápsula + raio do saco). Mais longe, o direto
// do chibi (≈0,42 m de alcance) não chegava no saco.
const PUNCH_DISTANCE = 0.62
const APPROACH_SPEED = 8

function TrainingApproach({ target }: { target: RefObject<EcctrlHandle | null> }) {
  useFrame((_, delta) => {
    const training = useGame.getState().training
    const player = target.current
    if (!training?.target || !player) return
    const pos = player.body.translation()
    const [tx, tz] = training.target
    const dx = pos.x - tx
    const dz = pos.z - tz
    const dist = Math.hypot(dx, dz) || 1
    const k = 1 - Math.exp(-APPROACH_SPEED * delta)
    const x = pos.x + (tx + (dx / dist) * PUNCH_DISTANCE - pos.x) * k
    const z = pos.z + (tz + (dz / dist) * PUNCH_DISTANCE - pos.z) * k
    player.body.setTranslation({ x, y: pos.y, z }, true)
  })

  return null
}

type Props = { position: [number, number, number] }

// Personagem jogável (tarefas 2.3 e 2.4): o ecctrl cuida da física numa
// cápsula invisível, e o Character desenha o boneco animado dentro dela.
export default function Player({ position }: Props) {
  const ref = useRef<EcctrlHandle>(null)

  return (
    <KeyboardControls map={KEYS}>
      <Ecctrl
        ref={ref}
        capsuleRadius={RADIUS}
        capsuleHalfHeight={HALF_HEIGHT}
        floatHeight={FLOAT}
        maxWalkVel={WALK_SPEED}
        maxRunVel={RUN_SPEED}
        autoBalanceSpringOnY={TURN_SPRING}
        autoBalanceDampingOnY={TURN_DAMPING}
        // Por padrão o Shift liga/desliga a corrida; assim é "segurar para correr".
        enableToggleRun={false}
        // O ecctrl repassa estas props direto para o RigidBody do personagem.
        // userData.player: é assim que as zonas das estações reconhecem ele.
        position={position}
        userData={{ player: true }}
      >
        {/* Suspense: enquanto o modelo baixa, nada aparece (sem travar a cena). */}
        <Suspense fallback={null}>
          <Character />
        </Suspense>
      </Ecctrl>

      {/* Lê o estado do ecctrl (parado, andando, correndo, pulando) e publica
          numa store que o Character escuta para trocar a animação. */}
      <EcctrlAnimationStateController ecctrl={ref} />

      <MovementInputs target={ref} />
      <Respawn target={ref} spawn={position} />
      <TrainingApproach target={ref} />
      <Footsteps />
      <FollowCamera target={ref} />
    </KeyboardControls>
  )
}
