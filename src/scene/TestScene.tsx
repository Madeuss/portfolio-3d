import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import type { Mesh } from 'three'

// Cena de teste (tarefa 1.4): chão, 3 caixas, luz de ambiente (HDRI) e sombras.
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
  const { color } = useControls('Chão', { color: { value: '#c3e6b0', label: 'cor' } })

  // O plano nasce em pé (eixo XY); girar -90° em X deita ele no chão.
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

type BoxProps = { position: [number, number, number]; size?: number; color: string; spin?: boolean }

function Box({ position, size = 1, color, spin = false }: BoxProps) {
  const ref = useRef<Mesh>(null)

  // useFrame roda a cada quadro (~60x por segundo). `delta` = segundos desde
  // o quadro anterior, então a velocidade é a mesma em qualquer monitor.
  useFrame((_, delta) => {
    if (spin && ref.current) ref.current.rotation.y += delta * 0.5
  })

  return (
    <mesh ref={ref} position={position} castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  )
}

export default function TestScene() {
  return (
    <>
      <Lights />
      <Floor />

      {/* 1 unidade = 1 metro: a caixa grande tem 1 m, a pequena 50 cm.
          O y é metade da altura para a caixa ficar apoiada no chão. */}
      <Box position={[0, 0.5, 0]} color="#0A3FB8" spin />
      <Box position={[-2, 0.25, 1]} size={0.5} color="#f08c00" />
      <Box position={[1.8, 0.75, -1.2]} size={1.5} color="#FAFAF7" />

      {/* makeDefault: outros componentes do drei passam a usar estes controles. */}
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} />
    </>
  )
}
