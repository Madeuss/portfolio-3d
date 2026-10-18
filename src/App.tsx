import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import TestScene from './scene/TestScene'
import Panel from './ui/Panel'
import Hud from './ui/Hud'
import HelpScreen from './ui/HelpScreen'
import LoadingScreen from './ui/LoadingScreen'
import { useDocumentLocale } from './i18n'
import { isPlaying, useGame } from './state/game'
import './ui/screens.css'

// Tecla E: abre o painel da estação em cuja zona o personagem está.
function useInteractKey() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return
      const state = useGame.getState()
      if (state.nearby && isPlaying(state)) state.openStation(state.nearby)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  useInteractKey()
  useDocumentLocale()

  return (
    <>
      {/* Painel de ajustes: só aparece em dev (yarn dev), nunca no site publicado. */}
      <Leva hidden={!import.meta.env.DEV} collapsed />

      {/* A cena já carrega por trás da tela de carregamento. `shadows`
          "percentage" = PCF: o tipo "soft" padrão do R3F saiu do three.js. */}
      <Canvas shadows="percentage" camera={{ position: [5, 6, 7], fov: 40 }}>
        <color attach="background" args={['#FAFAF7']} />
        <TestScene />
      </Canvas>

      <Hud />
      <Panel />
      <HelpScreen />
      <LoadingScreen />
    </>
  )
}
