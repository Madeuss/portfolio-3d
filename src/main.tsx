import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGame } from './state/game'
import { player } from './state/player'

// Só em dev: a store e a posição do personagem no console (e nos testes com
// navegador automatizado). O build de produção remove este bloco.
if (import.meta.env.DEV) Object.assign(window, { __game: useGame, __player: player })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
