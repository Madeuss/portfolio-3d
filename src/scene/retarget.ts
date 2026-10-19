import {
  AnimationClip,
  AnimationMixer,
  Matrix4,
  Object3D,
  PropertyBinding,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
} from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

// Passa uma animação do Mixamo para o avatar do Tripo.
//
// Os ossos têm os mesmos nomes (o Tripo usa o esqueleto do Mixamo), mas a
// orientação de descanso de cada osso é diferente: copiar as rotações direto
// torce o boneco. Aqui, quadro a quadro, medimos quanto cada osso da origem
// girou em relação ao próprio descanso (no espaço do mundo) e aplicamos o
// mesmo giro ao osso do avatar, a partir do descanso dele.
//
// Antes disso, cada osso do avatar é "endireitado" para a pose de descanso da
// origem: o Mixamo descansa em T (braços na horizontal) e o Tripo em A (braços
// inclinados). Sem esse ajuste, baixar os braços a partir do T levava os
// braços do avatar, que já estavam inclinados, para dentro do corpo.

const HIPS = 'mixamorigHips'

type Pose = { world: Quaternion; parentWorld: Quaternion; parent: Object3D; dir: Vector3 | null }

const isBone = (obj: Object3D) => obj.name.startsWith('mixamorig')

// Filho que dá a direção do osso: o quadril aponta para a coluna, o peito
// para o pescoço, a mão para o dedo médio; nos outros, o único filho.
const MAIN_CHILD = /Spine|Neck|Head|HandMiddle1/

function mainChild(obj: Object3D) {
  const children = obj.children.filter(isBone)
  return children.find((c) => MAIN_CHILD.test(c.name)) ?? children[0]
}

function restPose(root: Object3D) {
  root.updateMatrixWorld(true)
  const poses = new Map<string, Pose>()
  root.traverse((obj) => {
    if (!isBone(obj) || !obj.parent) return
    const child = mainChild(obj)
    const start = obj.getWorldPosition(new Vector3())
    const dir = child ? child.getWorldPosition(new Vector3()).sub(start) : null
    poses.set(obj.name, {
      world: obj.getWorldQuaternion(new Quaternion()),
      parentWorld: obj.parent.getWorldQuaternion(new Quaternion()),
      parent: obj.parent,
      dir: dir && dir.lengthSq() > 1e-10 ? dir.normalize() : null,
    })
  })
  return poses
}

// Um nó do arquivo glTF (gltf.parser.json.nodes): a pose de descanso de
// cada osso, como saiu do Tripo.
export type GltfNode = {
  name?: string
  translation?: number[]
  rotation?: number[]
  scale?: number[]
}

// Volta cada osso para a pose de descanso gravada no arquivo. A cena na tela
// pode já estar animada (parado, andando), e skeleton.pose() não serve: com a
// malha quantizada pela dieta, ele põe o quadril no lugar errado e o boneco
// afunda no chão.
export function resetToRest(root: Object3D, nodes: GltfNode[]) {
  const byName = new Map(nodes.filter((n) => n.name).map((n) => [PropertyBinding.sanitizeNodeName(n.name!), n]))
  root.traverse((obj) => {
    const node = byName.get(obj.name)
    if (!node) return
    // Campo ausente no glTF quer dizer o valor padrão (zero, sem giro, 1).
    obj.position.fromArray(node.translation ?? [0, 0, 0])
    obj.quaternion.fromArray(node.rotation ?? [0, 0, 0, 1])
    obj.scale.fromArray(node.scale ?? [1, 1, 1])
  })
}

const cache = new WeakMap<Object3D, Map<string, AnimationClip>>()

// Ossos do braço (do ombro para baixo, sem a clavícula), para abrir os braços.
const LEFT_ARM = /^mixamorigLeft(Arm|ForeArm|Hand)/
const RIGHT_ARM = /^mixamorigRight(Arm|ForeArm|Hand)/

export type RetargetOptions = {
  // Abre os braços para fora, em graus. As animações do Mixamo são feitas
  // para um corpo magro; num avatar gordinho os braços atravessam a barriga.
  armSpread?: number
}

export function retargetClip(
  source: Object3D,
  clip: AnimationClip,
  target: Object3D,
  targetNodes: GltfNode[],
  name: string,
  options: RetargetOptions = {},
) {
  const clips = cache.get(target) ?? new Map<string, AnimationClip>()
  cache.set(target, clips)
  const cached = clips.get(name)
  if (cached) return cached
  const result = convert(source, clip, target, targetNodes, name, options)
  clips.set(name, result)
  return result
}

function convert(
  source: Object3D,
  clip: AnimationClip,
  target: Object3D,
  targetNodes: GltfNode[],
  name: string,
  { armSpread = 0 }: RetargetOptions,
) {
  // Cópias, para não mexer nas cenas que estão na tela.
  const src = clone(source)
  const tgt = clone(target)
  resetToRest(tgt, targetNodes)

  const srcRest = restPose(src)
  const tgtRest = restPose(tgt)
  const bones = [...tgtRest.keys()].filter((bone) => srcRest.has(bone))

  // Descanso do avatar endireitado para a pose da origem (T), osso a osso.
  const aligned = new Map(
    bones.map((bone) => {
      const from = srcRest.get(bone)!
      const to = tgtRest.get(bone)!
      const swing = from.dir && to.dir ? new Quaternion().setFromUnitVectors(to.dir, from.dir) : new Quaternion()
      return [bone, swing.multiply(to.world)]
    }),
  )

  // Altura do quadril de cada um, para a "quicada" do quadril caber no avatar.
  const srcHips = src.getObjectByName(HIPS)!.getWorldPosition(new Vector3())
  const tgtHips = tgt.getObjectByName(HIPS)!.getWorldPosition(new Vector3())
  const scale = tgtHips.y / srcHips.y

  const mixer = new AnimationMixer(src)
  mixer.clipAction(clip).play()

  const fps = 30
  const frames = Math.max(2, Math.round(clip.duration * fps) + 1)
  const times: number[] = []
  const rotations = new Map(bones.map((bone) => [bone, [] as number[]]))
  const hipsPositions: number[] = []

  // Giro do braço inteiro para fora, em volta do eixo para a frente (Z): o
  // lado esquerdo do boneco fica em +X, então esquerdo gira +, direito −.
  const spread = (armSpread * Math.PI) / 180
  const spreadLeft = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), spread)
  const spreadRight = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -spread)

  const world = new Map<string, Quaternion>()
  const q = new Quaternion()
  const p = new Vector3()
  const parentInverse = new Matrix4()

  for (let i = 0; i < frames; i++) {
    const time = Math.min((i / (frames - 1)) * clip.duration, clip.duration)
    times.push(time)
    mixer.setTime(time)
    src.updateMatrixWorld(true)
    world.clear()

    for (const bone of bones) {
      const from = srcRest.get(bone)!
      const to = tgtRest.get(bone)!
      // Giro da origem neste quadro em relação ao descanso, no mundo...
      const delta = src.getObjectByName(bone)!.getWorldQuaternion(q).multiply(from.world.clone().invert())
      // ...aplicado ao descanso (endireitado) do avatar.
      const targetWorld = delta.clone().multiply(aligned.get(bone)!)
      if (LEFT_ARM.test(bone)) targetWorld.premultiply(spreadLeft)
      else if (RIGHT_ARM.test(bone)) targetWorld.premultiply(spreadRight)
      world.set(bone, targetWorld)

      // Rotação local = mundo do pai⁻¹ × mundo do osso. Pai que não é osso
      // (o Armature) fica sempre no descanso.
      const parentWorld = world.get(to.parent.name) ?? to.parentWorld
      const local = parentWorld.clone().invert().multiply(targetWorld)
      rotations.get(bone)!.push(local.x, local.y, local.z, local.w)
    }

    // Quadril: o quanto a origem subiu, desceu ou balançou, na escala do avatar.
    src.getObjectByName(HIPS)!.getWorldPosition(p).sub(srcHips).multiplyScalar(scale).add(tgtHips)
    const hipsParent = tgtRest.get(HIPS)!.parent
    parentInverse.copy(hipsParent.matrixWorld).invert()
    p.applyMatrix4(parentInverse)
    hipsPositions.push(p.x, p.y, p.z)
  }

  const tracks = [
    ...bones.map((bone) => new QuaternionKeyframeTrack(`${bone}.quaternion`, times, rotations.get(bone)!)),
    new VectorKeyframeTrack(`${HIPS}.position`, times, hipsPositions),
  ]
  return new AnimationClip(name, clip.duration, tracks)
}
