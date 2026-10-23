import { useState } from 'react'
import { BoutEditor } from '../components/BoutEditor'
import { BracketTree } from '../components/BracketTree'
import { Segmented } from '../components/controls'
import { retireFencer, updateTournament, type Tournament } from '../db'
import { bracketOf, fencerOf, namesOf, poolProgress, statusLabel } from '../derive'
import type { BoutResult } from '../domain/bout'
import { BYE, buildBracket, isFencer, type DeMatch, type Slot } from '../domain/tableau'
import { useI18n } from '../i18n'
import { go } from '../nav'
import { deTimer } from '../domain/timing'

type View = 'tree' | 'list'

export function TableauTab({ t }: { t: Tournament }) {
  const { L } = useI18n()
  const bracket = bracketOf(t)
  const [view, setView] = useState<View>('tree')
  const [selected, setSelected] = useState<number | null>(null)
  const [editing, setEditing] = useState<DeMatch | null>(null)

  if (!bracket || !t.tableau) {
    const { done, total } = poolProgress(t)
    return (
      <div className="empty-state">
        <p className="empty">
          {L.tableauAfterPools}
          {total > 0 && ` ${L.boutsDone(done, total)}`}
        </p>
        <button className="primary" onClick={() => go(`/t/${t.id}/pools`)}>
          {L.toPools}
        </button>
      </div>
    )
  }

  const tableau = t.tableau
  const names = namesOf(t)
  const seedOf = (id: string) => tableau.seeds.indexOf(id) + 1
  const statusOf = (id: string) => statusLabel(L, fencerOf(t, id))
  const decided = (m: DeMatch) => m.winner !== null
  const firstOpen = bracket.rounds.findIndex((r) => !r.every(decided))
  const lastRound = bracket.rounds.length - 1
  const roundIndex = selected ?? (firstOpen === -1 ? lastRound : firstOpen)
  const matches = bracket.rounds[roundIndex]
  const finished = isFencer(bracket.rounds[lastRound][0].winner) && (!bracket.bronze || !!bracket.bronze.winner)

  const saveResults = (results: Record<string, BoutResult>) => {
    // Убираем результаты, которые после правки больше не соответствуют сетке.
    const used = buildBracket(tableau.seeds, results, t.settings.thirdPlaceBout).used
    const kept = Object.fromEntries(Object.entries(results).filter(([key]) => used.has(key)))
    const dropped = Object.keys(results).length - Object.keys(kept).length
    if (dropped > 0 && !confirm(L.droppedAsk(dropped))) return
    updateTournament(t.id, { tableau: { ...tableau, results: kept } })
    setEditing(null)
  }

  const save = (result: BoutResult) => editing && saveResults({ ...tableau.results, [editing.key]: result })
  const clear = () => {
    if (!editing) return
    const results = { ...tableau.results }
    delete results[editing.key]
    saveResults(results)
  }

  const rebuild = () => {
    if (confirm(L.rebuildAsk)) {
      updateTournament(t.id, { tableau: null })
      go(`/t/${t.id}/pools`)
    }
  }

  const sideView = (slot: Slot, winner: Slot, score: number | undefined) => {
    if (slot === BYE) return <div className="de-side bye">{L.bye}</div>
    if (!slot) return <div className="de-side tbd">{L.tbd}</div>
    return (
      <div className={`de-side ${winner === slot ? 'winner' : winner ? 'loser' : ''}`}>
        <span className="tag">{seedOf(slot)}</span>
        <span className="de-name">{names.get(slot)}</span>
        {statusOf(slot) && <span className="badge">{statusOf(slot)}</span>}
        <span className="de-score">{score ?? ''}</span>
      </div>
    )
  }

  const card = (m: DeMatch, title?: string) => {
    const playable = isFencer(m.a) && isFencer(m.b) && !m.walkover
    const score = (id: Slot) => (m.result && isFencer(id) ? (m.result.a === id ? m.result.scoreA : m.result.scoreB) : undefined)
    return (
      <li key={m.key}>
        {title && <div className="de-title">{title}</div>}
        <button className={`de-match ${playable && !m.result ? 'open' : ''}`} disabled={!playable} onClick={() => setEditing(m)}>
          {sideView(m.a, m.winner, score(m.a))}
          {sideView(m.b, m.winner, score(m.b))}
        </button>
      </li>
    )
  }

  return (
    <>
      <div className="section-head">
        <Segmented
          options={[
            { value: 'tree', label: L.viewTree },
            { value: 'list', label: L.viewList },
          ]}
          value={view}
          onChange={setView}
        />
        <span className="count">{L.touchesTo(t.settings.deTouches)}</span>
      </div>

      {view === 'tree' ? (
        <section className="section">
          <BracketTree bracket={bracket} names={names} seedOf={seedOf} statusOf={statusOf} onOpen={setEditing} />
        </section>
      ) : (
        <>
          <div className="chips section">
            {bracket.rounds.map((r, i) => (
              <button key={i} className={i === roundIndex ? 'active' : ''} onClick={() => setSelected(i)}>
                {L.roundName(r.length)} {r.every(decided) && <small>✓</small>}
              </button>
            ))}
          </div>
          <section className="section">
            <h2>{L.roundName(matches.length)}</h2>
            <ul className="de-list">
              {matches.map((m) => card(m))}
              {roundIndex === lastRound && bracket.bronze && card(bracket.bronze, L.bronze)}
            </ul>
          </section>
        </>
      )}

      {finished && (
        <button className="primary" onClick={() => go(`/t/${t.id}/results`)}>
          {L.toResults}
        </button>
      )}

      {tableau.out.length > 0 && <p className="hint">{L.notQualified(tableau.out.map((f) => names.get(f)).join(', '))}</p>}

      <section className="section">
        <button className="danger-link" onClick={rebuild}>
          {L.rebuild}
        </button>
      </section>

      {editing && isFencer(editing.a) && isFencer(editing.b) && (
        <BoutEditor
          title={editing.key === 'bronze' ? L.bronze : L.roundName(bracket.rounds[editing.round].length)}
          left={{ id: editing.a, name: names.get(editing.a)!, tag: String(seedOf(editing.a)) }}
          right={{ id: editing.b, name: names.get(editing.b)!, tag: String(seedOf(editing.b)) }}
          touches={t.settings.deTouches}
          initial={editing.result}
          timer={t.settings.timerEnabled ? deTimer(t.settings.weapon, t.settings.boutMinutes, t.settings.deTouches) : null}
          onSave={save}
          onClear={clear}
          onBlackCard={(id) => {
            retireFencer(t.id, id, 'excluded')
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
