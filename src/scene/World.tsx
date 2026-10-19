import { Environment, Stats } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useControls } from 'leva'
import { useGame } from '../state/game'
import Exterior, { EXTERIOR_DOOR_SPAWN, EXTERIOR_SPAWN } from './Exterior'
import Interior, { INTERIOR_SPAWN } from './Interior'
import Player from './Player'

// O mundo: luz de ambiente (HDRI), sombras, a cena atual (terreno ou
// interior da casa, state/game.ts) e o personagem controlável.
// Os valores do painel Leva (canto superior direito, só em dev) servem para
// experimentar; quando acharmos um bom ajuste, ele vira o valor padrão aqui.

const HDRI = '/hdri/kloofendal_48d_partly_cloudy_puresky_1k.hdr'

function Lights() {
  const { sunPosition, sunIntensity, ambient, envIntensity, showSky } = useControls('Luz', {
    sunPosition: { value: [8, 16, 6], label: 'sol (x, y, z)' },
    sunIntensity: { value: 2, min: 0, max: 6, step: 0.1, label: 'força do sol' },
    ambient: { value: 0.3, min: 0, max: 2, step: 0.05, label: 'luz ambiente' },
    envIntensity: { value: 0.6, min: 0, max: 2, step: 0.05, label: 'reflexo do HDRI' },
    showSky: { value: false, label: 'HDRI de fundo' },
  })

  return (
    <>
      {/* HDRI = foto 360° do céu que ilumina e dá reflexo aos materiais.
          `background` liga a foto como fundo; desligado, fica a cor do Canvas. */}
      <Environment files={HDRI} background={showSky} environmentIntensity={envIntensity} />

      {/* Luz uniforme que clareia tudo, inclusive o lado sem sol. */}
      <ambientLight intensity={ambient} />

      {/* O "sol": luz paralela que gera as sombras. A sombra é calculada dentro
          de uma caixa (shadow-camera-*); objetos fora dela não fazem sombra. */}
      <directionalLight
        position={sunPosition as [number, number, number]}
        intensity={sunIntensity}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-bias={-0.0005}
      />
    </>
  )
}

export default function World() {
  const { debug } = useControls('Física', { debug: { value: false, label: 'ver colliders' } })
  // Medidor de FPS (tarefa 7.4), só no painel do dev. Meta: 60 no desktop, 30+ no celular.
  const { stats } = useControls('Desempenho', { stats: { value: false, label: 'medidor de FPS' } })
  const scene = useGame((s) => s.scene)
  const spawn = useGame((s) => s.spawn)
  const at = scene === 'interior' ? INTERIOR_SPAWN : spawn === 'door' ? EXTERIOR_DOOR_SPAWN : EXTERIOR_SPAWN

  return (
    <>
      {stats && <Stats />}
      <Lights />

      {/* Tudo que colide fica dentro de <Physics>. `debug` desenha as formas
          de colisão em linhas, que é o que a física "enxerga". A `key` recria
          a física ao trocar de cena: o personagem renasce na entrada da nova. */}
      <Physics key={scene} debug={debug}>
        {scene === 'exterior' ? <Exterior /> : <Interior />}
        <Player position={at} />
      </Physics>
    </>
  )
}
