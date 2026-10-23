import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, normalize, type Tournament } from '../db'
import { stageOf, statusText } from '../derive'
import { useI18n } from '../i18n'
import { go } from '../nav'
import { Sheet } from './controls'

function SwitchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5" />
      <path d="M20 3.5v5h-5" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5" />
      <path d="M4 20.5v-5h5" />
    </svg>
  )
}

// Кнопка «реверс» в шапке: быстрый переход между идущими турнирами без выхода в меню,
// например когда параллельно идут мальчики и девочки. В списке только незавершённые (без итогов);
// кнопка видна, только если кроме текущего есть хотя бы один такой.
export function TournamentSwitcher({ t }: { t: Tournament }) {
  const { L } = useI18n()
  const [sheetOpen, setSheetOpen] = useState(false)
  const all = useLiveQuery(async () =>
    (await db.tournaments.orderBy('createdAt').reverse().toArray()).filter((x) => !x.pristine).map(normalize),
  )
  const unfinished = (x: Tournament) => stageOf(x) !== 'finished'
  const others = all?.filter((x) => x.id !== t.id && unfinished(x)) ?? []

  if (others.length === 0) return null

  // Текущий — первым (даже если уже завершён), дальше остальные идущие.
  const sorted = [t, ...others]

  return (
    <>
      <button className="header-icon" aria-label={L.switchTournament} title={L.switchTournament} onClick={() => setSheetOpen(true)}>
        <SwitchIcon />
      </button>

      {sheetOpen && (
        <Sheet title={L.switchTournament} onClose={() => setSheetOpen(false)}>
          <ul className="list">
            {sorted.map((x) => (
              <li
                key={x.id}
                className={`card clickable ${x.id === t.id ? 'current' : ''}`}
                onClick={() => {
                  setSheetOpen(false)
                  if (x.id !== t.id) go(`/t/${x.id}`)
                }}
              >
                <div>
                  <div className="card-title">{x.name}</div>
                  <div className="card-meta">
                    {L.weapons[x.settings.weapon]} · {statusText(x, L)}
                  </div>
                </div>
                {x.id === t.id && <span className="check">✓</span>}
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </>
  )
}
