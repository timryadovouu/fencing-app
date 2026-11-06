import { useState } from 'react'
import { addClubs, type Club } from '../db'
import { useI18n } from '../i18n'
import { nameKey } from '../names'
import { TextField } from './controls'

const OTHER = '__other'

// Клуб бойца: выбор из банка, «без клуба» или «Другой…» — тогда вписываем новый, и он попадает в банк.
export function ClubSelect({
  value,
  clubs,
  disabled,
  onChange,
}: {
  value: string | undefined
  clubs: Club[]
  disabled?: boolean
  onChange: (club: string | undefined) => void
}) {
  const { L } = useI18n()
  const [typing, setTyping] = useState(false)

  if (typing) {
    return (
      <TextField
        value=""
        className="club-input"
        placeholder={L.clubName}
        label={L.club}
        autoFocus
        onCommit={async (name) => {
          setTyping(false)
          if (!name) return
          await addClubs([name])
          onChange(name)
        }}
      />
    )
  }

  // Клуб бойца может быть не из банка (например, из присланного старта) — показываем и его.
  const selected = clubs.find((c) => value && c.key === nameKey(value))
  return (
    <select
      className="select club-input"
      aria-label={L.club}
      disabled={disabled}
      value={selected ? selected.key : value ? 'current' : ''}
      onChange={(e) => {
        const v = e.target.value
        if (v === OTHER) setTyping(true)
        else if (v === '') onChange(undefined)
        else if (v !== 'current') onChange(clubs.find((c) => c.key === v)?.name)
      }}
    >
      <option value="">{L.noClub}</option>
      {value && !selected && <option value="current">{value}</option>}
      {clubs.map((c) => (
        <option key={c.key} value={c.key}>
          {c.name}
        </option>
      ))}
      <option value={OTHER}>{L.otherClub}</option>
    </select>
  )
}
