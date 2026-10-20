import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3, type Group } from 'three'
import { useGame } from '../state/game'

// Faz o saco balançar quando leva um golpe: ele gira em volta do ponto onde
// fica pendurado (`pivotY`), como um pêndulo com mola que vai parando.
// Só o desenho balança; a colisão do saco continua parada no lugar.

// Mola e atrito do pêndulo, e o "empurrão" de cada golpe (rad/s).
const STIFFNESS = 30
const DAMPING = 3.2
const KICK = 1.6
// Ângulo máximo, para nenhum combo jogar o saco na horizontal. Na volta (em
// direção a quem bateu) ele quase não passa do meio: a cabeça grande do chibi
// fica perto do saco e entraria nele.
const MAX_ANGLE = 0.45
const MAX_BACK = 0.06

const UP = new Vector3(0, 1, 0)

type Props = { pivotY: number; children: ReactNode }

export default function BagSwing({ pivotY, children }: Props) {
  const swing = useRef<Group>(null)
  const state = useRef({ angle: 0, speed: 0, axis: new Vector3(1, 0, 0), hit: 0 })
  const q = useRef(new Quaternion())

  useFrame((_, delta) => {
    const s = state.current
    const hit = useGame.getState().hit
    if (hit && hit.id !== s.hit) {
      s.hit = hit.id
      // Eixo de giro: perpendicular à direção do golpe, no chão. O saco vai
      // para longe de quem bateu.
      s.axis.set(hit.dir[0], 0, hit.dir[1]).normalize().cross(UP)
      s.speed += KICK
    }

    const dt = Math.min(delta, 1 / 30)
    s.speed += (-STIFFNESS * s.angle - DAMPING * s.speed) * dt
    s.angle += s.speed * dt
    if (s.angle < -MAX_BACK) {
      // bateu no limite da volta: perde o embalo, como um saco pesado
      s.angle = -MAX_BACK
      s.speed *= -0.3
    }
    s.angle = Math.min(MAX_ANGLE, s.angle)
    swing.current?.quaternion.copy(q.current.setFromAxisAngle(s.axis, s.angle))
  })

  return (
    <group position-y={pivotY}>
      <group ref={swing}>
        <group position-y={-pivotY}>{children}</group>
      </group>
    </group>
  )
}
