import type { Fencer, Tournament } from './db'
import type { Dict } from './i18n'
import type { BoutResult, FencerId } from './domain/bout'
import { boutOrder } from './domain/boutOrder'
import { qualify } from './domain/qualify'
import { computeStats, rank, shuffleTies, type RankedStats } from './domain/ranking'
import { buildBracket, isFencer, tableauPlaces, type Bracket } from './domain/tableau'

export function namesOf(t: Tournament): Map<FencerId, string> {
  return new Map(t.fencers.map((f) => [f.id, f.name]))
}

export function fencerOf(t: Tournament, id: FencerId): Fencer | undefined {
  return t.fencers.find((f) => f.id === id)
}

// Снятые во время пулек: их бои аннулируются, как будто они не участвовали.
export function poolRetired(t: Tournament): Set<FencerId> {
  return new Set(t.fencers.filter((f) => f.retired?.stage === 'pools').map((f) => f.id))
}

// Все снятые — в олимпийке проигрывают без боя.
export function allRetired(t: Tournament): Set<FencerId> {
  return new Set(t.fencers.filter((f) => f.retired).map((f) => f.id))
}

export function statusLabel(L: Dict, f: Fencer | undefined): string | null {
  if (!f?.retired) return null
  return { withdrawn: L.statusWithdrawn, absent: L.statusAbsent, excluded: L.statusExcluded }[f.retired.reason]
}

// Дорожка пульки: заданная вручную или по порядку (пулька A — дорожка 1).
export function pisteOf(t: Tournament, poolIndex: number): string {
  return t.pistes[poolIndex]?.trim() || String(poolIndex + 1)
}

export function findBout(bouts: BoutResult[], x: FencerId, y: FencerId): BoutResult | undefined {
  return bouts.find((b) => (b.a === x && b.b === y) || (b.a === y && b.b === x))
}

// Бои пульки в порядке FIE: пары id бойцов.
export function poolSchedule(pool: FencerId[]): Array<[FencerId, FencerId]> {
  return boutOrder(pool.length).map(([a, b]) => [pool[a - 1], pool[b - 1]])
}

function activeBouts(t: Tournament): BoutResult[] {
  const out = poolRetired(t)
  return t.poolBouts.filter((b) => !out.has(b.a) && !out.has(b.b))
}

export function activePool(t: Tournament, pool: FencerId[]): FencerId[] {
  const out = poolRetired(t)
  return pool.filter((id) => !out.has(id))
}

// Засчитанные бои пульки (без аннулированных).
export function poolBouts(t: Tournament, pool: FencerId[]): BoutResult[] {
  const members = new Set(activePool(t, pool))
  return t.poolBouts.filter((b) => members.has(b.a) && members.has(b.b))
}

export function poolRanking(t: Tournament, pool: FencerId[]): RankedStats[] {
  return rank(computeStats(activePool(t, pool), poolBouts(t, pool)))
}

export function poolSize(t: Tournament, pool: FencerId[]): { done: number; total: number } {
  const n = activePool(t, pool).length
  return { done: poolBouts(t, pool).length, total: (n * (n - 1)) / 2 }
}

export function poolProgress(t: Tournament): { done: number; total: number } {
  return t.pools.reduce(
    (acc, p) => {
      const s = poolSize(t, p)
      return { done: acc.done + s.done, total: acc.total + s.total }
    },
    { done: 0, total: 0 },
  )
}

// Общий рейтинг по всем пулькам — по нему посев в олимпийку. Снятые в пульке не ранжируются.
export function overallRanking(t: Tournament): RankedStats[] {
  const out = poolRetired(t)
  return rank(computeStats(t.pools.flat().filter((id) => !out.has(id)), activeBouts(t)))
}

// draw — тянуть жребий среди полностью равных (при формировании олимпийки).
export function qualification(t: Tournament, draw = false) {
  const retired = allRetired(t)
  const ranked = overallRanking(t).filter((r) => !retired.has(r.fencer))
  return qualify(draw ? shuffleTies(ranked) : ranked, t.settings.eliminated)
}

export function bracketOf(t: Tournament): Bracket | null {
  if (!t.tableau) return null
  return buildBracket(t.tableau.seeds, t.tableau.results, t.settings.thirdPlaceBout, allRetired(t))
}

export interface Standing {
  fencer: FencerId
  place: number | null // null — без места (снят в пульке или исключён)
}

// Итоговые места: олимпийка, затем отсеянные после пулек, затем снятые без места.
// Место исключённого в олимпийке остаётся пустым — остальные не сдвигаются.
export function finalStandings(t: Tournament): Standing[] | null {
  const bracket = bracketOf(t)
  if (!bracket || !t.tableau) return null
  const places = tableauPlaces(bracket, t.tableau.seeds)
  if (!places) return null
  const seeds = t.tableau.seeds
  const noPlace = (id: FencerId) => {
    const r = fencerOf(t, id)?.retired
    return r?.reason === 'excluded' || r?.reason === 'absent' || r?.stage === 'pools'
  }
  const list: Standing[] = [...places]
    .filter(([fencer]) => !noPlace(fencer))
    .map(([fencer, place]) => ({ fencer, place }))
    .sort((x, y) => x.place! - y.place! || seeds.indexOf(x.fencer) - seeds.indexOf(y.fencer))
  t.tableau.out.forEach((fencer, i) => list.push({ fencer, place: seeds.length + 1 + i }))
  for (const f of t.fencers) if (f.retired && noPlace(f.id)) list.push({ fencer: f.id, place: null })
  return list
}

export type Stage = 'setup' | 'pools' | 'tableau' | 'finished'

export function stageOf(t: Tournament): Stage {
  if (t.pools.length === 0) return 'setup'
  if (!t.tableau) return 'pools'
  return finalStandings(t) ? 'finished' : 'tableau'
}

export function statusText(t: Tournament, L: Dict): string {
  switch (stageOf(t)) {
    case 'setup':
      return L.statusSetup(t.fencers.length)
    case 'pools': {
      const { done, total } = poolProgress(t)
      return L.statusPools(done, total)
    }
    case 'tableau':
      return L.statusTableau
    case 'finished': {
      const bracket = bracketOf(t)!
      const winner = bracket.rounds[bracket.rounds.length - 1][0].winner
      return isFencer(winner) ? L.statusWinner(namesOf(t).get(winner) ?? '') : L.statusFinished
    }
  }
}
