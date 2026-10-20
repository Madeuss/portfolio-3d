import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, LinearFilter, type MeshStandardMaterial } from 'three'
import { player } from '../state/player'

// Trilha na grama (item 14): onde o personagem anda, a grama fica pisada (um
// pouco mais escura) e volta ao normal em uns 20 s. Um canvas pequeno cobre o
// terreno inteiro; a cada quadro ele apaga um pouquinho de tudo e pinta uma
// marca embaixo do personagem. O shader do chão (patchTrail) lê esse canvas.

const SIZE = 256 // px do canvas (6 cm por px num terreno de 16 m)
const FADE = 0.012 // quanto some por quadro (a 60 fps, uns 20 s)
const STEP = 0.18 // raio da marca do pé, em metros
const DARKEN = 0.16 // o quanto a grama pisada escurece

export function useTrail(size: number) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, SIZE, SIZE)
    const texture = new CanvasTexture(canvas)
    texture.minFilter = texture.magFilter = LinearFilter
    texture.generateMipmaps = false
    return { canvas, ctx, texture, size }
  }, [size])
}

type Trail = ReturnType<typeof useTrail>

/** Pinta embaixo do personagem e apaga devagar. Fica dentro do Canvas. */
export function TrailPainter({ trail }: { trail: Trail }) {
  useFrame(() => {
    const { ctx, texture, size } = trail
    ctx.fillStyle = `rgba(0,0,0,${FADE})`
    ctx.fillRect(0, 0, SIZE, SIZE)
    const speed = Math.hypot(player.vel.x, player.vel.z)
    if (speed > 0.4 && player.pos.y < 1.2) {
      const px = ((player.pos.x + size / 2) / size) * SIZE
      const pz = ((player.pos.z + size / 2) / size) * SIZE
      const r = (STEP / size) * SIZE
      const g = ctx.createRadialGradient(px, pz, 0, px, pz, r)
      g.addColorStop(0, 'rgba(255,255,255,0.22)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(px - r, pz - r, r * 2, r * 2)
    }
    texture.needsUpdate = true
  })
  return null
}

/** Ensina o material do chão a escurecer onde o canvas da trilha está claro. */
export function patchTrail(material: MeshStandardMaterial, trail: Trail) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTrail = { value: trail.texture }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vTrailUv;')
      // uv do plano: v = 1 em z = −8, que é o topo do canvas (a textura vira
      // o canvas de cabeça para baixo ao subir): bate sem inverter
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvTrailUv = uv;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uTrail;\nvarying vec2 vTrailUv;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float trail = texture2D(uTrail, vTrailUv).r;
        // pisada: mais escura e um pouco mais amarelada
        diffuseColor.rgb *= mix(vec3(1.0), vec3(${(1 - DARKEN).toFixed(3)}, ${(1 - DARKEN * 0.7).toFixed(3)}, ${(1 - DARKEN * 1.3).toFixed(3)}), trail);`,
      )
  }
  material.customProgramCacheKey = () => 'trail'
}
