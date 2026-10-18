import type { ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { CuboidCollider, RigidBody, type IntersectionEnterPayload } from '@react-three/rapier'
import { stationPrompt, type StationId } from '../data/stations'
import { useI18n } from '../i18n'
import { isPlaying, useGame } from '../state/game'
import Marker from './Marker'

type Vec3 = [number, number, number]

type Props = {
  id: StationId
  position: Vec3
  /** Centro da zona de interação, relativo a `position`. */
  zoneCenter: Vec3
  /** Meias-medidas da zona (x, y, z): [1, 1, 1] = cubo de 2 m. */
  zoneSize: Vec3
  /** Altura do marcador flutuante. */
  markerY: number
  children: ReactNode
}

const isPlayer = ({ other }: IntersectionEnterPayload) =>
  (other.rigidBody?.userData as { player?: boolean } | undefined)?.player === true

// Estação interativa (tarefa 2.6): o objeto + uma zona invisível em volta.
// A zona é um collider "sensor": não empurra nada, só avisa quando o
// personagem entra e sai. Dentro dela aparece "E ..." e a tecla E abre o painel.
export default function Station({ id, position, zoneCenter, zoneSize, markerY, children }: Props) {
  const enter = useGame((s) => s.enter)
  const leave = useGame((s) => s.leave)
  const openStation = useGame((s) => s.openStation)
  const showPrompt = useGame((s) => s.nearby === id && isPlaying(s))
  const t = useI18n((s) => s.t)

  return (
    <group position={position}>
      {children}

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={zoneSize}
          position={zoneCenter}
          onIntersectionEnter={(e) => isPlayer(e) && enter(id)}
          onIntersectionExit={(e) => isPlayer(e) && leave(id)}
        />
      </RigidBody>

      <Marker position={[zoneCenter[0], markerY, zoneCenter[2]]} active={showPrompt} onClick={() => openStation(id)} />

      {/* Html: um elemento do DOM preso a um ponto 3D, que acompanha a câmera.
          Fica sempre montado e só troca de classe, para o CSS animar tanto a
          entrada quanto a saída do aviso. */}
      <Html position={[zoneCenter[0], markerY + 0.55, zoneCenter[2]]} center zIndexRange={[10, 0]}>
        <div className={`prompt${showPrompt ? ' prompt--visible' : ''}`} aria-hidden={!showPrompt}>
          <kbd>E</kbd>
          {stationPrompt(id, t)}
        </div>
      </Html>
    </group>
  )
}
