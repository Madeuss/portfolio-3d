import type { Dictionary } from './types'

const es: Dictionary = {
  meta: {
    htmlLang: 'es',
    title: 'Madeus 3D',
    description: 'Portafolio jugable de Mateus Souza, ingeniero front-end y fullstack en São Paulo, Brasil.',
  },
  language: { label: 'Idioma' },
  loading: { role: 'Front-end · portafolio jugable', loading: 'Cargando', enter: 'Entrar' },
  simple: { link: 'Versión simple', title: 'Abrir madeusdev.com, la versión en HTML del portafolio' },
  hud: { help: 'Cómo jugar', soundOn: 'Activar sonido', soundOff: 'Silenciar' },
  help: {
    title: '/Cómo jugar',
    keys: { move: 'caminar', run: 'correr', interact: 'interactuar', zoom: 'zoom' },
    labels: { wheel: 'Rueda' },
    close: 'Entendido',
  },
  soccer: { kick: 'Patear', goal: '¡GOL!', score: 'GOLES' },
  door: { enter: 'Entrar en la casa', exit: 'Salir' },
  panel: { close: 'Cerrar', escHint: 'Esc cierra', prev: 'anterior', next: 'siguiente', site: 'Sitio' },
  stations: {
    projects: {
      prompt: 'Ver proyectos',
      label: '/Proyectos',
      items: [
        {
          name: 'Consola de nube pública',
          year: '2022 — hoy',
          tag: 'Producto',
          desc: 'Formo parte del equipo que construye la consola de clientes, con micro-frontends en React y Next.js.',
        },
        {
          name: 'Firenze',
          year: '2026',
          tag: 'Juego · IA',
          desc: 'Juego de misterio investigativo con sospechosos impulsados por LLM: casos generados de forma determinista, un solver independiente que garantiza que todo caso tenga solución y aislamiento de contexto como frontera de arquitectura.',
        },
        {
          name: 'Covid-19 Tracker',
          year: '2020',
          tag: 'Web app',
          desc: 'App en React que mapea la COVID-19 en el mundo: casos confirmados, muertes y recuperados por país, en un mapa interactivo con Mapbox, consumiendo una API pública con Axios y Context API.',
        },
        {
          name: 'madeusdev.com',
          year: '2026',
          tag: 'Sitio web · portafolio 2D',
          desc: 'Balón y control arrojables con física propia, i18n en PT/EN/ES con diccionario tipado, cartas FUT con giro 3D y medios que solo cargan cuando se usan. Física e i18n hechas a mano, sin librerías.',
        },
      ],
    },
    skills: {
      prompt: 'Ver stack',
      train: 'Entrenar',
      label: '/Skills',
      title: 'Stack',
      groups: {
        frontend: 'Front-end',
        backend: 'Back-end & APIs',
        testing: 'Pruebas',
        infra: 'Infra & DevOps',
        observability: 'Observabilidad',
      },
    },
    experience: {
      prompt: 'Ver experiencia',
      label: '/Experiencia',
      highlights: 'Logros',
      jobs: [
          {
            period: '05/2022 — actualidad',
            company: 'Luizalabs · Magalu Cloud',
            role: 'Senior Front-End / Fullstack',
            desc: 'Formo parte del equipo que construye la consola de clientes de la nube pública, del front-end en React y Next.js al BFF en Python y la configuración de plataforma.',
            highlights: [
              'Lideré la migración de la plataforma a Next.js 16 y React 19 en un monorepo TypeScript de 7 paquetes, sin downtime para los clientes.',
              'Impulsé la migración de monorepo a polyrepo: los micro-frontends pasaron a ser paquetes versionados en un registry npm privado, y cada equipo lanza su producto de forma independiente.',
              'Construí el producto de IAM de punta a punta — miembros, roles, permisos, grupos y RBAC por proyecto —, del front-end en React a los endpoints del BFF en FastAPI.',
              'Implanté un flujo spec-first: las specs OpenAPI generan clientes tipados compartidos entre productos, eliminando tipos escritos a mano y divergencias de contrato.',
              'Configuración de plataforma en múltiples regiones: rutas en Kong API Gateway (400+ cambios revisados) y deploys en Kubernetes vía ArgoCD.',
            ],
          },
          {
            period: '08/2024 — 02/2025',
            company: 'Jinboo',
            role: 'Front-End Developer · Contrato',
            desc: 'Contrato en paralelo: nuevas features en las aplicaciones web y mobile nativa del producto OBT, estabilización de bugs en el front-end y corrección de defectos de API en el back-end en Go.',
          },
          {
            period: '07/2020 — 05/2022',
            company: 'AutoSeg',
            role: 'Front-End Developer · Trainee → Junior',
            desc: 'Landing pages e interfaces de producto del concepto a producción, refactorización de páginas legadas en JavaScript a componentes React y TypeScript, integración con el back-end en Ruby on Rails y los primeros tests automatizados del código.',
          },
      ],
    },
    about: {
      prompt: 'Sobre mí',
      label: '/Sobre mí',
      title: 'Hago que productos complejos parezcan simples, del componente al deploy.',
      paragraphs: [
        'Soy ingeniero front-end y fullstack, con más de 6 años de experiencia. En los últimos 4, formo parte del equipo que construye la consola de clientes de una nube pública brasileña — máquinas virtuales, Kubernetes, storage, VPC, IAM y billing —, donde impulso decisiones de arquitectura front-end: micro-frontends, paquetes publicados de forma independiente y migraciones de plataforma como Next.js 16 y React 19.',
        'No me quedo en el navegador: entrego BFFs en Python (FastAPI), flujos de OAuth 2.0 y SSO, pipelines de CI/CD en GitLab y configuración de Kubernetes (ArgoCD) y Kong API Gateway en múltiples regiones. También escribo ADRs y documentos técnicos, reviso código entre equipos y mentoreo a desarrolladores en testing y arquitectura front-end.',
      ],
      statsTitle: 'En números',
      stats: ['6+ años de experiencia', '4+ años en una consola de nube pública', '1 torneo interclases ganado'],
    },
    contact: {
      prompt: 'Abrir buzón',
      label: '/Contacto',
      title: '¿Construimos algo juntos?',
      note: 'Abierto a nuevas vacantes y proyectos freelance.',
      email: 'Envíame un e-mail',
    },
  },
}

export default es
