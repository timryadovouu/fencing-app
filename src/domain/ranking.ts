import { opponentScore, scoreOf, type BoutResult, type FencerId } from './bout'

export interface FencerStats {
  fencer: FencerId
  victories: number // V
  matches: number // M — проведённые бои
  ratio: number // V/M
  scored: number // НН (TS) — нанесённые уколы
  received: number // П (TR) — пропущенные уколы
  index: number // Инд = НН − П
}

export interface RankedStats extends FencerStats {
  place: number
}

export function computeStats(fencers: FencerId[], bouts: BoutResult[]): FencerStats[] {
  return fencers.map((fencer) => {
    const own = bouts.filter((b) => b.a === fencer || b.b === fencer)
    const victories = own.filter((b) => b.winner === fencer).length
    const scored = own.reduce((sum, b) => sum + scoreOf(b, fencer), 0)
    const received = own.reduce((sum, b) => sum + opponentScore(b, fencer), 0)
    return {
      fencer,
      victories,
      matches: own.length,
      ratio: own.length ? victories / own.length : 0,
      scored,
      received,
      index: scored - received,
    }
  })
}

// Порядок FIE: V/M, затем индекс, затем нанесённые уколы.
export function compareStats(x: FencerStats, y: FencerStats): number {
  return y.ratio - x.ratio || y.index - x.index || y.scored - x.scored
}

// Бойцы с полностью равными показателями делят место (дальше — жребий или барраж).
export function rank(stats: FencerStats[]): RankedStats[] {
  const sorted = [...stats].sort(compareStats)
  return sorted.map((s, i) => {
    let place = i + 1
    for (let j = i - 1; j >= 0 && compareStats(sorted[j], s) === 0; j--) place = j + 1
    return { ...s, place }
  })
}

// Жребий: бойцы с полностью равными показателями (одно место) встают в случайном порядке.
export function shuffleTies(ranked: RankedStats[], random: () => number = Math.random): RankedStats[] {
  const out: RankedStats[] = []
  for (let i = 0; i < ranked.length; ) {
    let j = i
    while (j < ranked.length && ranked[j].place === ranked[i].place) j++
    const group = ranked.slice(i, j)
    for (let k = group.length - 1; k > 0; k--) {
      const r = Math.floor(random() * (k + 1))
      ;[group[k], group[r]] = [group[r], group[k]]
    }
    out.push(...group)
    i = j
  }
  return out
}
