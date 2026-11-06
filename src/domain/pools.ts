// Деление бойцов на пульки «змейкой» по посеву: 1-й в пульку A, 2-й в B, …,
// затем в обратном порядке, чтобы сильнейшие оказались в разных пульках.
// Если указан клуб, одноклубники встречаются, только когда этого не избежать: бойцы меняются
// местами только внутри своего ряда посева, так что баланс сил между пульками сохраняется.
export function splitIntoPools<T>(seeded: T[], maxPoolSize: number, clubOf?: (item: T) => string | undefined): T[][] {
  if (seeded.length === 0) return []
  const count = Math.ceil(seeded.length / maxPoolSize)
  const plain = snakeSplit(seeded, count)
  if (!clubOf || !seeded.some((x) => clubOf(x)?.trim())) return plain

  const club = (item: T) => clubOf(item)?.trim().toLocaleLowerCase() || null
  const row = new Map(seeded.map((x, i) => [x, Math.floor(i / count)]))
  const candidates = [improve(plain, club, row), improve(regretSplit(seeded, count, club), club, row)]
  // При равенстве — вариант, ближе всего к обычной «змейке».
  return clubClashes(candidates[1], clubOf) < clubClashes(candidates[0], clubOf) ? candidates[1] : candidates[0]
}

function snakeSplit<T>(seeded: T[], count: number): T[][] {
  const pools: T[][] = Array.from({ length: count }, () => [])
  seeded.forEach((item, i) => {
    const r = Math.floor(i / count)
    const col = i % count
    pools[r % 2 === 0 ? col : count - 1 - col].push(item)
  })
  return pools
}

// Ряд за рядом: каждая пулька получает по одному бойцу ряда; первым ставится тот,
// кому выбор важнее всего (больше разница между лучшей и следующей пулькой).
function regretSplit<T>(seeded: T[], count: number, club: (item: T) => string | null): T[][] {
  const pools: T[][] = Array.from({ length: count }, () => [])
  const clashes = (pool: T[], item: T) => {
    const c = club(item)
    return c ? pool.filter((x) => club(x) === c).length : 0
  }
  for (let start = 0, r = 0; start < seeded.length; start += count, r++) {
    const snake = Array.from({ length: count }, (_, i) => (r % 2 === 0 ? i : count - 1 - i))
    const items = seeded.slice(start, start + count)
    const free = snake.slice(0, items.length)
    while (items.length) {
      const regret = (item: T) => {
        const c = free.map((p) => clashes(pools[p], item)).sort((x, y) => x - y)
        return c.length > 1 ? c[1] - c[0] : 0
      }
      let pick = 0
      for (let k = 1; k < items.length; k++) if (regret(items[k]) > regret(items[pick])) pick = k
      const item = items.splice(pick, 1)[0]
      let best = 0
      for (let k = 1; k < free.length; k++) if (clashes(pools[free[k]], item) < clashes(pools[free[best]], item)) best = k
      pools[free[best]].push(item)
      free.splice(best, 1)
    }
  }
  return pools
}

// Доводка: меняем местами бойцов одного ряда из разных пулек, пока это уменьшает число встреч.
function improve<T>(input: T[][], club: (item: T) => string | null, row: Map<T, number>): T[][] {
  const pools = input.map((p) => [...p])
  const pairs = (pool: T[]) => {
    const counts = new Map<string, number>()
    for (const x of pool) {
      const c = club(x)
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    let n = 0
    for (const k of counts.values()) n += (k * (k - 1)) / 2
    return n
  }
  for (let changed = true; changed; ) {
    changed = false
    for (let i = 0; i < pools.length; i++)
      for (let j = i + 1; j < pools.length; j++)
        for (let a = 0; a < pools[i].length; a++)
          for (let b = 0; b < pools[j].length; b++) {
            const x = pools[i][a]
            const y = pools[j][b]
            if (row.get(x) !== row.get(y) || club(x) === club(y)) continue
            const before = pairs(pools[i]) + pairs(pools[j])
            pools[i][a] = y
            pools[j][b] = x
            if (pairs(pools[i]) + pairs(pools[j]) < before) changed = true
            else {
              pools[i][a] = x
              pools[j][b] = y
            }
          }
  }
  return pools
}

// Сколько пар одноклубников оказалось в одной пульке.
export function clubClashes<T>(pools: T[][], clubOf: (item: T) => string | undefined): number {
  let n = 0
  for (const pool of pools) {
    const counts = new Map<string, number>()
    for (const x of pool) {
      const c = clubOf(x)?.trim().toLocaleLowerCase()
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    for (const k of counts.values()) n += (k * (k - 1)) / 2
  }
  return n
}

export function poolName(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

export const MIN_POOL_SIZE = 2
export const MAX_POOL_SIZE = 16

// Можно ли перенести бойца в пульку target: в исходной должно остаться хотя бы двое,
// а целевая не должна выйти за предел, для которого есть очерёдность боёв.
export function canMove<T>(pools: T[][], item: T, target: number): boolean {
  const from = pools.findIndex((p) => p.includes(item))
  if (from < 0 || from === target || !pools[target]) return false
  return pools[from].length > MIN_POOL_SIZE && pools[target].length < MAX_POOL_SIZE
}

// Ручная перестановка до первого боя: боец уходит в конец целевой пульки.
export function moveToPool<T>(pools: T[][], item: T, target: number): T[][] {
  if (!canMove(pools, item, target)) return pools
  return pools.map((p, i) => (i === target ? [...p.filter((x) => x !== item), item] : p.filter((x) => x !== item)))
}
