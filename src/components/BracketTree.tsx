import type { FencerId } from '../domain/bout'
import { BYE, isFencer, type Bracket, type DeMatch, type Slot } from '../domain/tableau'
import { useI18n } from '../i18n'

interface Props {
  bracket: Bracket
  names: Map<FencerId, string>
  seedOf: (id: FencerId) => number
  statusOf: (id: FencerId) => string | null // «снят» / «искл.»
  onOpen?: (m: DeMatch) => void // нет — только просмотр
}

// Сетка олимпийки горизонтальным деревом: слева первый круг, вправо сужается к финалу.
// Все колонки одной высоты, ячейки делят высоту поровну — поэтому каждый бой
// оказывается ровно посередине между двумя боями, из которых в него пришли.
export function BracketTree({ bracket, names, seedOf, statusOf, onOpen }: Props) {
  const { L } = useI18n()
  const last = bracket.rounds.length - 1

  const side = (m: DeMatch, slot: Slot) => {
    if (slot === BYE) return <div className="tree-side muted">{L.bye}</div>
    if (!slot) return <div className="tree-side muted">{L.tbd}</div>
    const score = m.result ? (m.result.a === slot ? m.result.scoreA : m.result.scoreB) : null
    return (
      <div className={`tree-side ${m.winner === slot ? 'winner' : m.winner ? 'loser' : ''}`}>
        <span className="tag">{seedOf(slot)}</span>
        <span className="tree-name">{names.get(slot)}</span>
        {statusOf(slot) && <span className="badge">{statusOf(slot)}</span>}
        {score !== null && <span className="tree-score">{score}</span>}
      </div>
    )
  }

  const card = (m: DeMatch) => {
    const playable = isFencer(m.a) && isFencer(m.b) && !m.walkover
    return (
      <button
        className={`tree-card ${playable && !m.result ? 'open' : ''}`}
        disabled={!playable || !onOpen}
        onClick={() => onOpen?.(m)}
      >
        {side(m, m.a)}
        {side(m, m.b)}
      </button>
    )
  }

  return (
    <div className="tree-scroll">
      <div className="tree" style={{ ['--first-round' as string]: bracket.rounds[0].length }}>
        {bracket.rounds.map((round, r) => (
          <div key={r} className="tree-col">
            <div className="tree-head">{L.roundName(round.length)}</div>
            <div className="tree-cells">
              {round.map((m, i) => (
                <div key={m.key} className={`tree-cell ${r === last ? 'final' : i % 2 === 0 ? 'upper' : 'lower'}`}>
                  {card(m)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {bracket.bronze && (
        <div className="tree-bronze">
          <div className="tree-head">{L.bronze}</div>
          {card(bracket.bronze)}
        </div>
      )}
    </div>
  )
}
