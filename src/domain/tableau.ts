import type { BoutResult, FencerId } from './bout'

// Сетка олимпийки: размер — ближайшая степень двойки, пары по посеву 1–16, 8–9, …
export function tableauSize(fencers: number): number {
  let size = 2
  while (size < fencers) size *= 2
  return size
}

// Номера посева в порядке позиций сетки сверху вниз: для 8 → 1 8 4 5 2 7 3 6.
// Соседние позиции образуют пару первого круга; сеяные 1 и 2 встречаются только в финале.
export function seedPositions(size: number): number[] {
  let seeds = [1]
  while (seeds.length < size) {
    const n = seeds.length * 2
    seeds = seeds.flatMap((s) => [s, n + 1 - s])
  }
  return seeds
}

// Пары первого круга; null — свободный проход (посев больше числа бойцов).
export function firstRound(fencers: number): Array<[number, number | null]> {
  const positions = seedPositions(tableauSize(fencers))
  const pairs: Array<[number, number | null]> = []
  for (let i = 0; i < positions.length; i += 2) {
    const [x, y] = [positions[i], positions[i + 1]]
    pairs.push(y > fencers ? [x, null] : [x, y])
  }
  return pairs
}

export const BYE = 'BYE'
// Участник в ячейке сетки: боец, свободный проход или ещё не определён (null).
export type Slot = FencerId | typeof BYE | null

export interface DeMatch {
  key: string // `${круг}-${номер}` или 'bronze'
  round: number
  index: number
  a: Slot
  b: Slot
  result?: BoutResult
  winner: Slot
  loser: FencerId | null
  walkover?: boolean // соперник снят — проход без боя
}

export interface Bracket {
  rounds: DeMatch[][]
  bronze: DeMatch | null
  used: Set<string> // ключи результатов, которые попали в сетку; остальные устарели
}

export function isFencer(slot: Slot): slot is FencerId {
  return slot !== null && slot !== BYE
}

function resolve(
  key: string,
  round: number,
  index: number,
  a: Slot,
  b: Slot,
  results: Record<string, BoutResult>,
  used: Set<string>,
  retired: Set<FencerId>,
): DeMatch {
  const m: DeMatch = { key, round, index, a, b, winner: null, loser: null }
  if (a === BYE) m.winner = b
  else if (b === BYE) m.winner = a
  else if (isFencer(a) && isFencer(b)) {
    const r = results[key]
    // Результат засчитывается, только если в нём те же бойцы (после правки
    // предыдущего круга соперник мог смениться).
    if (r && ((r.a === a && r.b === b) || (r.a === b && r.b === a))) {
      used.add(key)
      m.result = r
      m.winner = r.winner
      m.loser = r.winner === a ? b : a
    } else if (retired.has(a) || retired.has(b)) {
      // Бой не состоялся: снятый боец проигрывает без боя.
      m.walkover = true
      m.winner = retired.has(a) ? b : a
      m.loser = m.winner === a ? b : a
    }
  }
  return m
}

// seeds — бойцы в порядке посева после пулек; retired — снятые с турнира.
export function buildBracket(
  seeds: FencerId[],
  results: Record<string, BoutResult>,
  thirdPlace: boolean,
  retired: Set<FencerId> = new Set(),
): Bracket {
  const used = new Set<string>()
  let slots: Slot[] = seedPositions(tableauSize(seeds.length)).map((s) =>
    s <= seeds.length ? seeds[s - 1] : BYE,
  )
  const rounds: DeMatch[][] = []
  for (let round = 0; slots.length > 1; round++) {
    const matches: DeMatch[] = []
    for (let i = 0; i < slots.length; i += 2) {
      matches.push(resolve(`${round}-${i / 2}`, round, i / 2, slots[i], slots[i + 1], results, used, retired))
    }
    rounds.push(matches)
    slots = matches.map((m) => m.winner)
  }

  let bronze: DeMatch | null = null
  if (thirdPlace && rounds.length >= 2) {
    const semis = rounds[rounds.length - 2]
    // Если в полуфинале был свободный проход, второго проигравшего нет — бой не нужен.
    if (semis.every((m) => m.a !== BYE && m.b !== BYE)) {
      bronze = resolve('bronze', rounds.length - 1, 1, semis[0].loser, semis[1].loser, results, used, retired)
    }
  }
  return { rounds, bronze, used }
}

// Места по итогам олимпийки; null — олимпийка ещё не завершена.
// Проигравшие в одном круге ранжируются по посеву, полуфиналисты без боя за 3-е делят 3-е место.
export function tableauPlaces(bracket: Bracket, seeds: FencerId[]): Map<FencerId, number> | null {
  const { rounds, bronze } = bracket
  const final = rounds[rounds.length - 1][0]
  if (!isFencer(final.winner)) return null
  if (bronze && !bronze.winner) return null

  const places = new Map<FencerId, number>()
  places.set(final.winner, 1)
  if (final.loser) places.set(final.loser, 2)
  const bySeed = (x: FencerId, y: FencerId) => seeds.indexOf(x) - seeds.indexOf(y)

  for (let r = rounds.length - 2; r >= 0; r--) {
    const losers = rounds[r].flatMap((m) => (m.loser ? [m.loser] : [])).sort(bySeed)
    if (r === rounds.length - 2) {
      if (bronze && isFencer(bronze.winner)) {
        places.set(bronze.winner, 3)
        if (bronze.loser) places.set(bronze.loser, 4)
      } else {
        for (const f of losers) places.set(f, 3)
      }
      continue
    }
    losers.forEach((f, i) => places.set(f, rounds[r].length + 1 + i))
  }
  return places
}
