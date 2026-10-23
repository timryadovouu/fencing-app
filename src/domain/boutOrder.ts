// Очерёдность боёв в пульке. Номера — позиции бойцов в протоколе (с 1).
// Таблицы для пулек 4–10 — стандартная очерёдность FIE: никто не фехтует два боя подряд
// (насколько это возможно для размера пульки).
export type Pair = readonly [number, number]

const FIE_ORDER: Record<number, string> = {
  4: '1-4 2-3 1-3 2-4 3-4 1-2',
  5: '1-2 3-4 5-1 2-3 5-4 1-3 2-5 4-1 3-5 4-2',
  6: '1-2 4-5 2-3 5-6 3-1 6-4 2-5 1-4 5-3 1-6 4-2 3-6 5-1 3-4 6-2',
  7: '1-4 2-5 3-6 7-1 5-4 2-3 6-7 5-1 4-3 6-2 5-7 3-1 4-6 7-2 3-5 1-6 2-4 7-3 6-5 1-2 4-7',
  8: '2-3 1-5 7-4 6-8 1-2 3-4 5-6 8-7 4-1 5-2 8-3 6-7 4-2 8-1 7-5 3-6 2-8 5-4 6-1 3-7 4-8 2-6 3-5 1-7 4-6 8-5 7-2 1-3',
  9: '1-9 2-8 3-7 4-6 1-5 2-9 8-3 7-4 6-5 1-2 9-3 8-4 7-5 6-1 3-2 9-4 5-8 7-6 3-1 2-4 5-9 8-6 7-1 4-3 5-2 6-9 8-7 4-1 5-3 6-2 9-7 1-8 4-5 3-6 2-7 9-8',
  10: '1-4 6-9 2-5 7-10 3-1 8-6 4-5 9-10 2-3 7-8 5-1 10-6 4-2 9-7 5-3 10-8 1-2 6-7 3-4 8-9 5-10 1-6 2-7 3-8 4-9 6-5 10-2 8-1 7-4 9-3 2-6 5-8 4-10 1-9 3-7 8-2 6-4 9-5 10-3 7-1 4-8 2-9 3-6 5-7 1-10',
}

function parse(table: string): Pair[] {
  return table.split(' ').map((p) => {
    const [a, b] = p.split('-').map(Number)
    return [a, b] as const
  })
}

// Круговая система (метод «карусели») — для размеров, которых нет в таблице FIE (3, 11–16).
// Для 11–16 тоже без боёв подряд (проверено тестом); в пульке из 3 это невозможно.
function roundRobin(size: number): Pair[] {
  const slots = Array.from({ length: size % 2 === 0 ? size : size + 1 }, (_, i) => i + 1)
  const n = slots.length
  const pairs: Pair[] = []
  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      const a = slots[i]
      const b = slots[n - 1 - i]
      if (a <= size && b <= size) pairs.push([a, b])
    }
    slots.splice(1, 0, slots.pop()!)
  }
  return pairs
}

export function boutOrder(size: number): Pair[] {
  if (size < 2) return []
  const table = FIE_ORDER[size]
  return table ? parse(table) : roundRobin(size)
}
