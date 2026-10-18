import { create } from 'zustand'
import type { StationId } from '../data/stations'

// Telas por cima do jogo: carregamento → ajuda (só no 1º acesso) → jogo.
export type Screen = 'loading' | 'help' | 'play'

// Estado do jogo compartilhado entre a cena 3D e a interface HTML.
// `nearby`: estação em cuja zona o personagem está (mostra o "E ...").
// `open`: estação com o painel aberto.
type GameState = {
  screen: Screen
  nearby: StationId | null
  open: StationId | null
  setScreen: (screen: Screen) => void
  enter: (id: StationId) => void
  leave: (id: StationId) => void
  openStation: (id: StationId) => void
  close: () => void
}

export const useGame = create<GameState>((set) => ({
  screen: 'loading',
  nearby: null,
  open: null,
  setScreen: (screen) => set({ screen }),
  enter: (id) => set({ nearby: id }),
  // Só limpa se for a mesma estação: ao passar de uma zona para outra
  // vizinha, o "entrou" da nova pode chegar antes do "saiu" da antiga.
  leave: (id) => set((s) => (s.nearby === id ? { nearby: null } : s)),
  openStation: (id) => set({ open: id }),
  close: () => set({ open: null }),
}))

/** O personagem só anda quando nenhuma tela ou painel está por cima. */
export const isPlaying = (s: GameState) => s.screen === 'play' && s.open === null
