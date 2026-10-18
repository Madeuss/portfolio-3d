import type { Dictionary } from '../i18n'
import { contact, firenze, stack } from './content'

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

/** Texto do aviso que aparece ao chegar perto da estação: "E  <prompt>". */
export const stationPrompt = (id: StationId, t: Dictionary) => t.stations[id].prompt

/** Conteúdo do painel de cada estação, no idioma atual. */
export function stationPanel(id: StationId, t: Dictionary): PanelContent {
  switch (id) {
    case 'projects': {
      const s = t.stations.projects
      return {
        label: s.label,
        title: firenze.name,
        meta: `${firenze.year} · ${s.firenze.tag}`,
        desc: s.firenze.desc,
        image: firenze.image,
        links: [{ label: 'GitHub ↗', href: firenze.github }],
      }
    }
    case 'skills': {
      const s = t.stations.skills
      return {
        label: s.label,
        title: s.title,
        groups: stack.map((g) => ({ title: s.groups[g.id], items: g.items })),
      }
    }
    case 'contact': {
      const s = t.stations.contact
      return {
        label: s.label,
        title: s.title,
        desc: s.note,
        links: [
          { label: s.email, href: `mailto:${contact.email}`, primary: true },
          { label: 'LinkedIn ↗', href: contact.linkedin },
          { label: 'GitHub ↗', href: contact.github },
        ],
      }
    }
  }
}
