import type { StackGroupId } from '../i18n/types'

// Dados sem idioma, vindos do madeusdev (portfolio-mateus/src/data/content.ts).
// O texto traduzível fica nos dicionários em src/i18n.

export const contact = {
  email: 'mateus1two3@gmail.com',
  linkedin: 'https://linkedin.com/in/mateusdevsouza',
  github: 'https://github.com/madeuss',
}

export const firenze = {
  name: 'Firenze',
  year: '2026',
  image: '/images/firenze.webp',
  github: 'https://github.com/Madeuss/firenze',
}

export const stack: { id: StackGroupId; items: string[] }[] = [
  {
    id: 'frontend',
    items: ['React', 'Next.js', 'TypeScript', 'Micro-frontends', 'Astro', 'Context API', 'Tailwind CSS', 'Storybook', 'Design Systems', 'Accessibility (WCAG)'],
  },
  { id: 'backend', items: ['Python', 'FastAPI', 'Node.js', 'OpenAPI (spec-first)', 'BFF', 'OAuth 2.0 / OIDC', 'Redis'] },
  { id: 'testing', items: ['Vitest', 'Jest', 'Testing Library', 'Playwright', 'Cypress', 'MSW'] },
  { id: 'infra', items: ['GitLab CI/CD', 'Docker', 'Kubernetes', 'ArgoCD', 'Kong API Gateway'] },
  { id: 'observability', items: ['OpenSearch', 'Sentry', 'Prometheus', 'PostHog'] },
]
