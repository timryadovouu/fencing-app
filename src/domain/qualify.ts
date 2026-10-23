import type { FencerId } from './bout'
import type { RankedStats } from './ranking'

export const MAX_ELIMINATED = 2

// Последние `eliminated` бойцов общего рейтинга пулек не выходят в олимпийку
// (в сетке остаются минимум двое).
export function qualify(ranked: RankedStats[], eliminated: number): { seeds: FencerId[]; out: FencerId[] } {
  const cut = Math.max(0, Math.min(eliminated, MAX_ELIMINATED, ranked.length - 2))
  const ids = ranked.map((r) => r.fencer)
  return { seeds: ids.slice(0, ids.length - cut), out: ids.slice(ids.length - cut) }
}
