export type FencerId = string

// Завершённый бой. Победитель хранится отдельно от счёта: в шпаге при равном счёте
// по истечении времени фехтуют дополнительную минуту с приоритетом.
export type Card = 'yellow' | 'red'

// FIE t.170: 1-я группа — первое нарушение жёлтая, каждое следующее — красная;
// 2-я группа — сразу красная; каждая красная — укол сопернику. Жёлтая в бою может быть только одна
// (лишние жёлтые из старых записей считаем красными).
export function penaltyTouches(cards: Card[]): number {
  const yellows = cards.filter((c) => c === 'yellow').length
  return cards.filter((c) => c === 'red').length + Math.max(0, yellows - 1)
}

// Нарушение 1-й группы: если жёлтая в этом бою уже была — теперь красная.
export function firstGroupCard(cards: Card[]): Card {
  return cards.includes('yellow') ? 'red' : 'yellow'
}

// Карточки в порядке выдачи; старый формат {yellow, red} переводим в список.
export function toCards(value: unknown): Card[] {
  if (Array.isArray(value)) return value.filter((c): c is Card => c === 'yellow' || c === 'red')
  if (value && typeof value === 'object') {
    const { yellow = 0, red = 0 } = value as { yellow?: number; red?: number }
    return [...Array<Card>(yellow).fill('yellow'), ...Array<Card>(red).fill('red')]
  }
  return []
}

export interface BoutResult {
  a: FencerId
  b: FencerId
  scoreA: number
  scoreB: number
  winner: FencerId
  cards?: { a?: Card[]; b?: Card[] }
}

export function scoreOf(bout: BoutResult, fencer: FencerId): number {
  return fencer === bout.a ? bout.scoreA : bout.scoreB
}

export function opponentScore(bout: BoutResult, fencer: FencerId): number {
  return fencer === bout.a ? bout.scoreB : bout.scoreA
}

export type BoutError = 'noWinner' | 'badScore' | 'overLimit' | 'bothLimit' | 'winnerLess' | 'loserLimit'

// Возвращает код ошибки или null, если результат корректен.
export function validateBout(bout: BoutResult, touches: number): BoutError | null {
  const { scoreA, scoreB, winner } = bout
  if (winner !== bout.a && winner !== bout.b) return 'noWinner'
  for (const s of [scoreA, scoreB]) {
    if (!Number.isInteger(s) || s < 0) return 'badScore'
    if (s > touches) return 'overLimit'
  }
  if (scoreA === touches && scoreB === touches) return 'bothLimit'
  const winnerScore = scoreOf(bout, winner)
  const loserScore = opponentScore(bout, winner)
  if (winnerScore < loserScore) return 'winnerLess'
  if (loserScore === touches) return 'loserLimit'
  return null
}

// Что пишется в клетке протокола для бойца: «V» — победа с лимитом уколов,
// «V2» — победа по времени с двумя уколами, «3» — поражение с тремя нанесёнными.
export function cellLabel(bout: BoutResult, fencer: FencerId, touches: number): string {
  const score = scoreOf(bout, fencer)
  if (bout.winner !== fencer) return String(score)
  return score === touches ? 'V' : `V${score}`
}
