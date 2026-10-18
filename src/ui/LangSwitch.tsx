import { play } from '../audio/sounds'
import { LOCALES, useI18n } from '../i18n'

// Seletor de idioma com siglas (não bandeiras), igual ao madeusdev.
export default function LangSwitch() {
  const locale = useI18n((s) => s.locale)
  const setLocale = useI18n((s) => s.setLocale)
  const label = useI18n((s) => s.t.language.label)

  return (
    <div className="lang" role="group" aria-label={label}>
      {LOCALES.map((l) => (
        <button key={l} type="button" aria-pressed={l === locale} onClick={() => (setLocale(l), play('click'))}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
