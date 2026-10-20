import { useState } from 'react'
import { Html } from '@react-three/drei'
import { CuboidCollider, RigidBody, type IntersectionEnterPayload } from '@react-three/rapier'
import { useI18n } from '../i18n'
import { useIsTouch } from '../state/device'
import { isPlaying, useGame, type Seat } from '../state/game'

// Zona na frente de um assento (sofá, bancos): perto dela aparece "E Sentar".
// Sem marcador flutuante, como o saco e a bola: é brincadeira, não abre painel.

const isPlayer = ({ other }: IntersectionEnterPayload) =>
  (other.rigidBody?.userData as { player?: boolean } | undefined)?.player === true

type Props = {
  seat: Seat
  /** Meia-largura da zona, ao longo do assento. */
  width?: number
  /** Texto do aviso: "Sentar" ou "Balançar". */
  label?: 'seat' | 'swing'
}

export default function SeatZone({ seat, width = 0.5, label = 'seat' }: Props) {
  const enter = useGame((s) => s.enter)
  const leave = useGame((s) => s.leave)
  const nearSeat = useGame((s) => s.nearSeat)
  const showPrompt = useGame((s) => s.nearby === 'seat' && s.seatNear === seat && isPlaying(s))
  const t = useI18n((s) => s.t)
  const key = useIsTouch() ? 'A' : 'E'
  // Posição de quando a zona nasce: o assento do balanço muda de lugar a
  // cada quadro, e a zona fica parada onde ele descansa.
  const [{ center, yaw, height, depth }] = useState(() => ({ ...seat, center: [...seat.center] as [number, number] }))
  // a zona fica na frente do assento, virada como ele
  const front = depth + 0.35

  return (
    <group position={[center[0], 0, center[1]]} rotation-y={yaw}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={[width, 0.75, 0.35]}
          position={[0, 0.75, front]}
          onIntersectionEnter={(e) => {
            if (!isPlayer(e)) return
            nearSeat(seat)
            enter('seat', seat.center)
          }}
          onIntersectionExit={(e) => isPlayer(e) && leave('seat')}
        />
      </RigidBody>
      <Html position={[0, height + 0.9, 0]} center zIndexRange={[10, 0]}>
        <div className={`prompt${showPrompt ? ' prompt--visible' : ''}`} aria-hidden={!showPrompt}>
          <kbd>{key}</kbd>
          {t[label]}
        </div>
      </Html>
    </group>
  )
}
