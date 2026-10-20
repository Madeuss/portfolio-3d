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
  hud: { help: 'Como jogar', soundOn: 'Ligar som', soundOff: 'Desligar som' },
  help: {
    title: '/Como jogar',
    keys: { move: 'andar', run: 'correr', interact: 'interagir', zoom: 'zoom' },
    labels: { wheel: 'Rodinha' },
    close: 'Entendi',
  },
  soccer: { kick: 'Chutar', goal: 'GOL!', score: 'GOLS' },
  seat: 'Sentar',
  swing: 'Balançar',
  hammock: 'Deitar na rede',
  dog: 'Jogar a bolinha',
  door: { enter: 'Entrar na casa', exit: 'Sair' },
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
      prompt: 'Ver stack',
      train: 'Treinar',
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
    experience: {
      prompt: 'Ver experiência',
      label: '/Experiências',
      highlights: 'Conquistas',
      jobs: [
          {
            period: '05/2022 — atual',
            company: 'Luizalabs · Magalu Cloud',
            role: 'Senior Front-End / Fullstack',
            desc: 'Faço parte do time que constrói o console de clientes da nuvem pública, do front-end em React e Next.js ao BFF em Python e à configuração de plataforma.',
            highlights: [
              'Liderei a migração da plataforma para Next.js 16 e React 19 em um monorepo TypeScript de 7 pacotes, sem downtime para os clientes.',
              'Conduzi a migração de monorepo para polyrepo: micro-frontends viraram pacotes versionados em um registry npm privado, e cada time passou a lançar seu produto de forma independente.',
              'Construí o produto de IAM de ponta a ponta — membros, papéis, permissões, grupos e RBAC por projeto —, do front-end em React aos endpoints do BFF em FastAPI.',
              'Implantei um fluxo spec-first: specs OpenAPI geram clientes tipados compartilhados entre os produtos, acabando com tipos escritos à mão e divergência de contrato.',
              'Configuração de plataforma em múltiplas regiões: rotas no Kong API Gateway (400+ mudanças revisadas) e deploys no Kubernetes via ArgoCD.',
            ],
          },
          {
            period: '08/2024 — 02/2025',
            company: 'Jinboo',
            role: 'Front-End Developer · Contrato',
            desc: 'Contrato em paralelo: novas features nas aplicações web e mobile nativa do produto OBT, estabilização de bugs no front-end e correção de defeitos de API no back-end em Go.',
          },
          {
            period: '07/2020 — 05/2022',
            company: 'AutoSeg',
            role: 'Front-End Developer · Trainee → Júnior',
            desc: 'Landing pages e interfaces de produto do conceito à produção, refatoração de páginas legadas em JavaScript para componentes React e TypeScript, integração com o back-end em Ruby on Rails e os primeiros testes automatizados do código.',
          },
      ],
    },
    about: {
      prompt: 'Sobre mim',
      label: '/Sobre',
      title: 'Faço produtos complexos parecerem simples, do componente ao deploy.',
      paragraphs: [
        'Sou engenheiro front-end e fullstack, com mais de 6 anos de experiência. Nos últimos 4, faço parte do time que constrói o console de clientes de uma nuvem pública brasileira — máquinas virtuais, Kubernetes, storage, VPC, IAM e billing —, onde puxo decisões de arquitetura front-end: micro-frontends, pacotes publicados de forma independente e migrações de plataforma como Next.js 16 e React 19.',
        'Não paro no navegador: entrego BFFs em Python (FastAPI), fluxos de OAuth 2.0 e SSO, pipelines de CI/CD no GitLab e configuração de Kubernetes (ArgoCD) e Kong API Gateway em múltiplas regiões. Também escrevo ADRs e documentos técnicos, reviso código entre times e mentoro devs em testes e arquitetura front-end.',
      ],
      statsTitle: 'Em números',
      stats: ['6+ anos de experiência', '4+ anos em um console de nuvem pública', '1 interclasse vencida'],
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
