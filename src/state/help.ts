// Lembra se o visitante já viu a ajuda, para ela só abrir sozinha no 1º acesso.
const HELP_SEEN = 'help-seen'

export function helpSeen() {
  try {
    return localStorage.getItem(HELP_SEEN) === '1'
  } catch {
    return false
  }
}

export function markHelpSeen() {
  try {
    localStorage.setItem(HELP_SEEN, '1')
  } catch {
    // sem storage, a ajuda aparece de novo na próxima visita
  }
}
