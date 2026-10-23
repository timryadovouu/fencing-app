import { useState } from 'react'
import { firstGroupCard, penaltyTouches, toCards, validateBout, type BoutResult, type Card, type FencerId } from '../domain/bout'
import type { TimerConfig } from '../domain/timing'
import { useI18n } from '../i18n'
import { Sheet } from './controls'
import { Timer } from './Timer'

export interface Side {
  id: FencerId
  name: string
  tag: string // номер в протоколе или посев
}

interface Props {
  title: string
  left: Side
  right: Side
  touches: number
  initial?: BoutResult
  timer: TimerConfig | null
  onSave: (result: BoutResult) => void
  onClear?: () => void
  onBlackCard?: (fencer: FencerId) => void // чёрная карточка — исключение из турнира
  onClose: () => void
}

export function BoutEditor({ title, left, right, touches, initial, timer, onSave, onClear, onBlackCard, onClose }: Props) {
  const { L } = useI18n()
  const flipped = initial?.a === right.id
  const [scoreL, setScoreLRaw] = useState(initial ? (flipped ? initial.scoreB : initial.scoreA) : 0)
  const [scoreR, setScoreRRaw] = useState(initial ? (flipped ? initial.scoreA : initial.scoreB) : 0)
  const [cardsL, setCardsL] = useState<Card[]>(() => toCards(flipped ? initial?.cards?.b : initial?.cards?.a))
  const [cardsR, setCardsR] = useState<Card[]>(() => toCards(flipped ? initial?.cards?.a : initial?.cards?.b))
  const [priority, setPriority] = useState<FencerId | null>(
    initial && initial.scoreA === initial.scoreB ? initial.winner : null,
  )
  const [askPriority, setAskPriority] = useState(false)

  // Любое изменение счёта сбрасывает выбор приоритета — иначе старый выбор тихо решит следующую ничью.
  const scoreSetter = (set: (v: number) => void) => (v: number) => {
    set(v)
    setPriority(null)
    setAskPriority(false)
  }
  const setScoreL = scoreSetter(setScoreLRaw)
  const setScoreR = scoreSetter(setScoreRRaw)

  const tie = scoreL === scoreR && scoreL < touches
  let winner: FencerId | null
  if (scoreL === touches) winner = left.id
  else if (scoreR === touches) winner = right.id
  else if (!tie) winner = scoreL > scoreR ? left.id : right.id
  else winner = priority

  const cards =
    cardsL.length || cardsR.length
      ? { a: cardsL.length ? cardsL : undefined, b: cardsR.length ? cardsR : undefined }
      : undefined
  const result: BoutResult | null = winner
    ? { a: left.id, b: right.id, scoreA: scoreL, scoreB: scoreR, winner, ...(cards && { cards }) }
    : null
  const error = result ? validateBout(result, touches) : null

  const save = () => {
    if (tie && !priority) return setAskPriority(true)
    if (result && !error) onSave(result)
  }

  // Карточки: разница штрафных уколов уходит сопернику (вторая жёлтая и каждая красная — +1).
  const side = (
    s: Side,
    score: number,
    setScore: (v: number) => void,
    c: Card[],
    setC: (v: Card[]) => void,
    opponent: number,
    setOpponent: (v: number) => void,
  ) => {
    const changeCards = (next: Card[]) => {
      const delta = penaltyTouches(next) - penaltyTouches(c)
      setC(next)
      if (delta) setOpponent(Math.max(0, Math.min(touches, opponent + delta)))
    }
    return (
      <div className={`score-side ${winner === s.id ? 'winning' : ''}`}>
        <div className="score-name">
          <span className="tag">{s.tag}</span> {s.name}
        </div>
        {c.length > 0 && (
          <div className="card-marks" aria-label={L.cards}>
            {c.map((card, i) => (
              <span key={i} className={`mark ${card}`} title={card === 'yellow' ? L.yellow : L.red} />
            ))}
          </div>
        )}
        <div className="score-value">{score}</div>
        <div className="score-buttons">
          <button aria-label={L.minusTouch(s.name)} disabled={score <= 0} onClick={() => setScore(score - 1)}>
            −
          </button>
          <button aria-label={L.plusTouch(s.name)} disabled={score >= touches} onClick={() => setScore(score + 1)}>
            +
          </button>
        </div>
        <div className="card-row">
          {/* Жёлтая = нарушение 1-й группы: после уже выданной жёлтой автоматически становится красной. */}
          <button className="card-btn yellow" aria-label={L.yellow} onClick={() => changeCards([...c, firstGroupCard(c)])} />
          <button className="card-btn red" aria-label={L.red} onClick={() => changeCards([...c, 'red'])} />
          {onBlackCard && (
            <button
              className="card-btn black"
              aria-label={L.black}
              onClick={() => confirm(L.blackAsk(s.name)) && onBlackCard(s.id)}
            />
          )}
          <button
            className="card-undo"
            aria-label={L.undoCard}
            title={L.undoCard}
            disabled={c.length === 0}
            onClick={() => changeCards(c.slice(0, -1))}
          >
            ↶
          </button>
        </div>
      </div>
    )
  }

  const message = askPriority && tie && !priority ? L.choosePriority : error ? L.errors[error](touches) : null

  return (
    <Sheet title={title} onClose={onClose}>
      {timer && <Timer {...timer} maxScore={Math.max(scoreL, scoreR)} />}

      <div className="score-board">
        {side(left, scoreL, setScoreL, cardsL, setCardsL, scoreR, setScoreR)}
        <div className="score-colon">:</div>
        {side(right, scoreR, setScoreR, cardsR, setCardsR, scoreL, setScoreL)}
      </div>
      <p className="hint">
        {L.boutTo(touches)} · {L.redHint}
      </p>

      {/* Плашка всегда на месте (неактивна при неравном счёте), чтобы окно не прыгало. */}
      <div className={`priority ${tie ? '' : 'inactive'} ${askPriority && tie && !priority ? 'attention' : ''}`}>
        <div className="priority-label">{L.priority}</div>
        <div className="segmented">
          {[left, right].map((s) => (
            <button
              key={s.id}
              className={tie && priority === s.id ? 'active' : ''}
              disabled={!tie}
              onClick={() => {
                setPriority(s.id)
                setAskPriority(false)
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <p className="error reserve" role={message ? 'alert' : undefined}>
        {message ?? ' '}
      </p>

      <div className="sheet-actions">
        <button className="primary" disabled={!!error || (!result && !tie)} onClick={save}>
          {L.save}
        </button>
        {initial && onClear && (
          <button className="danger-link" onClick={onClear}>
            {L.clearResult}
          </button>
        )}
      </div>
    </Sheet>
  )
}
