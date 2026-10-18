import { useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import TestScene from './scene/TestScene'
import Panel, { type PanelContent } from './ui/Panel'

// Conteúdo provisório, copiado do madeusdev (pt.ts). Na fase 6 isso passa a
// vir dos dicionários PT/EN/ES.
const FIRENZE: PanelContent = {
  label: '/Projetos',
  title: 'Firenze',
  meta: '2026 · Jogo · IA',
  desc: 'Jogo de mistério investigativo com suspeitos movidos a LLM: casos gerados de forma determinística, um solver independente que garante que todo caso tem solução e isolamento de contexto como fronteira de arquitetura.',
  image: '/images/firenze.webp',
  href: 'https://github.com/Madeuss/firenze',
}

export default function App() {
  const [panel, setPanel] = useState<PanelContent | null>(null)
  const closePanel = useCallback(() => setPanel(null), [])

  return (
    <>
      {/* Painel de ajustes: só aparece em dev (yarn dev), nunca no site publicado. */}
      <Leva hidden={!import.meta.env.DEV} collapsed={false} />

      {/* `shadows` liga o cálculo de sombras no renderizador. A câmera fica
          alta e inclinada, próxima do ângulo que o jogo vai usar. */}
      <Canvas shadows camera={{ position: [5, 6, 7], fov: 40 }}>
        <color attach="background" args={['#FAFAF7']} />
        <TestScene onOpenProject={() => setPanel(FIRENZE)} />
      </Canvas>

      <Panel content={panel} onClose={closePanel} />
    </>
  )
}
