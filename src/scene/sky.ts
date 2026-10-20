import { Color, MathUtils } from 'three'

// Dia e noite (item 12) no terreno: um dia inteiro em CYCLE_S, começando de
// manhã. A noite é curta (uns 25% do ciclo) e não fica preta: luz azulada de
// lua, para quem chega nessa hora ainda enxergar o quintal. O World lê daqui a
// cada quadro (sol, luz ambiente, fundo) e as lâmpadas acendem mais à noite.

export const CYCLE_S = 480
const START = 0.08 // começa de manhã (0 = nascer do sol, 0,25 = meio-dia)

const DAY_SKY = new Color('#FAFAF7')
const SUNSET_SKY = new Color('#f6d7b8')
const TWILIGHT_SKY = new Color('#6f6a98') // no meio do caminho (senão dá cinza)
const NIGHT_SKY = new Color('#23304d')
const DAY_SUN = new Color('#ffffff')
const SUNSET_SUN = new Color('#ffb070')
const MOON = new Color('#9db4ff')
const DAY_AMBIENT = new Color('#ffffff')
const NIGHT_AMBIENT = new Color('#8ea3d6')

export const sky = {
  /** 0 a 1: hora do dia. */
  time: START,
  /** 0 de dia, 1 de noite (com transição). */
  night: 0,
  /** Perto de 1 no nascer e no pôr do sol. */
  dusk: 0,
  /** Altura do sol (−1 a 1). */
  sun: 0,
  background: DAY_SKY.clone(),
  light: DAY_SUN.clone(),
  ambient: DAY_AMBIENT.clone(),
}

export function stepSky(delta: number) {
  sky.time = (sky.time + delta / CYCLE_S) % 1
  // altura do sol: sobe de manhã, desce à tarde; a noite é o trecho mais baixo
  sky.sun = Math.sin(sky.time * Math.PI * 2)
  sky.night = 1 - MathUtils.smoothstep(sky.sun, -0.75, -0.35)
  sky.dusk = (1 - Math.min(1, Math.abs(sky.sun + 0.2) / 0.45)) * (1 - sky.night)
  sky.background.copy(DAY_SKY).lerp(SUNSET_SKY, sky.dusk)
  if (sky.night < 0.5) sky.background.lerp(TWILIGHT_SKY, sky.night * 2)
  else sky.background.copy(TWILIGHT_SKY).lerp(NIGHT_SKY, (sky.night - 0.5) * 2)
  sky.ambient.copy(DAY_AMBIENT).lerp(NIGHT_AMBIENT, sky.night)
  sky.light.copy(DAY_SUN).lerp(SUNSET_SUN, sky.dusk).lerp(MOON, sky.night)
}

/** Sol (ou lua) girando no céu, para as sombras andarem ao longo do dia. */
export function sunDirection(out: { x: number; y: number; z: number }, radius: number) {
  const a = sky.time * Math.PI * 2
  // de dia, o sol; de noite, a lua mais alta e parada perto do meio
  const h = Math.max(0.35, sky.sun)
  out.x = Math.cos(a) * radius * (1 - sky.night) + radius * 0.3 * sky.night
  out.y = h * radius * (1 - sky.night) + radius * 0.8 * sky.night
  out.z = radius * 0.45
}
