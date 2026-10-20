import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGame } from './state/game'
import { ball, player } from './state/player'

// Só em dev: a store e as posições do personagem e da bola no console (e nos testes com
// navegador automatizado). O build de produção remove este bloco.
if (import.meta.env.DEV) Object.assign(window, { __game: useGame, __player: player, __ball: ball })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
