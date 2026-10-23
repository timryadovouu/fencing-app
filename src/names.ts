// Имена бойцов: лишние пробелы убираем, сравниваем без учёта регистра — «Максим» и « максим » одно и то же.
export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function nameKey(name: string): string {
  return cleanName(name).toLocaleLowerCase()
}

// Делит новые имена на те, что можно добавить, и повторы (с уже существующими или между собой).
export function splitDuplicates(existing: string[], incoming: string[]): { ok: string[]; duplicates: string[] } {
  const seen = new Set(existing.map(nameKey))
  const ok: string[] = []
  const duplicates: string[] = []
  for (const raw of incoming) {
    const name = cleanName(raw)
    if (!name) continue
    if (seen.has(nameKey(name))) duplicates.push(name)
    else {
      seen.add(nameKey(name))
      ok.push(name)
    }
  }
  return { ok, duplicates }
}
