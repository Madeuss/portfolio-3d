import { CuboidCollider, RigidBody } from '@react-three/rapier'

// Objetos provisórios, feitos com formas simples, até os modelos do Blender
// (fases 3 e 5) ficarem prontos. Ficam no lugar certo para testar as zonas.

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
