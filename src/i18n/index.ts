import { useEffect } from 'react'
import { create } from 'zustand'
import { LOCALES, type Dictionary, type Locale } from './types'
import pt from './pt'
import en from './en'
import es from './es'

export { LOCALES, type Locale, type Dictionary } from './types'

const DICTIONARIES: Record<Locale, Dictionary> = { pt, en, es }
const STORAGE_KEY = 'lang'

/** Escolha salva > idioma do navegador > inglês (mesma regra do madeusdev). */
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as Locale
  } catch {
    // storage bloqueado: segue para o navegador
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.slice(0, 2).toLowerCase()
    if ((LOCALES as readonly string[]).includes(base)) return base as Locale
  }
  return 'en'
}

type I18n = { locale: Locale; t: Dictionary; setLocale: (l: Locale) => void }

// No madeusdev isto é um Context; aqui é uma store (zustand) porque o texto
// também é lido dentro do Canvas e em useFrame, fora da árvore do React DOM.
const start = initialLocale()

export const useI18n = create<I18n>((set) => ({
  locale: start,
  t: DICTIONARIES[start],
  setLocale: (locale) => {
    set({ locale, t: DICTIONARIES[locale] })
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // sem storage, a escolha vale só nesta visita
    }
  },
}))

/** <html lang>, título da aba e description acompanham o idioma. */
export function useDocumentLocale() {
  const t = useI18n((s) => s.t)
  useEffect(() => {
    document.documentElement.lang = t.meta.htmlLang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
  }, [t])
}
