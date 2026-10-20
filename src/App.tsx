import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import World from './scene/World'
import Panel from './ui/Panel'
import Hud from './ui/Hud'
import GoalToast from './ui/GoalToast'
import HelpScreen from './ui/HelpScreen'
import LoadingScreen from './ui/LoadingScreen'
import TouchControls from './ui/TouchControls'
import SoundEffects from './audio/SoundEffects'
import { useDocumentLocale } from './i18n'
import { isTouch } from './state/device'
import { useGame } from './state/game'
import './ui/screens.css'

// Golpe secreto (easter egg, fora da tela de ajuda de propósito): a entrada
// do hurricane kick do Street Fighter, ↓ ← + chute. Aqui: ↓ ← E (ou S A E),
// tudo em menos de COMBO_MS. No celular é A+B (TouchControls).
const DOWN = ['ArrowDown', 'KeyS']
const BACK = ['ArrowLeft', 'KeyA']
const COMBO_MS = 600

// Tecla E: interage com a estação em cuja zona o personagem está (perto da
// bola: toque rápido = passe, segurar = embaixadinha).
function useInteractKey() {
  useEffect(() => {
    let down = 0
    let back = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const now = performance.now()
      if (DOWN.includes(e.code)) down = now
      else if (BACK.includes(e.code)) back = now
      // Shift no meio da embaixadinha: bicicleta (easter egg).
      if (e.key === 'Shift' && useGame.getState().training?.juggle) useGame.getState().bicycle()
      if (e.code !== 'KeyE') return
      const combo = down > 0 && back > down && now - down < COMBO_MS
      down = back = 0
      if (combo) useGame.getState().special()
      else useGame.getState().press()
    }
    // Soltar o E: perto da bola, decide entre passe e fim da embaixadinha.
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') useGame.getState().release()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])
}

export default function App() {
  useInteractKey()
  useDocumentLocale()
  const loading = useGame((s) => s.screen === 'loading')
  const fading = useGame((s) => s.fading)

  return (
    <>
      {/* Painel de ajustes: só aparece em dev (yarn dev), nunca no site publicado.
          Some na tela de carregamento para não cobrir o seletor de idioma. */}
      <Leva hidden={!import.meta.env.DEV || loading} collapsed />

      {/* A cena já carrega por trás da tela de carregamento. `shadows`
          "percentage" = PCF: o tipo "soft" padrão do R3F saiu do three.js. */}
      {/* dpr: resolução máxima em telas de alta densidade. Acima de 1,5 (2 no
          desktop) o custo cresce muito e a diferença quase não aparece. */}
      {/* frameloop: atrás da tela de carregamento a cena só desenha quando
          pedem (o aquecimento, World), em vez de 60 quadros por segundo. Com o
          processador livre, o clique em "Entrar" responde na hora. */}
      <Canvas
        shadows="percentage"
        dpr={[1, isTouch() ? 1.5 : 2]}
        camera={{ position: [5, 6, 7], fov: 40 }}
        frameloop={loading ? 'demand' : 'always'}
      >
        <World />
      </Canvas>

      {/* Escurece a tela na troca de cena (porta da casa). */}
      <div className={`fade${fading ? ' fade--on' : ''}`} aria-hidden="true" />

      <SoundEffects />
      <Hud />
      <GoalToast />
      <TouchControls />
      <Panel />
      <HelpScreen />
      <LoadingScreen />
    </>
  )
}
