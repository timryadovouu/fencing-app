// Деление бойцов на пульки «змейкой» по посеву: 1-й в пульку A, 2-й в B, …,
// затем в обратном порядке, чтобы сильнейшие оказались в разных пульках.
export function splitIntoPools<T>(seeded: T[], maxPoolSize: number): T[][] {
  if (seeded.length === 0) return []
  const count = Math.ceil(seeded.length / maxPoolSize)
  const pools: T[][] = Array.from({ length: count }, () => [])
  seeded.forEach((item, i) => {
    const row = Math.floor(i / count)
    const col = i % count
    pools[row % 2 === 0 ? col : count - 1 - col].push(item)
  })
  return pools
}

export function poolName(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}
