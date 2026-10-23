import type { Weapon } from '../db'

// Сабля: в олимпийке перерыв не по времени, а когда один из бойцов набрал половину уколов (8 из 15).
export function sabreBreakAt(deTouches: number): number {
  return Math.ceil(deTouches / 2)
}

export interface TimerConfig {
  minutes: number
  periods: number
  breakAt?: number // перерыв по счёту (сабля)
}

// Бой в пульке — один период; олимпийка: шпага и рапира — 3 периода по времени, сабля — 2 периода с перерывом на 8.
export function deTimer(weapon: Weapon, minutes: number, deTouches: number): TimerConfig {
  return weapon === 'sabre' ? { minutes, periods: 2, breakAt: sabreBreakAt(deTouches) } : { minutes, periods: 3 }
}
