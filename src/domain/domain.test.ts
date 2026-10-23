import { describe, expect, it } from 'vitest'
import { cellLabel, firstGroupCard, penaltyTouches, toCards, validateBout, type BoutResult } from './bout'
import { boutOrder } from './boutOrder'
import { splitIntoPools } from './pools'
import { computeStats, rank, shuffleTies } from './ranking'
import { qualify } from './qualify'
import { deTimer } from './timing'
import { BYE, buildBracket, firstRound, seedPositions, tableauPlaces, tableauSize } from './tableau'

describe('boutOrder', () => {
  for (let size = 2; size <= 16; size++) {
    it(`пулька из ${size}: каждая пара ровно один раз`, () => {
      const order = boutOrder(size)
      expect(order).toHaveLength((size * (size - 1)) / 2)
      const keys = order.map(([a, b]) => [Math.min(a, b), Math.max(a, b)].join('-'))
      expect(new Set(keys).size).toBe(keys.length)
      for (const [a, b] of order) {
        expect(a).not.toBe(b)
        for (const x of [a, b]) expect(x >= 1 && x <= size).toBe(true)
      }
    })
  }

  for (let size = 5; size <= 16; size++) {
    it(`пулька из ${size}: никто не фехтует два боя подряд`, () => {
      const order = boutOrder(size)
      for (let i = 1; i < order.length; i++) {
        const prev = order[i - 1]
        for (const x of order[i]) expect(prev).not.toContain(x)
      }
    })
  }
})

describe('bout', () => {
  const bout = (scoreA: number, scoreB: number, winner: string): BoutResult => ({
    a: 'x',
    b: 'y',
    scoreA,
    scoreB,
    winner,
  })

  it('V при победе с лимитом, V2 по времени', () => {
    expect(cellLabel(bout(5, 3, 'x'), 'x', 5)).toBe('V')
    expect(cellLabel(bout(5, 3, 'x'), 'y', 5)).toBe('3')
    expect(cellLabel(bout(2, 1, 'x'), 'x', 5)).toBe('V2')
    expect(cellLabel(bout(4, 4, 'y'), 'y', 5)).toBe('V4')
  })

  it('валидация', () => {
    expect(validateBout(bout(5, 3, 'x'), 5)).toBeNull()
    expect(validateBout(bout(4, 4, 'y'), 5)).toBeNull()
    expect(validateBout(bout(0, 0, 'x'), 5)).toBeNull()
    expect(validateBout(bout(3, 5, 'x'), 5)).not.toBeNull()
    expect(validateBout(bout(6, 1, 'x'), 5)).not.toBeNull()
    expect(validateBout(bout(5, 5, 'x'), 5)).not.toBeNull()
    expect(validateBout(bout(5, 1, 'z'), 5)).not.toBeNull()
  })
})

describe('ranking', () => {
  it('V/M, затем индекс, затем нанесённые; равные делят место', () => {
    const bouts: BoutResult[] = [
      { a: 'A', b: 'B', scoreA: 5, scoreB: 4, winner: 'A' },
      { a: 'B', b: 'C', scoreA: 5, scoreB: 0, winner: 'B' },
      { a: 'C', b: 'A', scoreA: 5, scoreB: 1, winner: 'C' },
    ]
    const stats = computeStats(['A', 'B', 'C'], bouts)
    expect(stats.find((s) => s.fencer === 'A')).toMatchObject({
      victories: 1,
      matches: 2,
      scored: 6,
      received: 9,
      index: -3,
    })
    const ranked = rank(stats)
    expect(ranked.map((r) => [r.fencer, r.place])).toEqual([
      ['B', 1],
      ['C', 2],
      ['A', 3],
    ])

    const tied = rank(computeStats(['P', 'Q'], [{ a: 'P', b: 'Q', scoreA: 0, scoreB: 0, winner: 'P' }]))
    expect(tied[0].place).toBe(1)
    expect(tied[1].place).toBe(2)
    expect(rank(computeStats(['P', 'Q'], [])).map((r) => r.place)).toEqual([1, 1])
  })
})

describe('splitIntoPools', () => {
  it('16 бойцов при максимуме 10 — две пульки по 8 змейкой', () => {
    const seeds = Array.from({ length: 16 }, (_, i) => i + 1)
    const pools = splitIntoPools(seeds, 10)
    expect(pools.map((p) => p.length)).toEqual([8, 8])
    expect(pools[0].slice(0, 4)).toEqual([1, 4, 5, 8])
    expect(pools[1].slice(0, 4)).toEqual([2, 3, 6, 7])
  })

  it('до 10 — одна пулька, 11 — две', () => {
    expect(splitIntoPools(Array.from({ length: 10 }, (_, i) => i), 10)).toHaveLength(1)
    expect(splitIntoPools(Array.from({ length: 11 }, (_, i) => i), 10).map((p) => p.length).sort()).toEqual([5, 6])
  })
})

describe('tableau', () => {
  it('размер сетки и посев', () => {
    expect(tableauSize(5)).toBe(8)
    expect(tableauSize(16)).toBe(16)
    expect(tableauSize(17)).toBe(32)
    expect(seedPositions(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
  })

  it('свободные проходы достаются лучшим по посеву', () => {
    expect(firstRound(6)).toEqual([
      [1, null],
      [4, 5],
      [2, null],
      [3, 6],
    ])
  })
})

describe('bracket', () => {
  const seeds = ['s1', 's2', 's3', 's4', 's5', 's6']
  const win = (a: string, b: string, winner: string): BoutResult => ({
    a,
    b,
    scoreA: winner === a ? 15 : 10,
    scoreB: winner === b ? 15 : 10,
    winner,
  })

  it('6 бойцов: сетка на 8, проходы у 1 и 2, победители идут дальше', () => {
    const b = buildBracket(seeds, {}, false)
    expect(b.rounds.map((r) => r.length)).toEqual([4, 2, 1])
    expect(b.rounds[0].map((m) => [m.a, m.b])).toEqual([
      ['s1', BYE],
      ['s4', 's5'],
      ['s2', BYE],
      ['s3', 's6'],
    ])
    expect(b.rounds[1][0].a).toBe('s1')
    expect(b.rounds[1][0].b).toBeNull()
  })

  it('полная олимпийка без боя за 3-е: полуфиналисты делят 3-е', () => {
    const results = {
      '0-1': win('s4', 's5', 's5'),
      '0-3': win('s3', 's6', 's3'),
      '1-0': win('s1', 's5', 's1'),
      '1-1': win('s2', 's3', 's3'),
      '2-0': win('s1', 's3', 's3'),
    }
    const b = buildBracket(seeds, results, false)
    const places = tableauPlaces(b, seeds)!
    expect(Object.fromEntries(places)).toEqual({ s3: 1, s1: 2, s2: 3, s5: 3, s4: 5, s6: 6 })
  })

  it('бой за 3-е место и устаревшие результаты', () => {
    const results: Record<string, BoutResult> = {
      '0-1': win('s4', 's5', 's5'),
      '0-3': win('s3', 's6', 's3'),
      '1-0': win('s1', 's5', 's1'),
      '1-1': win('s2', 's3', 's3'),
      '2-0': win('s1', 's3', 's3'),
    }
    let b = buildBracket(seeds, results, true)
    expect([b.bronze?.a, b.bronze?.b]).toEqual(['s5', 's2'])
    expect(tableauPlaces(b, seeds)).toBeNull()
    results.bronze = win('s5', 's2', 's2')
    b = buildBracket(seeds, results, true)
    expect(Object.fromEntries(tableauPlaces(b, seeds)!)).toMatchObject({ s2: 3, s5: 4 })

    // Переиграли 1/4: теперь вместо s5 проходит s4 — бой 1-0 и бой за 3-е устарели.
    results['0-1'] = win('s4', 's5', 's4')
    b = buildBracket(seeds, results, true)
    expect(b.used.has('1-0')).toBe(false)
    expect(b.used.has('bronze')).toBe(false)
    expect(b.rounds[1][0].b).toBe('s4')
  })
})

describe('qualify', () => {
  const ranked = rank(computeStats(['a', 'b', 'c', 'd'], []))
  it('по умолчанию проходят все, максимум двое отсеиваются', () => {
    expect(qualify(ranked, 0).seeds).toHaveLength(4)
    expect(qualify(ranked, 2)).toEqual({ seeds: ['a', 'b'], out: ['c', 'd'] })
    expect(qualify(ranked, 5).out).toHaveLength(2)
    expect(qualify(ranked.slice(0, 3), 2).seeds).toHaveLength(2)
  })
})

describe('timing', () => {
  it('сабля — перерыв на 8 из 15, остальное оружие — 3 периода', () => {
    expect(deTimer('sabre', 3, 15)).toEqual({ minutes: 3, periods: 2, breakAt: 8 })
    expect(deTimer('epee', 3, 15)).toEqual({ minutes: 3, periods: 3 })
    expect(deTimer('foil', 3, 15).breakAt).toBeUndefined()
  })
})

describe('shuffleTies', () => {
  it('перемешивает только полностью равных', () => {
    const bouts: BoutResult[] = [
      { a: 'A', b: 'B', scoreA: 5, scoreB: 0, winner: 'A' },
      { a: 'C', b: 'D', scoreA: 5, scoreB: 0, winner: 'C' },
    ]
    const ranked = rank(computeStats(['A', 'B', 'C', 'D'], bouts))
    expect(ranked.map((r) => r.place)).toEqual([1, 1, 3, 3])
    const reversed = shuffleTies(ranked, () => 0).map((r) => r.fencer)
    expect(reversed.slice(0, 2).sort()).toEqual(['A', 'C'])
    expect(reversed.slice(2).sort()).toEqual(['B', 'D'])
    expect(reversed).not.toEqual(ranked.map((r) => r.fencer))
  })
})

describe('cards', () => {
  it('по FIE: первая жёлтая — предупреждение, дальше красные, каждая красная — укол', () => {
    expect(penaltyTouches(['yellow'])).toBe(0)
    expect(firstGroupCard([])).toBe('yellow')
    expect(firstGroupCard(['yellow'])).toBe('red')
    expect(firstGroupCard(['red'])).toBe('yellow')
    expect(penaltyTouches(['yellow', 'red', 'red'])).toBe(2)
    expect(penaltyTouches(['yellow', 'yellow'])).toBe(1)
    expect(toCards({ yellow: 1, red: 2 })).toEqual(['yellow', 'red', 'red'])
  })
})
