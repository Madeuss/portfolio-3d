import { Desk } from '../models/Desk'
import { ComputerScreen } from '../models/ComputerScreen'
import { ComputerKeyboard } from '../models/ComputerKeyboard'
import { ChairDesk } from '../models/ChairDesk'
import Marker from './Marker'

type Props = { position?: [number, number, number]; onOpen: () => void }

// Canto do escritório (tarefa 1.5) com móveis da Kenney (CC0).
// O kit vem em meia escala (a mesa tem 38 cm de altura), por isso o grupo
// inteiro tem scale 2. Com os seus modelos do Blender isso some: lá a gente
// já exporta em metros (tarefa 3.7).
export default function Office({ position = [0, 0, 0], onOpen }: Props) {
  return (
    <group position={position}>
      <group scale={2}>
        <Desk />
        <ComputerScreen position={[0.17, 0.38, -0.12]} />
        <ComputerKeyboard position={[0.22, 0.38, 0.02]} />
        <ChairDesk position={[0.36, 0, 0.3]} rotation-y={Math.PI} />
      </group>

      {/* Marcador da estação: flutua acima do monitor; clicar abre o painel. */}
      <Marker position={[0.75, 1.9, -0.2]} onClick={onOpen} />
    </group>
  )
}
