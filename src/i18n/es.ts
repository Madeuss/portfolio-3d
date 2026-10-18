import type { Dictionary } from './types'

const es: Dictionary = {
  meta: {
    htmlLang: 'es',
    title: 'Madeus 3D',
    description: 'Portafolio jugable de Mateus Souza, ingeniero front-end y fullstack en São Paulo, Brasil.',
  },
  language: { label: 'Idioma' },
  loading: { role: 'Front-end · portafolio jugable', loading: 'Cargando', enter: 'Entrar' },
  hud: { help: 'Cómo jugar' },
  help: {
    title: '/Cómo jugar',
    keys: { move: 'caminar', run: 'correr', jump: 'saltar', interact: 'interactuar', zoom: 'zoom' },
    labels: { space: 'Espacio', wheel: 'Rueda' },
    close: 'Entendido',
  },
  panel: { close: 'Cerrar', escHint: 'Esc cierra' },
  stations: {
    projects: {
      prompt: 'Ver proyectos',
      label: '/Proyectos',
      firenze: {
        tag: 'Juego · IA',
        desc: 'Juego de misterio investigativo con sospechosos impulsados por LLM: casos generados de forma determinista, un solver independiente que garantiza que todo caso tenga solución y aislamiento de contexto como frontera de arquitectura.',
      },
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
