import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'
import { sky } from './sky'

// Vaga-lumes (como os do worawork à noite): pontinhos amarelos que flutuam
// devagar pelo quintal e piscam. Só aparecem conforme anoitece (sky.night).
// Um único Points com shader: a posição e o pisca são calculados na placa.

const COUNT = 60
const HEIGHT: [number, number] = [0.3, 1.9]

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

export default function Fireflies({ half }: { half: number }) {
  const { geometry, material } = useMemo(() => {
    const rnd = seeded(7)
    const pos = new Float32Array(COUNT * 3)
    const seed = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (rnd() * 2 - 1) * half
      pos[i * 3 + 1] = HEIGHT[0] + rnd() * (HEIGHT[1] - HEIGHT[0])
      pos[i * 3 + 2] = (rnd() * 2 - 1) * half
      seed[i] = rnd() * 100
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('seed', new BufferAttribute(seed, 1))
    const m = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, uSize: { value: 30 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float uTime;
        uniform float uSize;
        varying float vBlink;
        void main() {
          vec3 p = position;
          // passeio lento, cada um no seu ritmo
          float t = uTime * 0.25 + seed;
          p.x += sin(t * 1.3) * 0.6 + sin(t * 2.7) * 0.15;
          p.z += cos(t * 1.1) * 0.6 + cos(t * 2.3) * 0.15;
          p.y += sin(t * 1.7) * 0.25;
          // pisca: aceso a maior parte do tempo, apaga de vez em quando
          vBlink = smoothstep(-0.3, 0.6, sin(uTime * 1.6 + seed * 3.0));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          // tamanho em px a 10 m da câmera (a câmera do jogo fica longe), na
          // resolução da tela
          gl_PointSize = uSize * (10.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uNight;
        varying float vBlink;
        void main() {
          // ponto redondo e macio: miolo forte e um halo
          float d = length(gl_PointCoord - 0.5);
          float glow = smoothstep(0.5, 0.0, d);
          float core = smoothstep(0.18, 0.0, d);
          vec3 color = vec3(1.0, 0.86, 0.35) * glow + vec3(1.0, 0.97, 0.75) * core;
          gl_FragColor = vec4(color, (glow * 0.7 + core) * vBlink * uNight);
        }`,
    })
    return { geometry: g, material: m }
  }, [half])

  useFrame(({ clock, gl }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uSize.value = 30 * gl.getPixelRatio()
    // aparecem só quando já está bem escuro
    material.uniforms.uNight.value = Math.max(0, (sky.night - 0.3) / 0.7)
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
