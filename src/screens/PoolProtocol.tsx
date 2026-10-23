import type { Tournament } from '../db'
import { fencerOf, findBout, namesOf, poolBouts, poolRanking, poolRetired, statusLabel } from '../derive'
import { cellLabel, type FencerId } from '../domain/bout'
import { formatSigned } from '../format'
import { formatRatio, useI18n } from '../i18n'

interface Props {
  t: Tournament
  pool: FencerId[]
  onCell?: (x: FencerId, y: FencerId) => void // нет — протокол только для просмотра
}

// Протокол как на бумаге: строка — бойцы, в клетке — результат бойца строки против бойца столбца.
export function PoolProtocol({ t, pool, onCell }: Props) {
  const { L } = useI18n()
  const names = namesOf(t)
  const bouts = poolBouts(t, pool)
  const stats = new Map(poolRanking(t, pool).map((r) => [r.fencer, r]))
  const retired = poolRetired(t)

  return (
    <div className="table-scroll">
      <table className="protocol">
        <thead>
          <tr>
            <th className="sticky name-col">{L.col.fencer}</th>
            {pool.map((_, j) => (
              <th key={j} className="cell-col">
                {j + 1}
              </th>
            ))}
            <th className="stat-start" title={L.colTitle.v}>
              {L.col.v}
            </th>
            <th title={L.colTitle.vm}>{L.col.vm}</th>
            <th title={L.colTitle.ts}>{L.col.ts}</th>
            <th title={L.colTitle.tr}>{L.col.tr}</th>
            <th title={L.colTitle.ind}>{L.col.ind}</th>
            <th title={L.colTitle.place}>{L.col.place}</th>
          </tr>
        </thead>
        <tbody>
          {pool.map((x, i) => {
            const st = stats.get(x)
            return (
              <tr key={x} className={retired.has(x) ? 'retired' : ''}>
                {/* Номер и имя в одной закреплённой ячейке — иначе на узком экране они расходятся и наползают на клетки. */}
                <td className="sticky name-col">
                  <span className="name">
                    <span className="num">{i + 1}</span>
                    <span className="label">{names.get(x)}</span>
                  </span>
                </td>
                {pool.map((y, j) => {
                  if (i === j) return <td key={y} className="cell diag" />
                  // Бои снятого в пульке аннулированы — клетки пустые и неактивные.
                  if (retired.has(x) || retired.has(y)) return <td key={y} className="cell annulled" />
                  const bout = findBout(bouts, x, y)
                  const label = bout ? cellLabel(bout, x, t.settings.touches) : ''
                  const win = bout?.winner === x
                  return (
                    <td key={y} className={`cell ${win ? 'win' : bout ? 'loss' : ''}`}>
                      {onCell ? (
                        <button aria-label={`${names.get(x)} — ${names.get(y)}`} onClick={() => onCell(x, y)}>
                          {label}
                        </button>
                      ) : (
                        label
                      )}
                    </td>
                  )
                })}
                {st ? (
                  <>
                    <td className="stat stat-start strong">{st.victories}</td>
                    <td className="stat">{formatRatio(L, st.ratio)}</td>
                    <td className="stat">{st.scored}</td>
                    <td className="stat">{st.received}</td>
                    <td className="stat">{formatSigned(st.index)}</td>
                    <td className="stat strong">{st.matches ? st.place : '—'}</td>
                  </>
                ) : (
                  <td className="stat stat-start" colSpan={6}>
                    <span className="badge">{statusLabel(L, fencerOf(t, x))}</span>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
