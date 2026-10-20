import { Vector3 } from 'three'

// Posição e velocidade do personagem no mundo, atualizadas a cada quadro pelo
// Player. Objetos que reagem a ele por perto (a bola) leem daqui sem passar
// pela store, que re-renderizaria a cada quadro.
export const player = { pos: new Vector3(), vel: new Vector3() }

// Posição da bola do campinho, atualizada pela própria bola (Soccer).
export const ball = { pos: new Vector3() }
