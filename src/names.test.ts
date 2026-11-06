import { describe, expect, it } from 'vitest'
import { cleanName, parseEntry, splitDuplicates } from './names'

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

  it('разбирает «Имя, Клуб»', () => {
    expect(parseEntry('Иванов Алексей, Динамо')).toEqual({ name: 'Иванов Алексей', club: 'Динамо' })
    expect(parseEntry('Петров Борис;  ЦСКА ')).toEqual({ name: 'Петров Борис', club: 'ЦСКА' })
    expect(parseEntry('  Сидоров   Виктор ')).toEqual({ name: 'Сидоров Виктор' })
  })
})
