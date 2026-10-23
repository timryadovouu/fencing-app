import { useState } from 'react'
import { BracketTree } from '../components/BracketTree'
import type { Tournament } from '../db'
import { bracketOf, fencerOf, finalStandings, namesOf, overallRanking, pisteOf, statusLabel } from '../derive'
import { poolName } from '../domain/pools'
import { exportCsv, exportJson, exportPdf } from '../export'
import { formatSigned } from '../format'
import { dateFormat, formatRatio, useI18n } from '../i18n'
import { PoolProtocol } from './PoolProtocol'

const medal: Record<number, string> = { 1: 'gold', 2: 'silver', 3: 'bronze' }

function PrinterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

export function ResultsTab({ t }: { t: Tournament }) {
  const { L } = useI18n()
  const [busy, setBusy] = useState(false)
  const names = namesOf(t)
  const standings = finalStandings(t)
  const ranking = overallRanking(t)
  const poolStats = new Map(ranking.map((r) => [r.fencer, r]))
  const bracket = bracketOf(t)
  const empty = t.pools.length === 0

  const pdf = async () => {
    setBusy(true)
    try {
      await exportPdf(t, L)
    } catch (e) {
      alert(L.pdfFailed((e as Error).message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="row-actions no-print">
        <button className="secondary" onClick={pdf} disabled={empty || busy}>
          {L.exportPdf}
        </button>
        <button className="secondary" onClick={() => exportCsv(t, L)} disabled={empty}>
          {L.exportCsv}
        </button>
        <button className="secondary" onClick={() => exportJson(t)}>
          {L.exportJson}
        </button>
        <button className="secondary icon-only" aria-label={L.print} title={L.print} onClick={() => print()}>
          <PrinterIcon />
        </button>
      </div>

      <div className="report">
        <div className="print-only report-title">
          <h1>{t.name}</h1>
          <p>
            {L.weapons[t.settings.weapon]} · {dateFormat(L).format(t.createdAt)}
          </p>
        </div>

        <section className="section">
          <h2>{standings ? L.finalPlaces : L.results}</h2>
          {standings ? (
            <div className="table-scroll">
              <table className="ranking">
                <thead>
                  <tr>
                    <th>{L.col.placeFull}</th>
                    <th className="left">{L.col.fencer}</th>
                    <th>{L.col.vm}</th>
                    <th>{L.col.ind}</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s) => {
                    const st = poolStats.get(s.fencer)
                    return (
                      <tr key={s.fencer}>
                        <td>
                          {s.place === null ? (
                            <span className="badge">{statusLabel(L, fencerOf(t, s.fencer))}</span>
                          ) : (
                            <span className={`place ${medal[s.place] ?? ''}`}>{s.place}</span>
                          )}
                        </td>
                        <td className="left">{names.get(s.fencer)}</td>
                        <td>{st ? formatRatio(L, st.ratio) : ''}</td>
                        <td>{st ? formatSigned(st.index) : ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="hint">{empty ? L.notStarted : L.afterFinal(t.settings.thirdPlaceBout)}</p>
          )}
        </section>

        {bracket && t.tableau && (
          <section className="section">
            <h2>{L.tableau}</h2>
            <BracketTree
              bracket={bracket}
              names={names}
              seedOf={(id) => t.tableau!.seeds.indexOf(id) + 1}
              statusOf={(id) => statusLabel(L, fencerOf(t, id))}
            />
          </section>
        )}

        {!empty && (
          <section className="section">
            <h2>{L.rankingAfterPools}</h2>
            <div className="table-scroll">
              <table className="ranking">
                <thead>
                  <tr>
                    <th>{L.col.place}</th>
                    <th className="left">{L.col.fencer}</th>
                    <th>{L.col.v}</th>
                    <th>{L.col.bouts}</th>
                    <th>{L.col.vm}</th>
                    <th>{L.col.ts}</th>
                    <th>{L.col.tr}</th>
                    <th>{L.col.ind}</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r) => (
                    <tr key={r.fencer} className={t.tableau?.out.includes(r.fencer) ? 'out' : ''}>
                      <td className="strong">{r.place}</td>
                      <td className="left">{names.get(r.fencer)}</td>
                      <td>{r.victories}</td>
                      <td>{r.matches}</td>
                      <td>{formatRatio(L, r.ratio)}</td>
                      <td>{r.scored}</td>
                      <td>{r.received}</td>
                      <td>{formatSigned(r.index)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {t.pools.map((pool, i) => (
          <section key={i} className="section protocol-section">
            <h2>
              {L.poolProtocol(t.pools.length > 1 ? poolName(i) : null)} · {L.piste(pisteOf(t, i))}
            </h2>
            <PoolProtocol t={t} pool={pool} />
          </section>
        ))}
      </div>
    </>
  )
}
