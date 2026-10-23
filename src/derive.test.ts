import { describe, expect, it } from 'vitest'
import { normalize, type Tournament } from './db'
import { finalStandings, overallRanking, pisteOf, poolProgress, qualification } from './derive'
import { buildBracket } from './domain/tableau'

function pool4(): Tournament {
  const t = normalize({ id: 't', name: 'T' })
  t.fencers = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id.toUpperCase() }))
  t.pools = [['a', 'b', 'c', 'd']]
  const w = (a: string, b: string, winner: string, ls = 2) => ({
    a,
    b,
    scoreA: winner === a ? 5 : ls,
    scoreB: winner === b ? 5 : ls,
    winner,
  })
  t.poolBouts = [w('a', 'b', 'a'), w('a', 'c', 'a'), w('a', 'd', 'd', 0), w('b', 'c', 'b'), w('b', 'd', 'b'), w('c', 'd', 'c')]
  return t
}

describe('снятие бойца', () => {
  it('в пульке — его бои аннулируются, соперники пересчитываются', () => {
    const t = pool4()
    t.fencers[3].retired = { reason: 'withdrawn', stage: 'pools' }
    expect(poolProgress(t)).toEqual({ done: 3, total: 3 })
    const ranking = overallRanking(t)
    expect(ranking.map((r) => r.fencer)).toEqual(['a', 'b', 'c'])
    // у A больше нет поражения от D
    expect(ranking[0]).toMatchObject({ victories: 2, matches: 2, ratio: 1 })
    expect(qualification(t).seeds).toEqual(['a', 'b', 'c'])
  })

  it('в олимпийке — соперник проходит без боя, исключённый без места', () => {
    const seeds = ['s1', 's2', 's3', 's4']
    const b = buildBracket(seeds, {}, false, new Set(['s4']))
    expect(b.rounds[0][0]).toMatchObject({ a: 's1', b: 's4', winner: 's1', loser: 's4', walkover: true })
    expect(b.rounds[1][0].a).toBe('s1')

    const t = pool4()
    t.tableau = {
      seeds: ['a', 'b', 'c', 'd'],
      out: [],
      results: {
        '0-1': { a: 'b', b: 'c', scoreA: 15, scoreB: 9, winner: 'b' },
        '1-0': { a: 'a', b: 'b', scoreA: 15, scoreB: 10, winner: 'a' },
      },
    }
    t.fencers[3].retired = { reason: 'excluded', stage: 'tableau' }
    const standings = finalStandings(t)!
    expect(standings).toEqual([
      { fencer: 'a', place: 1 },
      { fencer: 'b', place: 2 },
      { fencer: 'c', place: 3 },
      { fencer: 'd', place: null },
    ])
  })
})

describe('дорожки', () => {
  it('по умолчанию по порядку, можно задать свою', () => {
    const t = pool4()
    t.pools = [['a', 'b'], ['c', 'd']]
    expect([pisteOf(t, 0), pisteOf(t, 1)]).toEqual(['1', '2'])
    t.pistes = ['', ' 5 ']
    expect([pisteOf(t, 0), pisteOf(t, 1)]).toEqual(['1', '5'])
  })
})
