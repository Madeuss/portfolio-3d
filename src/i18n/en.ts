import type { Dictionary } from './types'

const en: Dictionary = {
  meta: {
    htmlLang: 'en',
    title: 'Madeus 3D',
    description: 'Playable portfolio of Mateus Souza, front-end and fullstack engineer based in São Paulo, Brazil.',
  },
  language: { label: 'Language' },
  loading: { role: 'Front-end · playable portfolio', loading: 'Loading', enter: 'Enter' },
  simple: { link: 'Simple version', title: 'Open madeusdev.com, the HTML version of this portfolio' },
  hud: { help: 'How to play', soundOn: 'Turn sound on', soundOff: 'Turn sound off' },
  help: {
    title: '/How to play',
    keys: { move: 'move', run: 'run', interact: 'interact', zoom: 'zoom' },
    labels: { wheel: 'Scroll' },
    close: 'Got it',
  },
  soccer: { kick: 'Kick', goal: 'GOAL!', score: 'GOALS' },
  seat: 'Sit',
  swing: 'Swing',
  hammock: 'Lie in the hammock',
  dog: 'Throw the ball',
  door: { enter: 'Go inside', exit: 'Go outside' },
  panel: { close: 'Close', escHint: 'Esc closes', prev: 'previous', next: 'next', site: 'Website' },
  stations: {
    projects: {
      prompt: 'See projects',
      label: '/Projects',
      items: [
        {
          name: 'Public cloud console',
          year: '2022 — present',
          tag: 'Product',
          desc: 'Part of the team building the customer console, with micro-frontends in React and Next.js.',
        },
        {
          name: 'Firenze',
          year: '2026',
          tag: 'Game · AI',
          desc: 'Investigative mystery game with LLM-driven suspects: deterministic case generation, an independent solver that guarantees every case is solvable, and context isolation as an architectural boundary.',
        },
        {
          name: 'Covid-19 Tracker',
          year: '2020',
          tag: 'Web app',
          desc: 'React app that maps COVID-19 around the world: confirmed cases, deaths and recoveries by country on an interactive Mapbox map, consuming a public API with Axios and the Context API.',
        },
        {
          name: 'madeusdev.com',
          year: '2026',
          tag: 'Website · 2D portfolio',
          desc: 'Throwable ball and controller with hand-rolled physics, PT/EN/ES i18n with a typed dictionary, FUT cards with a 3D flip and media that only loads when used. Physics and i18n built from scratch, no libraries.',
        },
      ],
    },
    skills: {
      prompt: 'See stack',
      train: 'Train',
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
    experience: {
      prompt: 'See experience',
      label: '/Experience',
      highlights: 'Highlights',
      jobs: [
          {
            period: '05/2022 — present',
            company: 'Luizalabs · Magalu Cloud',
            role: 'Senior Front-End / Fullstack',
            desc: "Part of the team building the public cloud's customer console, from the React and Next.js front-end to the Python BFF and platform configuration.",
            highlights: [
              'Led the platform-wide migration to Next.js 16 and React 19 across a 7-package TypeScript monorepo, with no customer-facing downtime.',
              'Drove the monorepo-to-polyrepo migration: micro-frontends became versioned packages on a private npm registry, so each team ships its product independently.',
              'Built the IAM product end to end — members, roles, permissions, groups and project-scoped RBAC — from the React front-end to the FastAPI BFF endpoints.',
              'Set up a spec-first API workflow: OpenAPI specs generate typed clients shared across products, removing hand-written types and contract drift.',
              'Platform configuration across multiple regions: Kong API Gateway routing (400+ reviewed changes) and Kubernetes deploys via ArgoCD.',
            ],
          },
          {
            period: '08/2024 — 02/2025',
            company: 'Jinboo',
            role: 'Front-End Developer · Contract',
            desc: 'Contract: new features across the web and native mobile apps of the OBT product, front-end bug fixing and API defect fixes in the Go back-end.',
          },
          {
            period: '07/2020 — 05/2022',
            company: 'AutoSeg',
            role: 'Front-End Developer · Trainee → Junior',
            desc: 'Landing pages and product interfaces from concept to production, refactoring legacy JavaScript pages into React and TypeScript components, integrating with the Ruby on Rails back-end and introducing the first automated tests.',
          },
      ],
    },
    about: {
      prompt: 'About me',
      label: '/About',
      title: 'I make complex products feel simple, from component to deploy.',
      paragraphs: [
        "I'm a front-end and fullstack engineer with 6+ years of experience. For the last 4, I've been part of the team building the customer console of a Brazilian public cloud — virtual machines, Kubernetes, storage, VPC, IAM and billing — where I drive front-end architecture decisions: micro-frontends, independently published packages and platform migrations like Next.js 16 and React 19.",
        "I don't stop at the browser: I ship Python (FastAPI) BFFs, OAuth 2.0 and SSO flows, GitLab CI/CD pipelines and Kubernetes (ArgoCD) and Kong API Gateway configuration across multiple regions. I also write ADRs and design docs, review code across teams and mentor developers on testing and front-end architecture.",
      ],
      statsTitle: 'By the numbers',
      stats: ['6+ years of experience', '4+ years on a public cloud console', '1 school football tournament won'],
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
