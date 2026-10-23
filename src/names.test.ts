import { describe, expect, it } from 'vitest'
import { cleanName, splitDuplicates } from './names'

describe('names', () => {
  it('убирает лишние пробелы', () => {
    expect(cleanName('  Иванов   Алексей ')).toBe('Иванов Алексей')
  })

  it('не пускает повторы без учёта регистра и пробелов', () => {
    expect(splitDuplicates(['Максим'], [' максим ', 'Максим Р.', 'Максим р.', 'Олег'])).toEqual({
      ok: ['Максим Р.', 'Олег'],
      duplicates: ['максим', 'Максим р.'],
    })
  })
})
