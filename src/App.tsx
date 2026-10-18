import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import TestScene from './scene/TestScene'
import Panel from './ui/Panel'
import { useGame } from './state/game'

// Tecla E: abre o painel da estação em cuja zona o personagem está.
function useInteractKey() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return
      const { nearby, open, openStation } = useGame.getState()
      if (nearby && !open) openStation(nearby)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  useInteractKey()

  return (
    <>
      {/* Painel de ajustes: só aparece em dev (yarn dev), nunca no site publicado. */}
      <Leva hidden={!import.meta.env.DEV} collapsed={false} />

      {/* `shadows` liga o cálculo de sombras. "percentage" = PCF: o tipo
          "soft" que o R3F usa por padrão saiu do three.js e gerava aviso. */}
      <Canvas shadows="percentage" camera={{ position: [5, 6, 7], fov: 40 }}>
        <color attach="background" args={['#FAFAF7']} />
        <TestScene />
      </Canvas>

      <Panel />
    </>
  )
}
