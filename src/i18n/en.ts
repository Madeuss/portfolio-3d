import type { Dictionary } from './types'

const en: Dictionary = {
  meta: {
    htmlLang: 'en',
    title: 'Madeus 3D',
    description: 'Playable portfolio of Mateus Souza, front-end and fullstack engineer based in São Paulo, Brazil.',
  },
  language: { label: 'Language' },
  loading: { role: 'Front-end · playable portfolio', loading: 'Loading', enter: 'Enter' },
  hud: { help: 'How to play' },
  help: {
    title: '/How to play',
    keys: { move: 'move', run: 'run', jump: 'jump', interact: 'interact', zoom: 'zoom' },
    labels: { space: 'Space', wheel: 'Scroll' },
    close: 'Got it',
  },
  panel: { close: 'Close', escHint: 'Esc closes' },
  stations: {
    projects: {
      prompt: 'See projects',
      label: '/Projects',
      firenze: {
        tag: 'Game · AI',
        desc: 'Investigative mystery game with LLM-driven suspects: deterministic case generation, an independent solver that guarantees every case is solvable, and context isolation as an architectural boundary.',
      },
    },
    skills: {
      prompt: 'Train',
      label: '/Skills',
      title: 'Stack',
      groups: {
        frontend: 'Front-end',
        backend: 'Back-end & APIs',
        testing: 'Testing',
        infra: 'Infra & DevOps',
        observability: 'Observability',
      },
    },
    contact: {
      prompt: 'Check the mail',
      label: '/Contact',
      title: "Let's build something together?",
      note: 'Open to new roles and freelance projects.',
      email: 'Send me an email',
    },
  },
}

export default en
