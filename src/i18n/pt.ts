import type { Dictionary } from './types'

const pt: Dictionary = {
  meta: {
    htmlLang: 'pt-BR',
    title: 'Madeus 3D',
    description: 'Portfólio jogável de Mateus Souza, engenheiro front-end e fullstack em São Paulo.',
  },
  language: { label: 'Idioma' },
  loading: { role: 'Front-end · portfólio jogável', loading: 'Carregando', enter: 'Entrar' },
  hud: { help: 'Como jogar' },
  help: {
    title: '/Como jogar',
    keys: { move: 'andar', run: 'correr', jump: 'pular', interact: 'interagir', zoom: 'zoom' },
    labels: { space: 'Espaço', wheel: 'Rodinha' },
    close: 'Entendi',
  },
  panel: { close: 'Fechar', escHint: 'Esc fecha' },
  stations: {
    projects: {
      prompt: 'Ver projetos',
      label: '/Projetos',
      firenze: {
        tag: 'Jogo · IA',
        desc: 'Jogo de mistério investigativo com suspeitos movidos a LLM: casos gerados de forma determinística, um solver independente que garante que todo caso tem solução e isolamento de contexto como fronteira de arquitetura.',
      },
    },
    skills: {
      prompt: 'Treinar',
      label: '/Skills',
      title: 'Stack',
      groups: {
        frontend: 'Front-end',
        backend: 'Back-end & APIs',
        testing: 'Testes',
        infra: 'Infra & DevOps',
        observability: 'Observabilidade',
      },
    },
    contact: {
      prompt: 'Abrir correio',
      label: '/Contato',
      title: 'Bora construir algo juntos?',
      note: 'Aberto a novas vagas e projetos freelance.',
      email: 'Mande um e-mail',
    },
  },
}

export default pt
