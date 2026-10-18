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
  hud: { help: string }
  help: {
    title: string
    keys: { move: string; run: string; jump: string; interact: string; zoom: string }
    labels: { space: string; wheel: string }
    close: string
  }
  panel: { close: string; escHint: string; prev: string; next: string; site: string }
  stations: {
    projects: {
      prompt: string
      label: string
      /** Mesma ordem de `projects` em data/content.ts. */
      items: { name: string; year: string; tag: string; desc: string }[]
    }
    skills: { prompt: string; label: string; title: string; groups: Record<StackGroupId, string> }
    contact: { prompt: string; label: string; title: string; note: string; email: string }
  }
}
