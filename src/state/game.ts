import { create } from 'zustand'
import type { StationId } from '../data/stations'

// Telas por cima do jogo: carregamento → ajuda (só no 1º acesso) → jogo.
export type Screen = 'loading' | 'help' | 'play'

// As duas cenas (docs/conceito.md): o terreno com a casa vista de fora e o
// interior, aberto ao passar pela porta.
export type Scene = 'exterior' | 'interior'

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
  scene: Scene
  nearby: StationId | null
  nearbyAt: [number, number] | null
  open: StationId | null
  training: Training | null
  hit: Hit | null
  dizzy: boolean
  setScreen: (screen: Screen) => void
  setScene: (scene: Scene) => void
  enter: (id: StationId, at: [number, number]) => void
  leave: (id: StationId) => void
  openStation: (id: StationId) => void
  close: () => void
  interact: () => void
  special: () => void
  endSpecial: () => boolean
  nextStrike: () => void
  landHit: (dir: [number, number]) => void
  finishTraining: () => void
}

// Cada treino novo (chegar no saco, ou voltar depois que ele saiu da guarda)
// começa num golpe sorteado; os seguintes seguem a sequência. O Character usa
// `step % número de golpes`, então qualquer inteiro serve.
const randomStep = () => Math.floor(Math.random() * 1000)

const bagNearby = (s: GameState) => (s.nearby === 'skills' ? s.nearbyAt : null)

// Easter egg do easter egg: 4 hurricane kicks seguidos (cada um começando até
// 3 s depois do fim do anterior) e o personagem fica tonto por 6,5 s: anda de
// bêbado, não corre e não luta até passar.
const DIZZY_SPINS = 4
const SPIN_GAP_MS = 3000
const DIZZY_MS = 6500
let spins = 0
let lastSpinEnd = 0

export const useGame = create<GameState>((set, get) => ({
  screen: 'loading',
  scene: 'exterior',
  nearby: null,
  nearbyAt: null,
  open: null,
  training: null,
  hit: null,
  dizzy: false,
  setScreen: (screen) => set({ screen }),
  // Trocar de cena desmonta as zonas sem avisar a saída: limpa tudo junto.
  setScene: (scene) => set({ scene, nearby: null, nearbyAt: null, open: null, training: null }),
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
    if (bag && s.dizzy) return
    if (bag) set({ training: { target: bag, step: randomStep(), queued: false, special: false } })
    else set({ open: s.nearby })
  },
  // Golpe secreto: interrompe o golpe em andamento (mas não abre por cima de
  // painel ou tela).
  special: () => {
    const s = get()
    if (s.dizzy || s.training?.special || (!s.training && !isPlaying(s))) return
    if (performance.now() - lastSpinEnd > SPIN_GAP_MS) spins = 0
    const step = s.training ? s.training.step + 1 : randomStep()
    set({ training: { target: bagNearby(s), step, queued: false, special: true } })
  },
  // Fim de um hurricane kick: conta o giro e, no 4º seguido, fica tonto.
  // Devolve true se ficou tonto (o treino acaba na hora).
  endSpecial: () => {
    lastSpinEnd = performance.now()
    spins++
    if (spins < DIZZY_SPINS) return false
    spins = 0
    set({ dizzy: true, training: null })
    setTimeout(() => set({ dizzy: false }), DIZZY_MS)
    return true
  },
  nextStrike: () =>
    set((s) => (s.training ? { training: { ...s.training, step: s.training.step + 1, queued: false, special: false } } : s)),
  landHit: (dir) => set((s) => ({ hit: { id: (s.hit?.id ?? 0) + 1, dir } })),
  finishTraining: () => set({ training: null }),
}))

/** O personagem só anda quando nenhuma tela, painel ou treino está em curso. */
export const isPlaying = (s: GameState) => s.screen === 'play' && s.open === null && s.training === null
