import Office from './Office'
import PunchingBag from './PunchingBag'
import Station from './Station'
import BagSwing from './BagSwing'
import BagStand, { HOOK_HEIGHT } from './BagStand'
import Locker from './Locker'
import type { ExperienceId } from '../data/stations'
import Prop from './Prop'
import InteriorShell, { Doormat } from './InteriorShell'
import { JerseyFrame, OfficeRug, RoundRug } from './Decor'
import InteriorWindow, { SunPatch } from './InteriorWindow'

// Interior da casa (docs/planta.excalidraw, à direita): 10 × 10 m sem teto e
// sem paredes internas, com os cômodos em quatro cantos, separados pelo piso
// (InteriorShell). Os móveis ficam virados para o sul (para a câmera), mesmo onde a planta
// encosta eles na parede de lado.

// Armários do vestiário, na ordem das experiências (data/stations.ts).
const LOCKERS: { id: ExperienceId; x: number; name: string }[] = [
  { id: 'exp-magalu', x: -4.1, name: 'MAGALU' },
  { id: 'exp-jinboo', x: -3.45, name: 'JINBOO' },
  { id: 'exp-autoseg', x: -2.8, name: 'AUTOSEG' },
]

// Onde o personagem aparece ao entrar: logo à frente do capacho, na porta sul.
export const INTERIOR_SPAWN: [number, number, number] = [0, 2, 3.2]

export default function Interior() {
  return (
    <>
      <InteriorShell />

      {/* Janelas (face de dentro das paredes: fundo em z = −4,8, leste em
          x = 4,8): no quarto, acima da cabeceira, com cortinas; na academia e
          no escritório, sem. Cada uma com a mancha de sol no chão. */}
      <InteriorWindow position={[3.1, 1.6, -4.8]} width={1.5} height={0.7} curtains seed={3} />
      <InteriorWindow position={[-3.1, 1.45, -4.8]} width={1.3} height={0.9} seed={7} />
      <SunPatch position={[-3.1, -3.7]} size={[1.4, 1.6]} />
      <InteriorWindow position={[4.8, 1.45, 1.9]} rotationY={-Math.PI / 2} width={1.2} height={0.9} seed={11} />
      <SunPatch position={[3.9, 1.9]} size={[1.6, 1.2]} />

      {/* Capacho na porta sul: E sai da casa. */}
      <Station id="door" position={[0, 0, 4.35]} zoneCenter={[0, 0.75, 0]} zoneSize={[0.8, 0.75, 0.5]} markerY={1.6}>
        <Doormat />
      </Station>

      {/* Academia (noroeste): o saco é só diversão (E = golpe, sem marcador
          flutuante); quem abre a stack são os halteres. */}
      <Station id="bag" position={[-2.4, 0, -2.2]} zoneCenter={[0, 0.75, 0]} zoneSize={[1.2, 0.75, 1.2]} markerY={2.4}>
        <BagStand />
        {/* Pendurado no gancho: é dali que ele balança ao levar um golpe. O
            saco tem 1,4 m com a corrente, então a base fica a 30 cm do chão. */}
        <BagSwing pivotY={HOOK_HEIGHT}>
          <group position-y={HOOK_HEIGHT - 1.4}>
            <PunchingBag />
          </group>
        </BagSwing>
      </Station>
      {/* Halteres no rack: 1 unidade de altura; 90 cm. */}
      <Station id="skills" position={[-4.1, 0, -3.6]} zoneCenter={[0.35, 0.75, 0.6]} zoneSize={[0.75, 0.75, 0.6]} markerY={1.45} markerAt={[0, 0]}>
        <Prop url="/models/ai/12-halteres.glb" scale={0.9} position={[0, 0, 0]} rotationY={Math.PI / 6} />
      </Station>
      {/* Banco de musculação: 1 unidade de altura com o encosto; 1,2 m. */}
      <Prop url="/models/ai/31-banco-musculacao.glb" scale={1.2} position={[-4, 0, -1.6]} />
      {/* Luvas penduradas no gancho, na parede do fundo: 1 unidade com o
          gancho; 55 cm, o gancho a 1,65 m do chão. */}
      <Prop url="/models/ai/13-luvas.glb" scale={0.55} position={[-1.3, 1.1, -4.75]} />

      {/* Quarto (nordeste): cama de casal (1 unidade de comprimento; 2 m), com
          a cabeceira para o fundo. Limpa com scripts/clean_loose.py. */}
      <Prop url="/models/ai/10-cama.glb" scale={2} position={[3.1, 0, -3.6]} />
      {/* Criados-mudos com abajur dos dois lados da cabeceira: 1 unidade de
          altura com o abajur; 85 cm. */}
      <Prop url="/models/ai/27-criado-mudo.glb" scale={0.85} position={[1.95, 0, -4.5]} />
      <Prop url="/models/ai/27-criado-mudo.glb" scale={0.85} position={[4.25, 0, -4.5]} />
      {/* Sala no mesmo cômodo: sofá de frente para o rack na parede leste,
          com o tapete redondo entre os dois. */}
      <RoundRug position={[3.3, 0, -1.5]} radius={0.95} />
      {/* Sofá: 1 unidade de largura; 2,1 m. Vem de frente para +z: gira para +x. */}
      <Prop url="/models/ai/29-sofa.glb" scale={2.1} position={[1.85, 0, -1.5]} rotationY={Math.PI / 2} />
      {/* Rack com TV: 1 unidade de largura; 1,7 m. Gira para olhar para −x. */}
      <Prop url="/models/ai/30-rack-tv.glb" scale={1.7} position={[4.5, 0, -1.5]} rotationY={-Math.PI / 2} />
      {/* Sobre mim: a camisa do Corinthians emoldurada na parede do fundo,
          ao lado da cama. */}
      <Station id="about" position={[1, 0, -4.2]} zoneCenter={[0, 0.75, 0.6]} zoneSize={[0.8, 0.75, 0.6]} markerY={2.2} markerAt={[0, -0.5]}>
        <JerseyFrame position={[0, 1.35, -0.6 + 0.025]} />
      </Station>

      {/* Escritório (sudeste). A mesa fica 0,73 m à direita da origem do Office. */}
      <Station id="projects" position={[2.6, 0, 2]} zoneCenter={[0.73, 0.75, 0.2]} zoneSize={[1.3, 0.75, 1.2]} markerY={1.9}>
        <Office />
      </Station>
      <OfficeRug position={[3.35, 0, 2.55]} size={[1.8, 1.3]} />
      {/* Estante na parede leste: 1 unidade de altura; 1,8 m. Gira para −x. */}
      <Prop url="/models/ai/28-estante.glb" scale={1.8} position={[4.62, 0, 3.6]} rotationY={-Math.PI / 2} />

      {/* Plantas (1 unidade de altura; 1,1 m): fim do corredor, canto do
          escritório e ao lado da porta. */}
      <Prop url="/models/ai/15-planta.glb" scale={1.1} position={[0, 0, -4.4]} />
      <Prop url="/models/ai/15-planta.glb" scale={1.1} position={[4.35, 0, 4.4]} />
      <Prop url="/models/ai/15-planta.glb" scale={1.1} position={[-1.05, 0, 4.4]} />

      {/* Vestiário (sudoeste): os 3 armários lado a lado e o banco na frente.
          Cada armário é uma experiência, com o nome da empresa e o 7 na camisa. */}
      {LOCKERS.map(({ id, x, name }) => (
        <Station key={id} id={id} position={[x, 0, 1.6]} zoneCenter={[0, 0.75, 0.62]} zoneSize={[0.3, 0.75, 0.4]} markerY={2.15} markerAt={[0, 0.25]}>
          <Locker position={[0, 0, 0]} shirt={name} />
        </Station>
      ))}
      {/* Banco: 1 unidade de comprimento; 1,3 m e 44 cm de altura. */}
      <Prop url="/models/ai/11-banco.glb" scale={1.3} position={[-3.45, 0, 2.8]} rotationY={Math.PI / 2} />
    </>
  )
}
