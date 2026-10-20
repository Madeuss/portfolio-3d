import type { Material } from 'three'

// Vento (item 13): as copas das árvores, as moitinhas e as flores balançam.
// É feito no shader, na placa de vídeo: cada vértice anda um pouco para o
// lado, mais quanto mais alto ele está no modelo (a base fica parada), com a
// fase tirada da posição no mundo para cada planta balançar no seu tempo.
// Um relógio só (windTime) para todas, atualizado pelo <Wind /> do World.

export const windTime = { value: 0 }

type Options = {
  /** Altura (no espaço do modelo) onde o balanço começa: abaixo dela, nada mexe. */
  from: number
  /** Altura onde o balanço chega ao máximo. */
  to: number
  /** Deslocamento máximo, no espaço do modelo. */
  amount: number
  /** Velocidade (1 = brisa). */
  speed?: number
}

export function addWind(material: Material, { from, to, amount, speed = 1 }: Options) {
  // o mesmo material pode ser usado por várias cópias do modelo: só uma vez
  if (material.userData.wind) return
  material.userData.wind = true
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWindTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          vec4 windOrigin = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #ifdef USE_INSTANCING
            windOrigin = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          #endif
          float windW = smoothstep(${from.toFixed(3)}, ${to.toFixed(3)}, position.y);
          float windT = uWindTime * ${speed.toFixed(3)} + windOrigin.x * 0.35 + windOrigin.z * 0.25;
          // duas ondas somadas: o balanço não fica mecânico
          float windX = sin(windT * 1.3) * 0.7 + sin(windT * 2.9 + 1.7) * 0.3;
          float windZ = sin(windT * 0.9 + 2.1) * 0.5;
          transformed.x += windX * ${amount.toFixed(4)} * windW;
          transformed.z += windZ * ${amount.toFixed(4)} * windW;
        }`,
      )
  }
  // shaders diferentes para quantidades diferentes de vento
  material.customProgramCacheKey = () => `wind-${from}-${to}-${amount}-${speed}`
  material.needsUpdate = true
}
