import { create } from 'zustand'
import type { StationId } from '../data/stations'

// Estado do jogo compartilhado entre a cena 3D e a interface HTML.
// `nearby`: estação em cuja zona o personagem está (mostra o "E ...").
// `open`: estação com o painel aberto (trava o personagem).
type GameState = {
  nearby: StationId | null
  open: StationId | null
  enter: (id: StationId) => void
  leave: (id: StationId) => void
  openStation: (id: StationId) => void
  close: () => void
}

export const useGame = create<GameState>((set) => ({
  nearby: null,
  open: null,
  enter: (id) => set({ nearby: id }),
  // Só limpa se for a mesma estação: ao passar de uma zona para outra
  // vizinha, o "entrou" da nova pode chegar antes do "saiu" da antiga.
  leave: (id) => set((s) => (s.nearby === id ? { nearby: null } : s)),
  openStation: (id) => set({ open: id }),
  close: () => set({ open: null }),
}))
