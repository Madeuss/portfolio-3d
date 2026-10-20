import { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { Float32BufferAttribute, Object3D, Vector3, type BufferGeometry, type InstancedMesh, type Material, type Mesh, type MeshStandardMaterial } from 'three'
import { addWind } from './wind'
import type { Area } from './Grass'

// Peças do quintal que eram formas simples em código e viraram modelos do
// Tripo (itens 40 a 45): cerca-viva, mureta, portão, tufos de grama, flores e
// postes. As que se repetem muito são desenhadas de uma vez (InstancedMesh).

const URL = {
  hedge: '/models/ai/40-arbusto.glb',
  wall: '/models/ai/41-mureta.glb',
  gate: '/models/ai/42-portao.glb',
  tuft: '/models/ai/43-tufo-grama.glb',
  daisy: '/models/ai/44a-margaridas.glb',
  tulip: '/models/ai/44b-tulipas.glb',
  lavender: '/models/ai/44c-lavanda.glb',
  lamp: '/models/ai/45-poste.glb',
}

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}
const inside = (x: number, z: number, a: Area) => x > a.x[0] && x < a.x[1] && z > a.z[0] && z < a.z[1]

// A malha do modelo nas coordenadas do modelo (0 no chão, 1 unidade no maior
// lado): o meshopt guarda as posições comprimidas e põe a escala no nó; aqui
// isso vira números normais, para instanciar e para o vento medir a altura.
function useBaked(url: string) {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    scene.updateMatrixWorld(true)
    let mesh: Mesh | undefined
    scene.traverse((o) => {
      if (!mesh && (o as Mesh).isMesh) mesh = o as Mesh
    })
    const src = mesh!.geometry
    const geometry: BufferGeometry = src.clone()
    const pos = src.attributes.position
    const out = new Float32Array(pos.count * 3)
    const v = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh!.matrixWorld)
      out.set([v.x, v.y, v.z], i * 3)
    }
    geometry.setAttribute('position', new Float32BufferAttribute(out, 3))
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    return { geometry, material: mesh!.material as MeshStandardMaterial }
  }, [scene])
}

type Item = { x: number; y?: number; z: number; rotY?: number; scale: number | [number, number, number] }

/** Várias cópias de um modelo numa chamada de desenho só. */
function ModelInstances({ url, items, wind, material: override }: { url: string; items: Item[]; wind?: { from: number; amount: number }; material?: (m: MeshStandardMaterial) => Material }) {
  const { geometry, material } = useBaked(url)
  const mat = useMemo(() => {
    const m = override ? override(material) : material
    if (wind) addWind(m, { from: wind.from, to: 1, amount: wind.amount })
    return m
  }, [material, override, wind])
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new Object3D()
    items.forEach((it, i) => {
      o.position.set(it.x, it.y ?? 0, it.z)
      o.rotation.set(0, it.rotY ?? 0, 0)
      if (typeof it.scale === 'number') o.scale.setScalar(it.scale)
      else o.scale.set(...it.scale)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.count = items.length
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return <instancedMesh ref={ref} args={[geometry, mat, items.length]} castShadow receiveShadow />
}

// ---- Cerca-viva (40) -----------------------------------------------------------

/** Blocos de arbusto lado a lado (o modelo: 1 × 0,7 × 0,7, pontas retas). */
export function HedgeRow({ bushes, z, size }: { bushes: { x: number; h: number }[]; z: number; size: number }) {
  const items = useMemo<Item[]>(
    () => bushes.map((b, i) => ({ x: b.x, z, rotY: i % 2 ? Math.PI : 0, scale: [size * 1.1, b.h / 0.7, 0.62 / 0.7] })),
    [bushes, z, size],
  )
  return <ModelInstances url={URL.hedge} items={items} />
}

// ---- Mureta (41) ---------------------------------------------------------------

/** Um lado da mureta: de `from` a `to` (no chão), em pedaços de ~2 m. */
export type WallSide = { from: [number, number]; to: [number, number] }
// O modelo tem 1 × 0,4 × 0,14: os pedaços ficam com 50 cm de altura e 40 cm de
// espessura (o gato senta em cima).
const WALL_H = 0.5
const WALL_T = 0.4

export function Walls({ sides }: { sides: WallSide[] }) {
  const items = useMemo<Item[]>(() => {
    const list: Item[] = []
    for (const { from, to } of sides) {
      const dx = to[0] - from[0]
      const dz = to[1] - from[1]
      const len = Math.hypot(dx, dz)
      const n = Math.max(1, Math.round(len / 2))
      const seg = len / n
      const rotY = -Math.atan2(dz, dx)
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n
        list.push({ x: from[0] + dx * u, z: from[1] + dz * u, rotY, scale: [seg, WALL_H / 0.4, WALL_T / 0.14] })
      }
    }
    return list
  }, [sides])
  return <ModelInstances url={URL.wall} items={items} />
}

// ---- Portão (42) ---------------------------------------------------------------

/** O arco de entrada, de largura `width`, com uma barreira invisível no vão
    (as portas estão abertas, mas o quintal é o fim do mundo). */
export function Gate({ z, width }: { z: number; width: number }) {
  const { scene } = useGLTF(URL.gate)
  const gate = useMemo(() => {
    const c = scene.clone()
    c.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = o.receiveShadow = true
    })
    return c
  }, [scene])
  return (
    <RigidBody type="fixed" colliders={false} position={[0, 0, z]}>
      <CuboidCollider args={[width / 2, 0.6, 0.15]} position={[0, 0.6, 0]} />
      <primitive object={gate} scale={width} />
    </RigidBody>
  )
}

// ---- Tufos de grama (43) --------------------------------------------------------

/** Tufos espalhados pelo gramado, fora das áreas `clear` (no lugar das moitinhas). */
export function GrassTufts({ half, clear, count = 30 }: { half: number; clear: Area[]; count?: number }) {
  const items = useMemo<Item[]>(() => {
    const rnd = seeded(42)
    const list: Item[] = []
    let tries = 0
    while (list.length < count && tries++ < count * 20) {
      const x = (rnd() * 2 - 1) * half
      const z = (rnd() * 2 - 1) * half
      if (clear.some((a) => inside(x, z, a))) continue
      list.push({ x, z, rotY: rnd() * Math.PI * 2, scale: 0.2 + rnd() * 0.12 })
    }
    return list
  }, [half, clear, count])
  return <ModelInstances url={URL.tuft} items={items} wind={WIND_SOFT} />
}
const WIND_SOFT = { from: 0.15, amount: 0.05 }

// ---- Flores (44) ---------------------------------------------------------------

const KINDS = [URL.daisy, URL.tulip, URL.lavender] as const

/** Canteiros: [x, z, quantos tufos]; cada tufo sorteia margarida, tulipa ou lavanda. */
export function FlowerBeds({ beds }: { beds: [number, number, number][] }) {
  const byKind = useMemo(() => {
    const rnd = seeded(11)
    const lists: Item[][] = KINDS.map(() => [])
    for (const [bx, bz, n] of beds) {
      // cada modelo já é um tufo com 3 a 5 flores: metade da conta de antes
      for (let i = 0; i < Math.max(3, Math.round(n / 2)); i++) {
        const a = rnd() * Math.PI * 2
        const d = Math.sqrt(rnd()) * 0.42
        lists[Math.floor(rnd() * KINDS.length)].push({ x: bx + Math.cos(a) * d, z: bz + Math.sin(a) * d, rotY: rnd() * Math.PI * 2, scale: 0.36 + rnd() * 0.12 })
      }
    }
    return lists
  }, [beds])
  return (
    <>
      {KINDS.map((url, k) => (
        <ModelInstances key={url} url={url} items={byKind[k]} wind={WIND_FLOWER} />
      ))}
    </>
  )
}
const WIND_FLOWER = { from: 0.2, amount: 0.04 }

// ---- Poste de luz (45) ---------------------------------------------------------

/** Brilho dos vidros dos postes: o dia e noite (World) aumenta à noite. */
export const lampGlow = { value: 0.15 }

// Os vidros são a parte clara e amarelada da textura: só ela brilha (a madeira
// e o ferro, escuros, não).
function glowingGlass(material: MeshStandardMaterial) {
  const m = material.clone()
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uLampGlow = lampGlow
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uLampGlow;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float glass = smoothstep(0.62, 0.8, min(diffuseColor.r, diffuseColor.g));
        totalEmissiveRadiance += vec3(1.0, 0.72, 0.38) * glass * uLampGlow;`, // luz de lâmpada, quente
      )
  }
  m.customProgramCacheKey = () => 'lamp-glass'
  return m
}

/** Os postes do caminho (o modelo tem 1 unidade de altura; o poste, 1,1 m). */
export function LampPosts({ at }: { at: [number, number][] }) {
  const items = useMemo<Item[]>(() => at.map(([x, z], i) => ({ x, z, rotY: i * 0.7, scale: 1.1 })), [at])
  return (
    <>
      <ModelInstances url={URL.lamp} items={items} material={glowingGlass} />
      <RigidBody type="fixed" colliders={false}>
        {at.map(([x, z]) => (
          <CylinderCollider key={`${x},${z}`} args={[0.55, 0.1]} position={[x, 0.55, z]} />
        ))}
      </RigidBody>
    </>
  )
}

Object.values(URL).forEach((u) => useGLTF.preload(u))
