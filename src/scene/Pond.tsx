import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { CanvasTexture, Color, IcosahedronGeometry, RepeatWrapping, SRGBColorSpace, ShaderMaterial, Vector3 } from 'three'

// Laguinho feito em código (no estilo do worawork, sem vitória-régia): anel de
// pedras arredondadas, água com ondinhas animadas e duas taboas num canto.

const RADIUS = 1 // raio da água
const STONES = 15

// Sorteio com semente: as pedras saem sempre iguais.
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

// Água: mais clara no meio, anéis suaves que se afastam devagar e um brilho.
const waterVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    vec3 color = mix(uShallow, uDeep, smoothstep(0.0, 1.0, d));
    float ripple = sin(d * 22.0 - uTime * 1.6) * 0.5 + 0.5;
    color += smoothstep(0.85, 1.0, ripple) * 0.08 * (1.0 - d);
    // reflexo do céu, uma mancha clara deslocada
    float shine = 1.0 - smoothstep(0.0, 0.35, length(vUv - vec2(0.38, 0.62)));
    color += shine * 0.12;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

// Pedra: esfera com a superfície empelotada (deslocada por uma soma de senos),
// para não ficar lisa como sabonete. `seed` muda o formato de cada uma.
function stoneGeometry(seed: number) {
  const g = new IcosahedronGeometry(1, 4)
  const p = g.getAttribute('position')
  const v = new Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n =
      Math.sin(v.x * 3.1 + seed) * Math.sin(v.y * 2.7 + seed * 1.7) * Math.sin(v.z * 3.3 - seed) * 0.09 +
      Math.sin(v.x * 9.0 + seed * 3) * Math.sin(v.z * 8.0 - seed) * 0.025
    v.multiplyScalar(1 + n)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

// Textura de pedra: cinza claro com pintinhas, manchas e veios finos.
export function stoneTexture() {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const rnd = seeded(23)
  g.fillStyle = '#d9d4ca'
  g.fillRect(0, 0, s, s)
  for (let i = 0; i < 30; i++) {
    const x = rnd() * s, y = rnd() * s, r = 15 + rnd() * 35
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    const dark = rnd() > 0.5
    grad.addColorStop(0, dark ? 'rgba(150,142,130,0.35)' : 'rgba(245,242,236,0.4)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 1400; i++) {
    const v = rnd() > 0.5 ? 120 + rnd() * 40 : 235 + rnd() * 20
    g.fillStyle = `rgba(${v},${v - 4},${v - 10},0.55)`
    g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2)
  }
  g.strokeStyle = 'rgba(120,112,100,0.35)'
  g.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    g.beginPath()
    let x = rnd() * s, y = rnd() * s
    g.moveTo(x, y)
    for (let k = 0; k < 5; k++) g.lineTo((x += rnd() * 30 - 15), (y += rnd() * 30 - 15))
    g.stroke()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

function Cattail({ position, tilt }: { position: [number, number, number]; tilt: [number, number] }) {
  return (
    <group position={position} rotation={[tilt[0], 0, tilt[1]]}>
      <mesh position-y={0.32} castShadow>
        <cylinderGeometry args={[0.012, 0.016, 0.64, 6]} />
        <meshStandardMaterial color="#6f8f3a" roughness={0.8} />
      </mesh>
      <mesh position-y={0.6} castShadow>
        <capsuleGeometry args={[0.04, 0.12, 4, 10]} />
        <meshStandardMaterial color="#8a5a2b" roughness={0.7} />
      </mesh>
    </group>
  )
}

export default function Pond({ position }: { position: [number, number, number] }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
        uniforms: {
          uTime: { value: 0 },
          uDeep: { value: new Color('#4fb8d8') },
          uShallow: { value: new Color('#9be3ef') },
        },
      }),
    [],
  )
  const time = useRef(0)
  useFrame((_, delta) => {
    time.current += delta
    material.uniforms.uTime.value = time.current
  })

  // pedras em volta, de tamanhos e alturas variados
  const stones = useMemo(() => {
    const rnd = seeded(17)
    return Array.from({ length: STONES }, (_, i) => {
      const a = (i / STONES) * Math.PI * 2 + rnd() * 0.15
      const r = RADIUS + 0.08 + rnd() * 0.06
      const size = 0.17 + rnd() * 0.08
      return {
        geometry: stoneGeometry(i * 2.3 + rnd() * 5),
        position: [Math.cos(a) * r, size * 0.45, Math.sin(a) * r] as [number, number, number],
        scale: [size * 1.35, size * 0.85, size] as [number, number, number],
        rotation: a + rnd() * 0.6,
        tone: rnd(),
      }
    })
  }, [])
  const stoneMap = useMemo(stoneTexture, [])

  return (
    <group position={position}>
      {/* Não dá para entrar na água: um cilindro alto em volta segura o
          personagem (baixo, a mola do ecctrl subia nele como num degrau). */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[1, RADIUS + 0.25]} position-y={1} />
      </RigidBody>

      <mesh rotation-x={-Math.PI / 2} position-y={0.05} material={material}>
        <circleGeometry args={[RADIUS + 0.05, 48]} />
      </mesh>
      {/* fundo escuro em volta da água, para o anel não mostrar o gramado */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[RADIUS - 0.05, RADIUS + 0.2, 48]} />
        <meshStandardMaterial color="#6f8f6a" />
      </mesh>

      {stones.map((s, i) => (
        <mesh key={i} geometry={s.geometry} position={s.position} scale={s.scale} rotation-y={s.rotation} castShadow receiveShadow>
          <meshStandardMaterial
            map={stoneMap}
            bumpMap={stoneMap}
            bumpScale={1.5}
            color={s.tone > 0.5 ? '#f2eee8' : '#dcd6cc'}
            roughness={1}
          />
        </mesh>
      ))}

      <Cattail position={[0.45, 0, -0.35]} tilt={[0.08, -0.12]} />
      <Cattail position={[0.55, 0, -0.22]} tilt={[-0.05, -0.22]} />
      <Cattail position={[0.36, 0, -0.18]} tilt={[0.1, 0.05]} />
    </group>
  )
}
