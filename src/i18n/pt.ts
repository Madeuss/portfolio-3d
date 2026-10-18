import type { Dictionary } from './types'

const pt: Dictionary = {
  meta: {
    htmlLang: 'pt-BR',
    title: 'Madeus 3D',
    description: 'Portfólio jogável de Mateus Souza, engenheiro front-end e fullstack em São Paulo.',
  },
  language: { label: 'Idioma' },
  loading: { role: 'Front-end · portfólio jogável', loading: 'Carregando', enter: 'Entrar' },
  simple: { link: 'Versão simples', title: 'Abrir o madeusdev.com, a versão em HTML do portfólio' },
  hud: { help: 'Como jogar' },
  help: {
    title: '/Como jogar',
    keys: { move: 'andar', run: 'correr', jump: 'pular', interact: 'interagir', zoom: 'zoom' },
    labels: { space: 'Espaço', wheel: 'Rodinha' },
    close: 'Entendi',
  },
  panel: { close: 'Fechar', escHint: 'Esc fecha', prev: 'anterior', next: 'próximo', site: 'Site' },
  stations: {
    projects: {
      prompt: 'Ver projetos',
      label: '/Projetos',
      items: [
        {
          name: 'Console de nuvem pública',
          year: '2022 — hoje',
          tag: 'Produto',
          desc: 'Faço parte do time que constrói o console de clientes, em micro-frontends com React e Next.js.',
        },
        {
          name: 'Firenze',
          year: '2026',
          tag: 'Jogo · IA',
          desc: 'Jogo de mistério investigativo com suspeitos movidos a LLM: casos gerados de forma determinística, um solver independente que garante que todo caso tem solução e isolamento de contexto como fronteira de arquitetura.',
        },
        {
          name: 'Covid-19 Tracker',
          year: '2020',
          tag: 'Web app',
          desc: 'App em React que mapeia a COVID-19 pelo mundo: casos confirmados, mortes e recuperados por país, num mapa interativo com Mapbox, consumindo uma API pública com Axios e Context API.',
        },
        {
          name: 'madeusdev.com',
          year: '2026',
          tag: 'Site · portfólio 2D',
          desc: 'Bola e controle arremessáveis com física própria, i18n em PT/EN/ES com dicionário tipado, cartas FUT com flip 3D e mídias que só carregam quando usadas. Física e i18n feitas à mão, sem bibliotecas.',
        },
      ],
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
