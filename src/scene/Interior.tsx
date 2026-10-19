import { CuboidCollider, RigidBody } from '@react-three/rapier'
import Office from './Office'
import PunchingBag from './PunchingBag'
import Station from './Station'
import BagSwing from './BagSwing'
import BagStand, { HOOK_HEIGHT } from './BagStand'
import Locker from './Locker'
import Prop from './Prop'

// Interior da casa (docs/planta.excalidraw, à direita): 10 × 10 m sem teto e
// sem paredes internas, com os cômodos em quatro cantos. Por enquanto só os
// móveis no lugar; piso, paredes e o visual madeusdev vêm na tarefa do interior.
// Os móveis ficam virados para o sul (para a câmera), mesmo onde a planta
// encosta eles na parede de lado.

const HALF = 5
// Onde o personagem aparece ao entrar: em cima do capacho, na porta sul.
export const INTERIOR_SPAWN: [number, number, number] = [0, 2, 4.2]

function Floor() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[HALF, 0.1, HALF]} position={[0, -0.1, 0]} />
      {/* Paredes invisíveis por enquanto, para não sair da casa. */}
      <CuboidCollider args={[HALF, 1, 0.1]} position={[0, 1, -HALF]} />
      <CuboidCollider args={[HALF, 1, 0.1]} position={[0, 1, HALF]} />
      <CuboidCollider args={[0.1, 1, HALF]} position={[-HALF, 1, 0]} />
      <CuboidCollider args={[0.1, 1, HALF]} position={[HALF, 1, 0]} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial color="#f1e0c5" />
      </mesh>
    </RigidBody>
  )
}

export default function Interior() {
  return (
    <>
      <Floor />

      {/* Academia (noroeste): saco de pancada e halteres. */}
      <Station id="skills" position={[-2.4, 0, -2.2]} zoneCenter={[0, 0.75, 0]} zoneSize={[1.2, 0.75, 1.2]} markerY={2.4}>
        <BagStand />
        {/* Pendurado no gancho: é dali que ele balança ao levar um golpe. O
            saco tem 1,4 m com a corrente, então a base fica a 30 cm do chão. */}
        <BagSwing pivotY={HOOK_HEIGHT}>
          <group position-y={HOOK_HEIGHT - 1.4}>
            <PunchingBag />
          </group>
        </BagSwing>
      </Station>
      {/* Halteres no rack: 1 unidade de altura; 90 cm. */}
      <Prop url="/models/ai/12-halteres.glb" scale={0.9} position={[-4.1, 0, -3.6]} rotationY={Math.PI / 6} />

      {/* Quarto (nordeste): cama de casal (1 unidade de comprimento; 2 m), com
          a cabeceira para o fundo. Limpa com scripts/clean_loose.py. */}
      <Prop url="/models/ai/10-cama.glb" scale={2} position={[3.4, 0, -3.3]} />

      {/* Escritório (sudeste). A mesa fica 0,73 m à direita da origem do Office. */}
      <Station id="projects" position={[2.6, 0, 2]} zoneCenter={[0.73, 0.75, 0.2]} zoneSize={[1.3, 0.75, 1.2]} markerY={1.9}>
        <Office />
      </Station>

      {/* Vestiário (sudoeste): os 3 armários lado a lado e o banco na frente. */}
      <Locker position={[-4.1, 0, 1.6]} shirt />
      <Locker position={[-3.45, 0, 1.6]} shirt />
      <Locker position={[-2.8, 0, 1.6]} shirt />
      {/* Banco: 1 unidade de comprimento; 1,3 m e 44 cm de altura. */}
      <Prop url="/models/ai/11-banco.glb" scale={1.3} position={[-3.45, 0, 2.8]} rotationY={Math.PI / 2} />
    </>
  )
}
