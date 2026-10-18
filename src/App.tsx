import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import TestScene from './scene/TestScene'

export default function App() {
  return (
    <>
      {/* Painel de ajustes: só aparece em dev (yarn dev), nunca no site publicado. */}
      <Leva hidden={!import.meta.env.DEV} collapsed={false} />

      {/* `shadows` liga o cálculo de sombras no renderizador. A câmera fica
          alta e inclinada, próxima do ângulo que o jogo vai usar. */}
      <Canvas shadows camera={{ position: [5, 6, 7], fov: 40 }}>
        <color attach="background" args={['#FAFAF7']} />
        <TestScene />
      </Canvas>
    </>
  )
}
