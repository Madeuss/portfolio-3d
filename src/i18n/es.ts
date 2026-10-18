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
  hud: { help: 'Cómo jugar' },
  help: {
    title: '/Cómo jugar',
    keys: { move: 'caminar', run: 'correr', jump: 'saltar', interact: 'interactuar', zoom: 'zoom' },
    labels: { space: 'Espacio', wheel: 'Rueda' },
    close: 'Entendido',
  },
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
      prompt: 'Entrenar',
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
