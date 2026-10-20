import { useI18n } from '../i18n'
import { useGame } from '../state/game'

// "GOL!" grande no meio da tela a cada gol no campinho. A `key` muda a cada
// gol, o que recria o elemento e reinicia a animação do CSS.
export default function GoalToast() {
  const goal = useGame((s) => s.goal)
  const text = useI18n((s) => s.t.soccer.goal)
  if (!goal) return null
  return (
    <div key={goal.id} className="goal-toast" role="status">
      {text}
    </div>
  )
}
