import { Environment, Stats } from '@react-three/drei'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { useControls } from 'leva'
import Office from './Office'
import PunchingBag from './PunchingBag'
import Station from './Station'
import BagSwing from './BagSwing'
import BagStand, { HOOK_HEIGHT } from './BagStand'
import Locker from './Locker'
import Prop from './Prop'
import Player from './Player'

// Cena de teste (tarefas 1.4 e 2.2–2.5): chão, caixas com física, luz de
// ambiente (HDRI), sombras e o personagem controlável.
// Os valores do painel Leva (canto superior direito, só em dev) servem para
// experimentar; quando acharmos um bom ajuste, ele vira o valor padrão aqui.

const HDRI = '/hdri/kloofendal_48d_partly_cloudy_puresky_1k.hdr'

function Lights() {
  const { sunPosition, sunIntensity, ambient, envIntensity, showSky } = useControls('Luz', {
    sunPosition: { value: [4, 8, 3], label: 'sol (x, y, z)' },
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
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />
    </>
  )
}

function Floor() {
  const { color } = useControls('Chão', { color: { value: '#afcbc0', label: 'cor' } })

  // Corpo "fixed": participa das colisões mas nunca se move. O collider é uma
  // caixa fina (meias-medidas: 20 x 0,1 x 20 = chão de 40 x 40 m) logo abaixo do plano.
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[20, 0.1, 20]} position={[0, -0.1, 0]} />
      {/* O plano nasce em pé (eixo XY); girar -90° em X deita ele no chão. */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}

type BoxProps = { position: [number, number, number]; size?: number; color: string }

// Caixa "dynamic" (tarefa 2.2): a física controla a posição. Ela nasce no ar,
// cai, bate no chão e pode ser empurrada pelo personagem.
function Box({ position, size = 1, color }: BoxProps) {
  return (
    <RigidBody position={position} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </RigidBody>
  )
}

export default function TestScene() {
  const { debug } = useControls('Física', { debug: { value: false, label: 'ver colliders' } })
  // Medidor de FPS (tarefa 7.4), só no painel do dev. Meta: 60 no desktop, 30+ no celular.
  const { stats } = useControls('Desempenho', { stats: { value: false, label: 'medidor de FPS' } })

  return (
    <>
      {stats && <Stats />}
      <Lights />

      {/* Tudo que colide fica dentro de <Physics>. `debug` desenha as formas
          de colisão em linhas, que é o que a física "enxerga". */}
      <Physics debug={debug}>
        <Floor />
        {/* Estações (tarefa 2.6): objeto + zona invisível. A mesa tem
            ~1,5 x 1,1 m, então a zona cobre ela e um pouco da frente. */}
        <Station id="projects" position={[-3.2, 0, -2]} zoneCenter={[0.73, 0.75, 0.2]} zoneSize={[1.3, 0.75, 1.2]} markerY={1.9}>
          <Office />
        </Station>
        <Station id="skills" position={[4, 0, 1.5]} zoneCenter={[0, 0.75, 0]} zoneSize={[1.2, 0.75, 1.2]} markerY={2.4}>
          <BagStand />
          {/* Pendurado no gancho: é dali que ele balança ao levar um golpe. O
              saco tem 1,4 m com a corrente, então a base fica a 30 cm do chão. */}
          <BagSwing pivotY={HOOK_HEIGHT}>
            <group position-y={HOOK_HEIGHT - 1.4}>
              <PunchingBag />
            </group>
          </BagSwing>
        </Station>
        {/* Halteres no rack, ao lado do saco (academia): 1 unidade de altura; 90 cm. */}
        <Prop url="/models/ai/12-halteres.glb" scale={0.9} position={[5.7, 0, 0.7]} rotationY={-Math.PI / 6} />
        {/* Vestiário provisório: os 3 armários lado a lado, ainda sem estação. */}
        <Locker position={[5.5, 0, -3]} shirt />
        <Locker position={[6.15, 0, -3]} shirt />
        <Locker position={[6.8, 0, -3]} shirt />
        {/* Banco do vestiário: 1 unidade de comprimento; 1,3 m e 44 cm de altura. */}
        <Prop url="/models/ai/11-banco.glb" scale={1.3} position={[6.15, 0, -1.9]} rotationY={Math.PI / 2} />
        {/* Quarto provisório: cama de casal (1 unidade de comprimento; 2 m),
            com a cabeceira para o fundo. Limpa com scripts/clean_loose.py. */}
        <Prop url="/models/ai/10-cama.glb" scale={2} position={[-6.5, 0, -3]} />
        {/* Casa (item 16), provisória: vai ser gerada de novo com vidro de
            verdade nas janelas (hoje são vãos) e textura 4k. 1 unidade de
            largura; 7 m. Textura mantida em 2k. */}
        <Prop url="/models/ai/16-casa.glb" scale={7} position={[0, 0, -7]} />
        <Station id="contact" position={[-3.5, 0, 3]} zoneCenter={[0, 0.75, 0]} zoneSize={[1, 0.75, 1]} markerY={1.8}>
          {/* Caixa de correio no poste: 1 unidade de altura; 1,2 m. */}
          <Prop url="/models/ai/17-caixa-correio.glb" scale={1.2} position={[0, 0, 0]} />
        </Station>

        {/* 1 unidade = 1 metro. As caixas nascem no ar e caem. */}
        <Box position={[0, 3, 0]} color="#0A3FB8" />
        <Box position={[-2, 4, 1]} size={0.5} color="#f08c00" />
        <Box position={[1.8, 5, -1.2]} size={1.5} color="#FAFAF7" />

        <Player position={[0, 2, 4]} />
      </Physics>
    </>
  )
}
