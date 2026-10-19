import { create } from 'zustand'
import type { StationId } from '../data/stations'

// Telas por cima do jogo: carregamento → ajuda (só no 1º acesso) → jogo.
export type Screen = 'loading' | 'help' | 'play'

// Golpes do treino no saco (animações do Mixamo em models/character/anims).
export const ATTACKS = ['boxing-1', 'boxing-2', 'kick', 'roundhouse-kick'] as const
export type Attack = (typeof ATTACKS)[number]

// Treino em andamento: qual golpe e onde está o saco (x, z no mundo).
export type Training = { attack: Attack; target: [number, number] }

// Último golpe que acertou o saco: `id` muda a cada acerto, `dir` é a direção
// (x, z) do personagem para o saco, para ele balançar para o lado certo.
export type Hit = { id: number; dir: [number, number] }

// Estado do jogo compartilhado entre a cena 3D e a interface HTML.
// `nearby`: estação em cuja zona o personagem está (mostra o "E ...").
// `open`: estação com o painel aberto.
type GameState = {
  screen: Screen
  nearby: StationId | null
  nearbyAt: [number, number] | null
  open: StationId | null
  training: Training | null
  hit: Hit | null
  setScreen: (screen: Screen) => void
  enter: (id: StationId, at: [number, number]) => void
  leave: (id: StationId) => void
  openStation: (id: StationId) => void
  close: () => void
  interact: () => void
  landHit: (dir: [number, number]) => void
  finishTraining: () => void
}

let lastAttack: Attack | null = null

// Sorteia um golpe diferente do anterior.
function pickAttack(): Attack {
  const options = ATTACKS.filter((a) => a !== lastAttack)
  lastAttack = options[Math.floor(Math.random() * options.length)]
  return lastAttack
}

export const useGame = create<GameState>((set, get) => ({
  screen: 'loading',
  nearby: null,
  nearbyAt: null,
  open: null,
  training: null,
  hit: null,
  setScreen: (screen) => set({ screen }),
  enter: (id, at) => set({ nearby: id, nearbyAt: at }),
  // Só limpa se for a mesma estação: ao passar de uma zona para outra
  // vizinha, o "entrou" da nova pode chegar antes do "saiu" da antiga.
  leave: (id) => set((s) => (s.nearby === id ? { nearby: null, nearbyAt: null } : s)),
  openStation: (id) => set({ open: id }),
  close: () => set({ open: null }),
  // Tecla E / botão A. O saco é só diversão: o personagem dá um golpe e
  // nenhum painel abre (o quadro de Skills vai para outro lugar depois).
  // Nas outras estações abre o painel.
  interact: () => {
    const s = get()
    if (!s.nearby || !isPlaying(s)) return
    if (s.nearby === 'skills' && s.nearbyAt) set({ training: { attack: pickAttack(), target: s.nearbyAt } })
    else set({ open: s.nearby })
  },
  landHit: (dir) => set((s) => ({ hit: { id: (s.hit?.id ?? 0) + 1, dir } })),
  finishTraining: () => set({ training: null }),
}))

/** O personagem só anda quando nenhuma tela, painel ou treino está em curso. */
export const isPlaying = (s: GameState) => s.screen === 'play' && s.open === null && s.training === null
