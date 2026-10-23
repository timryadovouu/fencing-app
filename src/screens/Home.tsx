import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef } from 'react'
import { AppSettings } from '../components/AppSettings'
import { createTournament, db, deletePristine, normalize, type Tournament } from '../db'
import { statusText } from '../derive'
import { importBackup } from '../export'
import { dateFormat, useI18n } from '../i18n'
import { go } from '../nav'

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function Home() {
  const { L } = useI18n()
  const date = dateFormat(L)
  const tournaments = useLiveQuery(async () =>
    (await db.tournaments.orderBy('createdAt').reverse().toArray()).filter((t) => !t.pristine).map(normalize),
  )

  // Турнир, который создали и ни разу не меняли, не сохраняем.
  useEffect(() => {
    deletePristine()
  }, [])

  const fileInput = useRef<HTMLInputElement>(null)

  // Турнир, присланный другом (JSON): один — сразу открываем, несколько — просто добавляем в список.
  const openFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const ids = await importBackup(file, L)
      if (ids.length === 1) go(`/t/${ids[0]}`)
      else alert(L.backupLoaded(ids.length))
    } catch (e) {
      alert(L.backupFailed((e as Error).message))
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  const create = async () => go(`/t/${await createTournament(L.defaultName, date)}/setup`)

  const remove = async (t: Tournament) => {
    if (confirm(L.deleteAsk(t.name))) await db.tournaments.delete(t.id)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-row">
          <h1>{L.appTitle}</h1>
          <AppSettings />
        </div>
      </header>

      <main className="content">
        <button className="primary" onClick={create}>
          {L.newTournament}
        </button>
        <button className="secondary wide" onClick={() => fileInput.current?.click()}>
          {L.openFile}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => openFile(e.target.files?.[0])}
        />

        {tournaments?.length === 0 && <p className="empty">{L.emptyList}</p>}

        <ul className="list">
          {tournaments?.map((t) => (
            <li key={t.id} className="card clickable" onClick={() => go(`/t/${t.id}`)}>
              <div>
                <div className="card-title">{t.name}</div>
                <div className="card-meta">
                  {L.weapons[t.settings.weapon]} · {date.format(t.createdAt)} · {statusText(t, L)}
                </div>
              </div>
              <button
                className="icon-btn delete"
                aria-label={L.deleteLabel(t.name)}
                onClick={(e) => {
                  e.stopPropagation()
                  remove(t)
                }}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
