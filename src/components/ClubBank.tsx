import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { addClubs, db, deleteClub } from '../db'
import { useI18n } from '../i18n'
import { Sheet } from './controls'

// Банк клубов: задаётся один раз, дальше клуб у бойца выбирается из списка.
export function ClubBankButton() {
  const { L } = useI18n()
  const [open, setOpen] = useState(false)
  const count = useLiveQuery(() => db.clubs.count())

  return (
    <>
      <button className="secondary wide" onClick={() => setOpen(true)}>
        {L.clubsCount(count ?? 0)}
      </button>
      {open && <ClubBank onClose={() => setOpen(false)} />}
    </>
  )
}

function ClubBank({ onClose }: { onClose: () => void }) {
  const { L } = useI18n()
  const clubs = useLiveQuery(() => db.clubs.orderBy('name').toArray())
  const [draft, setDraft] = useState('')

  // Можно вставить несколько клубов сразу — по одному в строке.
  const add = async () => {
    await addClubs(draft.split('\n'))
    setDraft('')
  }

  return (
    <Sheet title={L.clubs} onClose={onClose}>
      <p className="hint">{L.clubsHint}</p>
      <div className="add-line">
        <textarea
          rows={1}
          placeholder={L.clubName}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              add()
            }
          }}
        />
        <button className="secondary" onClick={add} disabled={!draft.trim()}>
          {L.add}
        </button>
      </div>
      {clubs?.length === 0 && <p className="empty">{L.clubsEmpty}</p>}
      <ul className="club-list">
        {clubs?.map((c) => (
          <li key={c.key}>
            <span>{c.name}</span>
            <button className="icon-btn delete" aria-label={L.deleteLabel(c.name)} onClick={() => deleteClub(c.key)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
