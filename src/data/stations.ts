// Conteúdo das estações. Provisório, copiado do madeusdev (src/i18n/pt.ts e
// src/data/content.ts); na fase 6 passa a vir dos dicionários PT/EN/ES.

export type StationId = 'projects' | 'skills' | 'contact'

export type PanelLink = { label: string; href: string; primary?: boolean }

export type PanelContent = {
  label: string
  title: string
  meta?: string
  desc?: string
  image?: string
  groups?: { title: string; items: string[] }[]
  links?: PanelLink[]
}

export type Station = {
  /** Texto do aviso que aparece ao chegar perto: "E  <prompt>". */
  prompt: string
  panel: PanelContent
}

export const stations: Record<StationId, Station> = {
  projects: {
    prompt: 'Ver projetos',
    panel: {
      label: '/Projetos',
      title: 'Firenze',
      meta: '2026 · Jogo · IA',
      desc: 'Jogo de mistério investigativo com suspeitos movidos a LLM: casos gerados de forma determinística, um solver independente que garante que todo caso tem solução e isolamento de contexto como fronteira de arquitetura.',
      image: '/images/firenze.webp',
      links: [{ label: 'GitHub ↗', href: 'https://github.com/Madeuss/firenze' }],
    },
  },
  skills: {
    prompt: 'Treinar',
    panel: {
      label: '/Skills',
      title: 'Stack',
      groups: [
        {
          title: 'Front-end',
          items: ['React', 'Next.js', 'TypeScript', 'Micro-frontends', 'Astro', 'Context API', 'Tailwind CSS', 'Storybook', 'Design Systems', 'Accessibility (WCAG)'],
        },
        { title: 'Back-end & APIs', items: ['Python', 'FastAPI', 'Node.js', 'OpenAPI (spec-first)', 'BFF', 'OAuth 2.0 / OIDC', 'Redis'] },
        { title: 'Testes', items: ['Vitest', 'Jest', 'Testing Library', 'Playwright', 'Cypress', 'MSW'] },
        { title: 'Infra & DevOps', items: ['GitLab CI/CD', 'Docker', 'Kubernetes', 'ArgoCD', 'Kong API Gateway'] },
        { title: 'Observabilidade', items: ['OpenSearch', 'Sentry', 'Prometheus', 'PostHog'] },
      ],
    },
  },
  contact: {
    prompt: 'Abrir correio',
    panel: {
      label: '/Contato',
      title: 'Bora construir algo juntos?',
      desc: 'Aberto a novas vagas e projetos freelance.',
      links: [
        { label: 'Mande um e-mail', href: 'mailto:mateus1two3@gmail.com', primary: true },
        { label: 'LinkedIn ↗', href: 'https://linkedin.com/in/mateusdevsouza' },
        { label: 'GitHub ↗', href: 'https://github.com/madeuss' },
      ],
    },
  },
}
