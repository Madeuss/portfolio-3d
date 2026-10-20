import type { ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { CuboidCollider, RigidBody, type IntersectionEnterPayload } from '@react-three/rapier'
import { stationPrompt } from '../data/stations'
import { useI18n } from '../i18n'
import { useIsTouch } from '../state/device'
import { isPlaying, useGame, type ZoneId } from '../state/game'
import Marker, { type MarkerIcon } from './Marker'

type Vec3 = [number, number, number]

type Props = {
  /** Estação, a porta da casa (troca de cena) ou o saco (luta). */
  id: Exclude<ZoneId, 'ball' | 'seat' | 'dog'>
  /** Ícone do marcador flutuante; null = sem marcador (o saco: medalha só onde
      abre painel). Por padrão, o da estação. */
  icon?: MarkerIcon | null
  position: Vec3
  /** Centro da zona de interação, relativo a `position`. */
  zoneCenter: Vec3
  /** Meias-medidas da zona (x, y, z): [1, 1, 1] = cubo de 2 m. */
  zoneSize: Vec3
  /** Altura do marcador flutuante. */
  markerY: number
  /** Onde fica o marcador (x, z relativos a `position`), se não for no centro da zona. */
  markerAt?: [number, number]
  children?: ReactNode
}

const defaultIcon = (id: Props['id']): MarkerIcon | null =>
  id === 'bag' ? null : id.startsWith('exp-') ? 'experience' : (id as MarkerIcon)

const isPlayer = ({ other }: IntersectionEnterPayload) =>
  (other.rigidBody?.userData as { player?: boolean } | undefined)?.player === true

// Estação interativa (tarefa 2.6): o objeto + uma zona invisível em volta.
// A zona é um collider "sensor": não empurra nada, só avisa quando o
// personagem entra e sai. Dentro dela aparece "E ..." e a tecla E abre o painel.
export default function Station({ id, position, zoneCenter, zoneSize, markerY, markerAt, icon, children }: Props) {
  const markerIcon = icon === undefined ? defaultIcon(id) : icon
  const [mx, mz] = markerAt ?? [zoneCenter[0], zoneCenter[2]]
  const enter = useGame((s) => s.enter)
  const leave = useGame((s) => s.leave)
  const openStation = useGame((s) => s.openStation)
  const interact = useGame((s) => s.interact)
  const goThrough = useGame((s) => s.goThrough)
  const outside = useGame((s) => s.scene === 'exterior')
  const showPrompt = useGame((s) => s.nearby === id && isPlaying(s))
  const t = useI18n((s) => s.t)
  // No celular quem interage é o botão A; no teclado, a tecla E.
  const key = useIsTouch() ? 'A' : 'E'

  return (
    <group position={position}>
      {children}

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={zoneSize}
          position={zoneCenter}
          onIntersectionEnter={(e) => isPlayer(e) && enter(id, [position[0] + zoneCenter[0], position[2] + zoneCenter[2]])}
          onIntersectionExit={(e) => isPlayer(e) && leave(id)}
        />
      </RigidBody>

      {markerIcon && (
        <Marker
          position={[mx, markerY, mz]}
          icon={markerIcon}
          active={showPrompt}
          onClick={() => (id === 'door' ? goThrough() : id === 'bag' ? interact() : openStation(id))}
        />
      )}

      {/* Html: um elemento do DOM preso a um ponto 3D, que acompanha a câmera.
          Fica sempre montado e só troca de classe, para o CSS animar tanto a
          entrada quanto a saída do aviso. */}
      <Html position={[mx, markerY + 0.55, mz]} center zIndexRange={[10, 0]}>
        <div className={`prompt${showPrompt ? ' prompt--visible' : ''}`} aria-hidden={!showPrompt}>
          <kbd>{key}</kbd>
          {id === 'door' ? (outside ? t.door.enter : t.door.exit) : stationPrompt(id, t)}
        </div>
      </Html>
    </group>
  )
}
