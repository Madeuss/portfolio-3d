import { useSyncExternalStore } from 'react'

// Tela de toque (celular, tablet): o dedo é o ponteiro principal. Usamos isso,
// e não a largura da tela, porque um notebook com janela estreita ainda tem teclado.
const query = '(pointer: coarse)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export const isTouch = () => window.matchMedia(query).matches

export function useIsTouch() {
  return useSyncExternalStore(subscribe, isTouch, () => false)
}
