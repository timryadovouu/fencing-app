import { useState } from 'react'
import { BoutEditor } from '../components/BoutEditor'
import { Sheet, TextField } from '../components/controls'
import { modifyTournament, moveFencerToPool, retireFencer, updateTournament, type Tournament } from '../db'
import { findBout, namesOf, overallRanking, pisteOf, poolBouts, poolProgress, poolRetired, poolSchedule, poolSize, qualification } from '../derive'
import type { BoutResult, FencerId } from '../domain/bout'
import { canMove, poolName } from '../domain/pools'
import { formatSigned } from '../format'
import { formatRatio, useI18n } from '../i18n'
import { go } from '../nav'
import { PoolProtocol } from './PoolProtocol'

export function PoolsTab({ t }: { t: Tournament }) {
  const { L } = useI18n()
  const [poolIndex, setPoolIndex] = useState(0)
  const [editing, setEditing] = useState<[FencerId, FencerId] | null>(null)
  const [moving, setMoving] = useState<FencerId | null>(null)

  if (t.pools.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty">{L.noPools}</p>
        <button className="primary" onClick={() => go(`/t/${t.id}/setup`)}>
          {L.toFencers}
        </button>
      </div>
    )
  }

  const names = namesOf(t)
  const locked = !!t.tableau
  // Состав пулек можно править вручную, пока не введено ни одного боя.
  const clubOf = (id: FencerId) => t.fencers.find((f) => f.id === id)?.club?.trim().toLocaleLowerCase()
  const sameClub = (x: FencerId, y: FencerId) => !!clubOf(x) && clubOf(x) === clubOf(y)
  const canRearrange = !locked && t.pools.length > 1 && t.poolBouts.length === 0
  const poolIndexSafe = Math.min(poolIndex, t.pools.length - 1)
  const pool = t.pools[poolIndexSafe]
  const bouts = poolBouts(t, pool)
  const schedule = poolSchedule(pool)
  const retired = poolRetired(t)
  const annulled = (a: FencerId, b: FencerId) => retired.has(a) || retired.has(b)
  const nextIndex = schedule.findIndex(([a, b]) => !annulled(a, b) && !findBout(bouts, a, b))
  const numberOf = (id: FencerId) => pool.indexOf(id) + 1
  const { done, total } = poolProgress(t)
  const complete = done === total

  const save = (result: BoutResult | null) => {
    if (!editing) return
    const [x, y] = editing
    modifyTournament(t.id, (cur) => {
      cur.poolBouts = cur.poolBouts.filter((b) => !((b.a === x && b.b === y) || (b.a === y && b.b === x)))
      if (result) cur.poolBouts.push(result)
    })
    setEditing(null)
  }

  const open = (x: FencerId, y: FencerId) => {
    if (locked) {
      alert(L.lockedAlert)
      return
    }
    setEditing([x, y])
  }

  const ranking = overallRanking(t)
  const { out } = qualification(t)
  const startTableau = () => {
    const { seeds, out } = qualification(t, true)
    updateTournament(t.id, { tableau: { seeds, out, results: {} } })
    go(`/t/${t.id}/tableau`)
  }

  return (
    <>
      {t.pools.length > 1 && (
        <div className="chips">
          {t.pools.map((p, i) => {
            const { done: pb, total: pt } = poolSize(t, p)
            return (
              <button key={i} className={i === poolIndex ? 'active' : ''} onClick={() => setPoolIndex(i)}>
                {L.pool(poolName(i))} <small>· {pisteOf(t, i)}</small> <small>{pb === pt ? '✓' : `${pb}/${pt}`}</small>
              </button>
            )
          })}
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>{t.pools.length > 1 ? L.pool(poolName(poolIndexSafe)) : L.protocol}</h2>
          <span className="count">{L.boutsOf(bouts.length, poolSize(t, pool).total)}</span>
        </div>
        <label className="piste-field">
          <span>{L.pisteLabel}</span>
          <TextField
            value={pisteOf(t, poolIndexSafe)}
            label={L.pisteLabel}
            onCommit={(v) =>
              modifyTournament(t.id, (cur) => {
                const pistes = [...cur.pistes]
                pistes[poolIndexSafe] = v
                cur.pistes = pistes
              })
            }
          />
        </label>
        {locked && <p className="hint">{L.protocolLocked}</p>}
        {canRearrange && <p className="hint">{L.moveHint}</p>}
        <PoolProtocol t={t} pool={pool} onCell={open} onName={canRearrange ? setMoving : undefined} />
        <p className="hint">{L.cellHint}</p>
      </section>

      <section className="section">
        <h2>{L.schedule}</h2>
        <ol className="schedule">
          {schedule.map(([a, b], i) => {
            const bout = findBout(bouts, a, b)
            const scoreOf = (id: FencerId) => (bout ? (bout.a === id ? bout.scoreA : bout.scoreB) : null)
            const off = annulled(a, b)
            const state = off ? 'annulled' : bout ? 'done' : i === nextIndex ? 'next' : ''
            return (
              <li key={i} className={state}>
                <button disabled={off} onClick={() => open(a, b)}>
                  <span className="bout-num">{i + 1}</span>
                  <span className={`bout-side ${bout?.winner === a ? 'winner' : ''}`}>
                    <span className="tag">{numberOf(a)}</span> {names.get(a)}
                  </span>
                  <span className="bout-score">
                    {off ? L.annulled : bout ? `${scoreOf(a)} : ${scoreOf(b)}` : i === nextIndex ? L.now : '—'}
                  </span>
                  <span className={`bout-side right ${bout?.winner === b ? 'winner' : ''}`}>
                    {names.get(b)} <span className="tag">{numberOf(b)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{L.rankingAfterPools}</h2>
          {!complete && <span className="count">{L.preliminary}</span>}
        </div>
        <div className="table-scroll">
          <table className="ranking">
            <thead>
              <tr>
                <th>{L.col.place}</th>
                <th className="left">{L.col.fencer}</th>
                {t.pools.length > 1 && <th>{L.col.pool}</th>}
                <th>{L.col.vm}</th>
                <th>{L.col.ind}</th>
                <th>{L.col.ts}</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.fencer} className={out.includes(r.fencer) ? 'out' : ''}>
                  <td className="strong">{r.place}</td>
                  <td className="left">
                    {names.get(r.fencer)}
                    {out.includes(r.fencer) && <span className="badge">{L.out}</span>}
                  </td>
                  {t.pools.length > 1 && <td>{poolName(t.pools.findIndex((p) => p.includes(r.fencer)))}</td>}
                  <td>{formatRatio(L, r.ratio)}</td>
                  <td>{formatSigned(r.index)}</td>
                  <td>{r.scored}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">{L.rankingHint}</p>
        {retired.size > 0 && (
          <p className="hint">{L.retiredList([...retired].map((id) => names.get(id)).join(', '))}</p>
        )}

        {!locked && (
          <button className="primary" disabled={!complete} onClick={startTableau}>
            {complete ? L.makeTableau : L.boutsLeft(total - done)}
          </button>
        )}
      </section>

      {moving && (
        <Sheet title={L.moveFencer(names.get(moving) ?? '')} onClose={() => setMoving(null)}>
          <ul className="list">
            {t.pools.map((p, i) =>
              p.includes(moving) ? null : (
                <li key={i}>
                  <button
                    className="card move-target"
                    disabled={!canMove(t.pools, moving, i)}
                    onClick={() => {
                      moveFencerToPool(t.id, moving, i)
                      setMoving(null)
                    }}
                  >
                    <span className="card-title">
                      {L.pool(poolName(i))} · {L.piste(pisteOf(t, i))}
                    </span>
                    <span className="card-meta">
                      {L.fencersCount(p.length)}
                      {clubOf(moving) && ` · ${L.clubmates(p.filter((x) => sameClub(x, moving)).length)}`}
                    </span>
                  </button>
                </li>
              ),
            )}
          </ul>
        </Sheet>
      )}

      {editing && (
        <BoutEditor
          title={L.boutN(
            schedule.findIndex(
              ([a, b]) => (a === editing[0] && b === editing[1]) || (a === editing[1] && b === editing[0]),
            ) + 1,
          )}
          left={{ id: editing[0], name: names.get(editing[0])!, tag: String(numberOf(editing[0])) }}
          right={{ id: editing[1], name: names.get(editing[1])!, tag: String(numberOf(editing[1])) }}
          touches={t.settings.touches}
          initial={findBout(bouts, editing[0], editing[1])}
          timer={t.settings.timerEnabled ? { minutes: t.settings.boutMinutes, periods: 1 } : null}
          onSave={save}
          onClear={() => save(null)}
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
