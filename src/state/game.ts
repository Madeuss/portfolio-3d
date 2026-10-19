import { create } from 'zustand'
import type { StationId } from '../data/stations'

// Telas por cima do jogo: carregamento → ajuda (só no 1º acesso) → jogo.
export type Screen = 'loading' | 'help' | 'play'

// Treino no saco, como num jogo de luta: cada E é um golpe da sequência
// (`step`, índice em STRIKES no Character). Apertar durante um golpe deixa o
// próximo guardado (`queued`) para emendar sem perder o ritmo.
// `special`: o golpe secreto (Shift+E, ou A+B no celular). Funciona em
// qualquer lugar; `target` é o saco quando ele está perto, senão null.
export type Training = { target: [number, number] | null; step: number; queued: boolean; special: boolean }

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
  special: () => void
  nextStrike: () => void
  landHit: (dir: [number, number]) => void
  finishTraining: () => void
}

// Cada treino novo (chegar no saco, ou voltar depois que ele saiu da guarda)
// começa num golpe sorteado; os seguintes seguem a sequência. O Character usa
// `step % número de golpes`, então qualquer inteiro serve.
const randomStep = () => Math.floor(Math.random() * 1000)

const bagNearby = (s: GameState) => (s.nearby === 'skills' ? s.nearbyAt : null)

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
  // Tecla E / botão A. O saco é só diversão: cada toque é um golpe e nenhum
  // painel abre (o quadro de Skills vai para outro lugar depois). Nas outras
  // estações abre o painel.
  interact: () => {
    const s = get()
    if (s.training) {
      if (s.training.target) set({ training: { ...s.training, queued: true } })
      return
    }
    if (!s.nearby || !isPlaying(s)) return
    const bag = bagNearby(s)
    if (bag) set({ training: { target: bag, step: randomStep(), queued: false, special: false } })
    else set({ open: s.nearby })
  },
  // Golpe secreto: interrompe o golpe em andamento (mas não abre por cima de
  // painel ou tela).
  special: () => {
    const s = get()
    if (s.training?.special || (!s.training && !isPlaying(s))) return
    const step = s.training ? s.training.step + 1 : randomStep()
    set({ training: { target: bagNearby(s), step, queued: false, special: true } })
  },
  nextStrike: () =>
    set((s) => (s.training ? { training: { ...s.training, step: s.training.step + 1, queued: false, special: false } } : s)),
  landHit: (dir) => set((s) => ({ hit: { id: (s.hit?.id ?? 0) + 1, dir } })),
  finishTraining: () => set({ training: null }),
}))

/** O personagem só anda quando nenhuma tela, painel ou treino está em curso. */
export const isPlaying = (s: GameState) => s.screen === 'play' && s.open === null && s.training === null
