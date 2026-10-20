import type { Dictionary } from '../i18n'
import { contact, projects, stack } from './content'

// As experiências são três estações, uma por armário (na ordem de `jobs`).
export const EXPERIENCES = ['exp-magalu', 'exp-jinboo', 'exp-autoseg'] as const
export type ExperienceId = (typeof EXPERIENCES)[number]

export type StationId = 'projects' | 'skills' | 'about' | 'contact' | ExperienceId

const isExperience = (id: StationId): id is ExperienceId => id.startsWith('exp-')

export type PanelLink = { label: string; href: string; primary?: boolean }

export type PanelContent = {
  label: string
  title: string
  meta?: string
  desc?: string
  image?: string
  groups?: { title: string; items: string[] }[]
  /** Lista com marcadores (frases longas, como as conquistas). */
  list?: { title: string; items: string[] }
  links?: PanelLink[]
}

/** Texto do aviso que aparece ao chegar perto da estação: "E  <prompt>". */
export const stationPrompt = (id: StationId | 'bag', t: Dictionary) =>
  id === 'bag' ? t.stations.skills.train : isExperience(id) ? t.stations.experience.prompt : t.stations[id].prompt

/**
 * Páginas do painel de cada estação, no idioma atual. Projetos tem uma página
 * por projeto (navegação ‹ ›); as outras estações têm uma página só.
 */
export function stationPages(id: StationId, t: Dictionary): PanelContent[] {
  if (isExperience(id)) {
    const s = t.stations.experience
    const job = s.jobs[EXPERIENCES.indexOf(id)]
    return [
      {
        label: s.label,
        title: job.company,
        meta: `${job.role} · ${job.period}`,
        desc: job.desc,
        list: job.highlights ? { title: s.highlights, items: job.highlights } : undefined,
      },
    ]
  }
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
