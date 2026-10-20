import { create } from 'zustand'
import type { StationId } from '../data/stations'

// Telas por cima do jogo: carregamento → ajuda (só no 1º acesso) → jogo.
export type Screen = 'loading' | 'help' | 'play'

// As duas cenas (docs/conceito.md): o terreno com a casa vista de fora e o
// interior, aberto ao passar pela porta.
export type Scene = 'exterior' | 'interior'

// Zona perto da qual o personagem pode estar: uma estação (abre painel), a
// porta da casa (troca de cena, dos dois lados), o saco de pancada (luta, só
// diversão), a bola (chute) ou um assento.
export type ZoneId = StationId | 'door' | 'bag' | 'ball' | 'seat'

// Gol no campinho: `id` muda a cada gol, `at` é onde soltar o confete.
export type Goal = { id: number; at: [number, number] }

// Troca de cena pela porta: a tela escurece em FADE_MS, a cena troca no
// escuro e clareia de novo depois de HOLD_MS (tempo de a nova cena montar).
const FADE_MS = 350
const HOLD_MS = 250

// Treino no saco, como num jogo de luta: cada E é um golpe da sequência
// (`step`, índice em STRIKES no Character). Apertar durante um golpe deixa o
// próximo guardado (`queued`) para emendar sem perder o ritmo.
// `special`: o golpe secreto (Shift+E, ou A+B no celular). Funciona em
// qualquer lugar; `target` é o saco quando ele está perto, senão null.
// `ball`: em vez do saco, a bola do campinho: um passe (um golpe só) ou, com
// `juggle`, embaixadinha (pé, joelho e cabeça enquanto o botão fica apertado).
export type Training = {
  target: [number, number] | null
  step: number
  queued: boolean
  special: boolean
  ball: boolean
  juggle: boolean
  /** Easter egg: no meio da embaixadinha, Shift (ou B) vira bicicleta. */
  bicycle?: boolean
}

// Lugar para sentar (sofá, bancos). `center`: meio do assento; `yaw`: para
// onde quem senta olha; `height`: altura do assento; `depth`: do meio do
// assento até a frente do móvel (onde o corpo físico fica parado); `edge`:
// quanto o quadril fica à frente do meio do assento.
export type Seat = { center: [number, number]; yaw: number; height: number; depth: number; edge: number }
// Sentado: descendo, parado ou levantando.
export type Sitting = { seat: Seat; phase: 'down' | 'sit' | 'up' }

// Cada toque da embaixadinha: a bola vai até a altura `y` (centro, m) em
// `flight` segundos, numa parábola; `release` = último toque, a bola sai na física.
// `at`: onde a bola para (x, z); sem ele, no alvo do treino (na frente do pé).
export type JuggleTouch = { id: number; y: number; flight: number; release: boolean; at?: [number, number] }

// Segurar o botão por PRESS_HOLD_MS perto da bola vira embaixadinha; soltar antes é passe.
const PRESS_HOLD_MS = 220
let holdTimer: ReturnType<typeof setTimeout> | null = null

// Último golpe que acertou o saco: `id` muda a cada acerto, `dir` é a direção
// (x, z) do personagem para o saco, para ele balançar para o lado certo.
export type Hit = { id: number; dir: [number, number]; bicycle?: boolean }

// Estado do jogo compartilhado entre a cena 3D e a interface HTML.
// `nearby`: estação em cuja zona o personagem está (mostra o "E ...").
// `open`: estação com o painel aberto.
type GameState = {
  screen: Screen
  scene: Scene
  /** Onde o personagem aparece na cena: no começo (portão) ou na porta. */
  spawn: 'start' | 'door'
  /** Tela escurecida durante a troca de cena. */
  fading: boolean
  nearby: ZoneId | null
  nearbyAt: [number, number] | null
  open: StationId | null
  training: Training | null
  hit: Hit | null
  /** Último chute na bola (mesmo formato do acerto no saco). */
  kick: Hit | null
  goal: Goal | null
  juggle: JuggleTouch | null
  /** Botão de ação (E / A) apertado agora. */
  holding: boolean
  /** Assento perto do personagem (o "E Sentar" aparece) e o assento em uso. */
  seatNear: Seat | null
  sitting: Sitting | null
  /** Gols nesta visita (placar do campinho). */
  goals: number
  dizzy: boolean
  setScreen: (screen: Screen) => void
  setScene: (scene: Scene, spawn?: 'start' | 'door') => void
  goThrough: () => void
  enter: (id: ZoneId, at: [number, number]) => void
  leave: (id: ZoneId) => void
  openStation: (id: StationId) => void
  close: () => void
  interact: () => void
  /** Botão de ação apertado / solto (teclado e toque). */
  press: () => void
  release: () => void
  juggleTouch: (y: number, flight: number, release: boolean, at?: [number, number]) => void
  bicycle: () => void
  nearSeat: (seat: Seat | null) => void
  standUp: () => void
  setSitPhase: (phase: Sitting['phase']) => void
  finishSitting: () => void
  special: () => void
  endSpecial: () => boolean
  nextStrike: () => void
  landHit: (dir: [number, number]) => void
  kickBall: (dir: [number, number], bicycle?: boolean) => void
  scoreGoal: (at: [number, number]) => void
  finishTraining: () => void
}

// Cada treino novo (chegar no saco, ou voltar depois que ele saiu da guarda)
// começa num golpe sorteado; os seguintes seguem a sequência. O Character usa
// `step % número de golpes`, então qualquer inteiro serve.
const randomStep = () => Math.floor(Math.random() * 1000)

const bagNearby = (s: GameState) => (s.nearby === 'bag' ? s.nearbyAt : null)

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
  spawn: 'start',
  fading: false,
  nearby: null,
  nearbyAt: null,
  open: null,
  training: null,
  hit: null,
  kick: null,
  goal: null,
  juggle: null,
  holding: false,
  seatNear: null,
  sitting: null,
  goals: 0,
  dizzy: false,
  setScreen: (screen) => set({ screen }),
  // Trocar de cena desmonta as zonas sem avisar a saída: limpa tudo junto.
  setScene: (scene, spawn = 'start') =>
    set({ scene, spawn, nearby: null, nearbyAt: null, open: null, training: null, sitting: null, seatNear: null }),
  // Passa pela porta: escurece, troca para a outra cena (aparecendo na porta
  // de lá) e clareia.
  goThrough: () => {
    if (get().fading) return
    set({ fading: true })
    setTimeout(() => get().setScene(get().scene === 'exterior' ? 'interior' : 'exterior', 'door'), FADE_MS)
    setTimeout(() => set({ fading: false }), FADE_MS + HOLD_MS)
  },
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
      if (s.training.target && !s.training.ball) set({ training: { ...s.training, queued: true } })
      return
    }
    // Sentado: E levanta.
    if (s.sitting) return s.standUp()
    if (!s.nearby || !isPlaying(s)) return
    if (s.nearby === 'door') return s.goThrough()
    if (s.nearby === 'seat') {
      if (s.seatNear && !s.dizzy) set({ sitting: { seat: s.seatNear, phase: 'down' } })
      return
    }
    if (s.nearby === 'ball') {
      if (s.nearbyAt && !s.dizzy) set({ training: { target: s.nearbyAt, step: 0, queued: false, special: false, ball: true, juggle: false } })
      return
    }
    const bag = bagNearby(s)
    if (bag && s.dizzy) return
    if (bag) set({ training: { target: bag, step: randomStep(), queued: false, special: false, ball: false, juggle: false } })
    else if (s.nearby !== 'bag') set({ open: s.nearby })
  },
  // Perto da bola, o botão espera PRESS_HOLD_MS para saber se é passe (toque
  // rápido) ou embaixadinha (segurou). Fora dela, interage na hora.
  press: () => {
    const s = get()
    set({ holding: true })
    if (s.nearby !== 'ball' || s.training || !isPlaying(s) || s.dizzy) return s.interact()
    if (holdTimer) clearTimeout(holdTimer)
    holdTimer = setTimeout(() => {
      holdTimer = null
      const now = get()
      if (!now.holding || now.nearby !== 'ball' || !now.nearbyAt || !isPlaying(now)) return
      set({ training: { target: now.nearbyAt, step: 0, queued: false, special: false, ball: true, juggle: true } })
    }, PRESS_HOLD_MS)
  },
  release: () => {
    set({ holding: false })
    if (!holdTimer) return
    clearTimeout(holdTimer)
    holdTimer = null
    get().interact()
  },
  juggleTouch: (y, flight, release, at) => set((s) => ({ juggle: { id: (s.juggle?.id ?? 0) + 1, y, flight, release, at } })),
  // Bicicleta: só no meio de uma embaixadinha (a bola já está no ar).
  bicycle: () => {
    const t = get().training
    if (!t?.juggle || t.bicycle) return
    set({ training: { ...t, bicycle: true, step: t.step + 1 } })
  },
  nearSeat: (seat) => set({ seatNear: seat }),
  standUp: () => set((s) => (s.sitting && s.sitting.phase !== 'up' ? { sitting: { ...s.sitting, phase: 'up' } } : s)),
  setSitPhase: (phase) => set((s) => (s.sitting ? { sitting: { ...s.sitting, phase } } : s)),
  // Terminou de levantar: volta a andar.
  finishSitting: () => set({ sitting: null }),
  // Golpe secreto: interrompe o golpe em andamento (mas não abre por cima de
  // painel ou tela).
  special: () => {
    const s = get()
    // A+B (ou Shift) no meio da embaixadinha: bicicleta, não o hurricane kick.
    if (s.training?.juggle) return s.bicycle()
    if (s.dizzy || s.training?.special || (!s.training && !isPlaying(s))) return
    if (performance.now() - lastSpinEnd > SPIN_GAP_MS) spins = 0
    const step = s.training ? s.training.step + 1 : randomStep()
    set({ training: { target: bagNearby(s), step, queued: false, special: true, ball: false, juggle: false } })
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
  kickBall: (dir, bicycle = false) => set((s) => ({ kick: { id: (s.kick?.id ?? 0) + 1, dir, bicycle } })),
  scoreGoal: (at) => set((s) => ({ goal: { id: (s.goal?.id ?? 0) + 1, at }, goals: s.goals + 1 })),
  finishTraining: () => set({ training: null }),
}))

/** O personagem só anda quando nenhuma tela, painel ou treino está em curso. */
export const isPlaying = (s: GameState) =>
  s.screen === 'play' && s.open === null && s.training === null && s.sitting === null && !s.fading
