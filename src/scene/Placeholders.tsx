import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'

// Objetos provisórios, feitos com formas simples, até os modelos do Blender
// (fases 3 e 5) ficarem prontos. Ficam no lugar certo para testar as zonas.

const DARK = '#14161c'

// Saco de pancada num pedestal: estação de Skills (academia).
export function PunchingBag() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CylinderCollider args={[0.75, 0.3]} position={[0, 0.75, 0]} />
      {/* base */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.45, 0.1, 24]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      {/* saco */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.8, 8, 24]} />
        <meshStandardMaterial color={DARK} roughness={0.25} metalness={0.3} />
      </mesh>
      {/* faixa azul */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.255, 0.255, 0.12, 24]} />
        <meshStandardMaterial color="#0A3FB8" />
      </mesh>
    </RigidBody>
  )
}

// Caixa de correio num poste: estação de Contato (entrada do terreno).
export function Mailbox() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[0.25, 0.6, 0.2]} position={[0, 0.6, 0]} />
      {/* poste */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.1, 0.9, 0.1]} />
        <meshStandardMaterial color="#8a5a2b" />
      </mesh>
      {/* caixa */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.45, 0.3, 0.3]} />
        <meshStandardMaterial color="#f08c00" />
      </mesh>
      {/* bandeirinha */}
      <mesh position={[0.25, 1.1, 0]} castShadow>
        <boxGeometry args={[0.03, 0.2, 0.08]} />
        <meshStandardMaterial color="#e03131" />
      </mesh>
    </RigidBody>
  )
}
