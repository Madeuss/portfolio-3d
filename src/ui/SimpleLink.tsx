import { useI18n } from '../i18n'

// "Versão simples" (tarefa 6.5): leva ao madeusdev.com, que já tem todo o
// conteúdo em HTML (acessível, rápido e indexável). Serve para recrutador com
// pressa, leitor de tela, celular fraco e SEO, sem manter uma terceira versão.
export const SIMPLE_URL = 'https://madeusdev.com'

export default function SimpleLink({ className }: { className: string }) {
  const simple = useI18n((s) => s.t.simple)
  return (
    <a className={className} href={SIMPLE_URL} title={simple.title}>
      {simple.link} →
    </a>
  )
}
