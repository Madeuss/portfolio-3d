import { Howl, Howler } from 'howler'
import { create } from 'zustand'

// Sons (tarefa 7.2), com Howler.js. Efeitos da Kenney (CC0), em public/sounds.
// Os navegadores só tocam áudio depois de um gesto do visitante: por isso
// nada toca antes do clique em "Entrar", e os arquivos só são criados aqui
// na primeira vez que alguém pede para tocar.

const SFX = {
  enter: { src: '/sounds/enter.mp3', volume: 0.5 },
  // Abrir e fechar painéis (projetos, sobre, contato...): Kenney UI Audio, click3.
  'panel-open': { src: '/sounds/panel-click.mp3', volume: 0.5 },
  'panel-close': { src: '/sounds/panel-click.mp3', volume: 0.4 },
  prompt: { src: '/sounds/prompt-drop.mp3', volume: 0.35 },
  click: { src: '/sounds/click.mp3', volume: 0.4 },
  // Trocar de página num painel (‹ anterior / próximo ›): Kenney Interface Sounds, click_001.
  page: { src: '/sounds/page-turn.mp3', volume: 0.5 },
  // Porta da casa (Kenney RPG Audio, doorOpen_1 e doorClose_1).
  'door-open': { src: '/sounds/door-open.mp3', volume: 0.1 },
  'door-close': { src: '/sounds/door-close.mp3', volume: 0.1 },
  // Campinho (Pixabay, sem exigir crédito): chute no passe, toque mais leve
  // na embaixadinha e, no gol, a bola na rede seguida do apito do juiz.
  kick: { src: '/sounds/ball-kick.mp3', volume: 0.6 },
  juggle: { src: '/sounds/ball-juggle.mp3', volume: 0.5 },
  'goal-net': { src: '/sounds/goal-net-2.mp3', volume: 0.35 },
  'goal-whistle': { src: '/sounds/goal-whistle.mp3', volume: 0.12 },
} as const

export type SfxName = keyof typeof SFX

// Música de fundo: "Relaxing Birds and Piano Music", de Innertune (Pixabay,
// sem exigir crédito). A faixa original tem 37 min: aqui vão 3 min recortados
// com o fim misturado no começo, para o loop emendar sem corte. Baixa só
// depois do "Entrar" (não pesa no carregamento) e obedece o botão de mudo.
const MUSIC_URL: string | null = '/sounds/music-birds-piano.mp3'
const MUSIC_VOLUME = 0.22

const cache = new Map<string, Howl>()

function howl(src: string, volume: number) {
  let h = cache.get(src)
  if (!h) {
    h = new Howl({ src: [src], volume })
    cache.set(src, h)
  }
  return h
}

export function play(name: SfxName) {
  const { src, volume } = SFX[name]
  howl(src, volume).play()
}

// Soco no saco: 4 variações (Kenney Impact Sounds, impactPunch_heavy).
const PUNCHES = [0, 1, 2, 3].map((i) => `/sounds/punch-${i}.mp3`)

// Latido do shih tzu (Pixabay, só o primeiro dos três latidos do arquivo), com
// o tom variando um pouco a cada vez.
export function playBark() {
  const h = howl('/sounds/dog-bark.mp3', 0.35)
  const id = h.play()
  h.rate(0.92 + Math.random() * 0.16, id)
}

export function playPunch() {
  const src = PUNCHES[Math.floor(Math.random() * PUNCHES.length)]
  const h = howl(src, 0.5)
  const id = h.play()
  h.rate(0.9 + Math.random() * 0.2, id)
}

let music: Howl | null = null

export function startMusic() {
  if (!MUSIC_URL || music) return
  music = new Howl({ src: [MUSIC_URL], loop: true, volume: 0 })
  music.play()
  music.fade(0, MUSIC_VOLUME, 2000)
}

// ---- Mudo (botão de som do HUD) ----------------------------------------

const MUTED_KEY = 'muted'

function savedMuted() {
  try {
    return localStorage.getItem(MUTED_KEY) === '1'
  } catch {
    return false
  }
}

type AudioState = { muted: boolean; toggleMuted: () => void }

// Começa com som (como o worawork); a escolha de silenciar fica salva.
export const useAudio = create<AudioState>((set, get) => {
  const muted = savedMuted()
  Howler.mute(muted)
  return {
    muted,
    toggleMuted: () => {
      const next = !get().muted
      Howler.mute(next)
      set({ muted: next })
      if (!next) play('panel-open') // o mesmo clique de abrir os painéis
      try {
        localStorage.setItem(MUTED_KEY, next ? '1' : '0')
      } catch {
        // sem storage, vale só nesta visita
      }
    },
  }
})
