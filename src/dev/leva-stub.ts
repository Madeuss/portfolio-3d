// No build de produção o import 'leva' aponta para cá (vite.config.ts): o
// painel de ajustes nunca aparece no site, então não precisa ir no pacote.
// useControls devolve só os valores padrão de cada controle.

type Schema = Record<string, unknown>

const valueOf = (v: unknown) => (v && typeof v === 'object' && 'value' in v ? (v as { value: unknown }).value : v)

export function useControls(_folder: string, schema: Schema) {
  return Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, valueOf(v)]))
}

export function Leva() {
  return null
}
