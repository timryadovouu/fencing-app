import { Dexie, type EntityTable } from 'dexie'
import type { BoutResult, FencerId } from './domain/bout'

export const weapons = ['epee', 'foil', 'sabre'] as const
export type Weapon = (typeof weapons)[number]

export interface TournamentSettings {
  weapon: Weapon
  touches: number // уколов до победы в пульке
  maxPoolSize: number // больше бойцов — делим на несколько пулек
  deTouches: number // уколов до победы в олимпийке
  eliminated: number // сколько последних по итогам пулек не выходят в олимпийку (0–2)
  thirdPlaceBout: boolean
  timerEnabled: boolean
  boutMinutes: number
}

export const defaultSettings: TournamentSettings = {
  weapon: 'epee',
  touches: 5,
  maxPoolSize: 10,
  deTouches: 15,
  eliminated: 0,
  thirdPlaceBout: false,
  timerEnabled: true,
  boutMinutes: 3,
}

// Снятие с турнира: травма/отказ, неявка (исключение по t.118/t.119) или чёрная карточка.
export interface Retirement {
  reason: 'withdrawn' | 'absent' | 'excluded'
  stage: 'pools' | 'tableau' // в пульке бои аннулируются; в олимпийке соперник проходит без боя
}

export interface Fencer {
  id: FencerId
  name: string
  retired?: Retirement
}

export interface TableauState {
  seeds: FencerId[] // вышедшие в олимпийку в порядке посева
  out: FencerId[] // отсеянные после пулек
  results: Record<string, BoutResult>
}

export interface Tournament {
  id: string
  name: string
  createdAt: number
  settings: TournamentSettings
  fencers: Fencer[] // порядок — посев для деления на пульки
  pools: FencerId[][] // пусто, пока пульки не сформированы; порядок — номера в протоколе
  pistes: string[] // номер дорожки каждой пульки; пусто — по порядку (1, 2, …)
  poolBouts: BoutResult[]
  tableau: TableauState | null
  // Только что создан и ещё не менялся — такой турнир не сохраняем (удаляется при выходе в список).
  pristine?: boolean
}

export const db = new Dexie('fencing') as Dexie & {
  tournaments: EntityTable<Tournament, 'id'>
}

db.version(1).stores({
  tournaments: 'id, createdAt',
})

// Дополняет записи, сохранённые старыми версиями приложения.
export function normalize(t: Partial<Tournament> & Pick<Tournament, 'id'>): Tournament {
  return {
    name: 'Турнир',
    createdAt: Date.now(),
    fencers: [],
    pools: [],
    pistes: [],
    poolBouts: [],
    tableau: null,
    ...t,
    settings: { ...defaultSettings, ...t.settings },
  }
}

// Любое изменение снимает отметку «нетронутый».
export function updateTournament(id: string, patch: Partial<Tournament>) {
  return db.tournaments.update(id, { ...patch, pristine: false })
}

// Изменение на основе актуальной записи в базе, а не устаревшей копии из экрана.
export function modifyTournament(id: string, fn: (t: Tournament) => void) {
  return db.tournaments
    .where('id')
    .equals(id)
    .modify((t) => {
      const current = normalize(t)
      fn(current)
      Object.assign(t, current, { pristine: false })
    })
}

export function updateSettings(id: string, patch: Partial<TournamentSettings>) {
  return modifyTournament(id, (t) => {
    t.settings = { ...t.settings, ...patch }
  })
}

export function retireFencer(id: string, fencerId: FencerId, reason: Retirement['reason']) {
  return modifyTournament(id, (t) => {
    const f = t.fencers.find((x) => x.id === fencerId)
    if (f) f.retired = { reason, stage: t.tableau ? 'tableau' : 'pools' }
  })
}

export function restoreFencer(id: string, fencerId: FencerId) {
  return modifyTournament(id, (t) => {
    const f = t.fencers.find((x) => x.id === fencerId)
    if (f) delete f.retired
  })
}

export function deletePristine() {
  return db.tournaments.filter((t) => !!t.pristine).delete()
}

// «Турнир №2 · 16 октября 2026 г.» — номер среди турниров, созданных в тот же день.
export async function createTournament(defaultName: (n: number, date: string) => string, date: Intl.DateTimeFormat) {
  const now = new Date()
  const today = now.toDateString()
  const all = await db.tournaments.toArray()
  const sameDay = all.filter((t) => !t.pristine && new Date(t.createdAt).toDateString() === today).length
  const id = newId()
  await db.tournaments.add(
    normalize({ id, name: defaultName(sameDay + 1, date.format(now)), createdAt: now.getTime(), pristine: true }),
  )
  return id
}

// crypto.randomUUID есть только на https/localhost; по локальной сети (http) — запасной вариант.
export function newId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Просим браузер не вычищать данные при нехватке места.
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // не поддерживается — не критично
  }
}
