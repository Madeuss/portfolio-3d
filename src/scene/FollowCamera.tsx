import { useEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { EcctrlHandle } from 'ecctrl'

// Câmera do jogo (tarefa 2.5), no estilo do worawork: ângulo fixo, de cima e
// inclinada, seguindo o personagem. Só o zoom muda, pela rodinha do mouse.

// Direção de onde a câmera olha: para trás (z) e bem para cima (y).
const DIRECTION = new Vector3(0, 1.1, 1).normalize()
const MIN_DISTANCE = 6
const MAX_DISTANCE = 18
const START_DISTANCE = 11
// Quanto maior, mais "grudada" a câmera fica; menor = acompanha com atraso suave.
const FOLLOW_SPEED = 5

type Props = { target: RefObject<EcctrlHandle | null> }

export default function FollowCamera({ target }: Props) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const distance = useRef(START_DISTANCE)
  const focus = useRef(new Vector3())
  const wanted = useRef(new Vector3())

  // Rodinha do mouse: aproxima ou afasta, dentro dos limites.
  useEffect(() => {
    const el = gl.domElement
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const next = distance.current + e.deltaY * 0.01
      distance.current = Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, next))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [gl])

  useFrame((_, delta) => {
    const player = target.current
    if (!player) return

    // Ponto que a câmera mira: o personagem, com o atraso suave do lerp.
    // 1 - exp(-k·dt) deixa a suavidade igual em 30 ou 144 fps.
    const t = 1 - Math.exp(-FOLLOW_SPEED * delta)
    focus.current.lerp(player.currPos, t)

    wanted.current.copy(DIRECTION).multiplyScalar(distance.current).add(focus.current)
    camera.position.lerp(wanted.current, t)
    camera.lookAt(focus.current)
  })

  return null
}
