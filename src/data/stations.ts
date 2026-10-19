import type { Dictionary } from '../i18n'
import { contact, projects, stack } from './content'

export type StationId = 'projects' | 'skills' | 'about' | 'contact'

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

/**
 * Páginas do painel de cada estação, no idioma atual. Projetos tem uma página
 * por projeto (navegação ‹ ›); as outras estações têm uma página só.
 */
export function stationPages(id: StationId, t: Dictionary): PanelContent[] {
  switch (id) {
    case 'projects': {
      const s = t.stations.projects
      return s.items.map((item, i) => {
        const { image, github, site } = projects[i]
        const links: PanelLink[] = []
        if (site) links.push({ label: `${t.panel.site} ↗`, href: site, primary: true })
        if (github) links.push({ label: 'GitHub ↗', href: github })
        return {
          label: s.label,
          title: item.name,
          meta: `${item.year} · ${item.tag}`,
          desc: item.desc,
          image,
          links,
        }
      })
    }
    case 'skills': {
      const s = t.stations.skills
      return [
        {
          label: s.label,
          title: s.title,
          groups: stack.map((g) => ({ title: s.groups[g.id], items: g.items })),
        },
      ]
    }
    case 'about': {
      const s = t.stations.about
      return [{ label: s.label, title: s.title, desc: s.paragraphs.join('\n\n'), groups: [{ title: s.statsTitle, items: s.stats }] }]
    }
    case 'contact': {
      const s = t.stations.contact
      return [
        {
          label: s.label,
          title: s.title,
          desc: s.note,
          links: [
            { label: s.email, href: `mailto:${contact.email}`, primary: true },
            { label: 'LinkedIn ↗', href: contact.linkedin },
            { label: 'GitHub ↗', href: contact.github },
          ],
        },
      ]
    }
  }
}
