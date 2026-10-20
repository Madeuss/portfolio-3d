import { Vector3 } from 'three'

// Posição e velocidade do personagem no mundo (Player) e do pé direito
// (Character), atualizadas a cada quadro. Objetos que reagem a ele por perto (a bola) leem daqui sem passar
// pela store, que re-renderizaria a cada quadro.
export const player = { pos: new Vector3(), vel: new Vector3(), foot: new Vector3() }

// Grupo de colisão do personagem: a bola pode deixar de enxergá-lo por um
// instante (na bicicleta ela sai de dentro do corpo dele).
export const PLAYER_GROUP = 3

// Posição da bola do campinho, atualizada pela própria bola (Soccer).
export const ball = { pos: new Vector3() }
