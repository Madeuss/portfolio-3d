export const LOCALES = ['pt', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

export type StackGroupId = 'frontend' | 'backend' | 'testing' | 'infra' | 'observability'

/**
 * Todo o texto do site, por idioma (mesmo esquema do madeusdev). Dados sem
 * idioma (links, imagens, nomes de tecnologias) ficam em data/content.ts.
 */
export type Dictionary = {
  meta: { htmlLang: string; title: string; description: string }
  language: { label: string }
  loading: { role: string; loading: string; enter: string }
  /** Link para o madeusdev.com, que é a versão em HTML de tudo (tarefa 6.5). */
  simple: { link: string; title: string }
  hud: { help: string; soundOn: string; soundOff: string }
  help: {
    title: string
    keys: { move: string; run: string; interact: string; zoom: string }
    labels: { wheel: string }
    close: string
  }
  /** Porta da casa: o aviso de fora e o de dentro. */
  door: { enter: string; exit: string }
  panel: { close: string; escHint: string; prev: string; next: string; site: string }
  stations: {
    projects: {
      prompt: string
      label: string
      /** Mesma ordem de `projects` em data/content.ts. */
      items: { name: string; year: string; tag: string; desc: string }[]
    }
    skills: { prompt: string; label: string; title: string; groups: Record<StackGroupId, string> }
    /** Textos do Sobre do madeusdev; `stats` já com número e rótulo juntos. */
    about: { prompt: string; label: string; title: string; paragraphs: string[]; statsTitle: string; stats: string[] }
    contact: { prompt: string; label: string; title: string; note: string; email: string }
  }
}
