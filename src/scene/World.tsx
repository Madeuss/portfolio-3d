import { lazy, Suspense, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Stats, useProgress } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useControls } from 'leva'
import { Color, Texture, type AmbientLight, type DirectionalLight, type Material, type Mesh } from 'three'
import { isTouch } from '../state/device'
import { useGame } from '../state/game'
import Exterior, { EXTERIOR_DOOR_SPAWN, EXTERIOR_SPAWN } from './Exterior'
import { BLUE, INTERIOR_SPAWN } from './places'
import Player from './Player'
import { windTime } from './wind'
import { sky, stepSky, sunDirection } from './sky'
import { lampGlow } from './YardModels'

// O interior fica num arquivo à parte (código e móveis): a tela de
// carregamento só espera o terreno. Ele baixa quando o visitante já está
// jogando, com o navegador ocioso, bem antes de alguém chegar à porta.
// Depois de baixado, o módulo fica guardado e é usado direto: o React.lazy
// sempre suspende no primeiro uso (a promessa só resolve no próximo tick), e
// isso piscava o fundo azul mesmo com tudo já em cache.
let interiorModule: typeof import('./Interior') | null = null
const loadInterior = () => import('./Interior').then((m) => (interiorModule = m))
const LazyInterior = lazy(loadInterior)

function usePrefetchInterior() {
  const playing = useGame((s) => s.screen !== 'loading')
  useEffect(() => {
    if (!playing) return
    // ocioso ou, no máximo, 3 s depois (num aparelho fraco o navegador quase
    // nunca fica ocioso com a cena rodando)
    if (window.requestIdleCallback) window.requestIdleCallback(() => void loadInterior(), { timeout: 3000 })
    else window.setTimeout(() => void loadInterior(), 1500)
  }, [playing])
}

// Relógio do vento (wind.ts): um número só, lido pelos shaders das plantas.
function Wind() {
  useFrame(({ clock }) => void (windTime.value = clock.elapsedTime))
  return null
}

// Avisa a porta (state/game.ts) que a cena nova chegou: compila os shaders
// dela e espera um quadro inteiro desenhado, ainda com a tela escura.
function SceneReady() {
  const { gl, scene, camera } = useThree()
  const arrived = useGame((s) => s.arrived)
  useEffect(() => {
    let cancelled = false
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && arrived())))
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera, arrived])
  return null
}

// Aquecimento: com tudo baixado, compila os shaders (em paralelo, quando a
// placa permite) e manda as texturas para a placa de vídeo, ainda atrás da
// tela de carregamento. Sem isso, esse trabalho cai no primeiro quadro depois
// do "Entrar" e o clique demora a responder.
function Warmup() {
  const { gl, scene, camera, invalidate } = useThree()
  const setWarm = useGame((s) => s.setWarm)

  useEffect(() => {
    let started = false
    let cancelled = false
    // Assina o progresso direto na store (sem re-renderizar este componente
    // enquanto os modelos carregam, o que o React reclama).
    const check = ({ active, progress }: { active: boolean; progress: number }) => {
      if (started || active || progress < 100) return
      started = true
      warmUp()
    }
    const warmUp = () =>
      gl
        .compileAsync(scene, camera)
        .catch(() => undefined)
        .then(() => {
          if (cancelled) return
          scene.traverse((obj) => {
            const material = (obj as Mesh).material as Material | Material[] | undefined
            for (const m of Array.isArray(material) ? material : material ? [material] : []) {
              for (const value of Object.values(m)) if (value instanceof Texture) gl.initTexture(value)
            }
          })
          // um quadro inteiro (com o mapa de sombra) antes de liberar o botão
          invalidate()
          requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && setWarm()))
        })
    check(useProgress.getState())
    const unsubscribe = useProgress.subscribe(check)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [gl, scene, camera, invalidate, setWarm])

  return null
}

// O mundo: luz de ambiente (HDRI), sombras, a cena atual (terreno ou
// interior da casa, state/game.ts) e o personagem controlável.
// Os valores do painel Leva (canto superior direito, só em dev) servem para
// experimentar; quando acharmos um bom ajuste, ele vira o valor padrão aqui.

// 256 × 128: só ilumina e dá reflexo (o fundo é cor lisa); a versão 1k
// pesava 1,4 MB e o resultado na tela é o mesmo.
const HDRI = '/hdri/kloofendal_48d_partly_cloudy_puresky_256.hdr'
// Mapa de sombra: 4096 no computador; no celular, 2048 (a sombra é desenhada
// de novo a cada quadro e pesa na placa de vídeo do telefone).
const SHADOW_MAP = isTouch() ? 2048 : 4096

function Lights() {
  const { sunPosition, sunIntensity, ambient, envIntensity, showSky } = useControls('Luz', {
    sunPosition: { value: [8, 16, 6], label: 'sol (x, y, z)' },
    sunIntensity: { value: 2, min: 0, max: 6, step: 0.1, label: 'força do sol' },
    ambient: { value: 0.3, min: 0, max: 2, step: 0.05, label: 'luz ambiente' },
    envIntensity: { value: 0.6, min: 0, max: 2, step: 0.05, label: 'reflexo do HDRI' },
    showSky: { value: false, label: 'HDRI de fundo' },
  })

  // Dia e noite (sky.ts), só no terreno: sol girando e mudando de cor, luz
  // ambiente, reflexo do HDRI, fundo e as lâmpadas dos postes. Dentro de casa,
  // a luz fica a de dia.
  const sun = useRef<DirectionalLight>(null)
  const amb = useRef<AmbientLight>(null)
  const three = useThree((s) => s.scene)
  const exterior = useGame((s) => s.scene === 'exterior')
  useFrame((_, delta) => {
    const light = sun.current
    if (!light || !amb.current) return
    if (!exterior) {
      light.position.set(...(sunPosition as [number, number, number]))
      light.color.set('#ffffff')
      light.intensity = sunIntensity
      amb.current.intensity = ambient
      amb.current.color.set('#ffffff')
      three.environmentIntensity = envIntensity
      return
    }
    stepSky(delta)
    sunDirection(light.position, 19)
    light.color.copy(sky.light)
    light.intensity = sunIntensity * (1 - sky.night * 0.82)
    amb.current.intensity = ambient * (1 - sky.night * 0.45)
    amb.current.color.copy(sky.ambient)
    three.environmentIntensity = envIntensity * (1 - sky.night * 0.8)
    if (three.background instanceof Color) three.background.copy(sky.background)
    lampGlow.value = 0.15 + sky.night * 2.2
  })

  return (
    <>
      {/* HDRI = foto 360° do céu que ilumina e dá reflexo aos materiais.
          `background` liga a foto como fundo; desligado, fica a cor do Canvas. */}
      <Environment files={HDRI} background={showSky} environmentIntensity={envIntensity} />

      {/* Luz uniforme que clareia tudo, inclusive o lado sem sol. */}
      <ambientLight ref={amb} intensity={ambient} />

      {/* O "sol": luz paralela que gera as sombras. A sombra é calculada dentro
          de uma caixa (shadow-camera-*); objetos fora dela não fazem sombra. */}
      <directionalLight
        ref={sun}
        position={sunPosition as [number, number, number]}
        intensity={sunIntensity}
        castShadow
        shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
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
  usePrefetchInterior()
  const warm = useGame((s) => s.warm)
  const Interior = interiorModule?.default ?? LazyInterior
  const at = scene === 'interior' ? INTERIOR_SPAWN : spawn === 'door' ? EXTERIOR_DOOR_SPAWN : EXTERIOR_SPAWN

  return (
    <>
      {stats && <Stats />}
      {/* Fundo: claro no terreno; dentro da casa, o azul do madeusdev. */}
      <color attach="background" args={[scene === 'interior' ? BLUE : '#FAFAF7']} />
      <Lights />
      <Wind />
      {/* some depois de aquecer: não precisa mais ouvir o progresso */}
      {!warm && <Warmup />}

      {/* Tudo que colide fica dentro de <Physics>. `debug` desenha as formas
          de colisão em linhas, que é o que a física "enxerga". A `key` recria
          a física ao trocar de cena: o personagem renasce na entrada da nova. */}
      <Physics key={scene} debug={debug}>
        {/* Se o interior ainda não chegou, a tela fica no escuro da porta até
            ele chegar; o personagem espera junto, para não cair no vazio. */}
        <Suspense fallback={null}>
          {scene === 'exterior' ? <Exterior /> : <Interior />}
          <Player position={at} />
          <SceneReady />
        </Suspense>
      </Physics>
    </>
  )
}
