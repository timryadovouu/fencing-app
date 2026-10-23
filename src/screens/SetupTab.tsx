import { useState } from 'react'
import { Segmented, Stepper, Toggle } from '../components/controls'
import { RetireSheet } from '../components/RetireSheet'
import { TextField } from '../components/controls'
import { modifyTournament, newId, updateSettings, updateTournament, weapons, type Tournament, type TournamentSettings } from '../db'
import { MAX_ELIMINATED } from '../domain/qualify'
import { poolName, splitIntoPools } from '../domain/pools'
import { statusLabel } from '../derive'
import { useI18n } from '../i18n'
import { go } from '../nav'
import { splitDuplicates } from '../names'
import { sabreBreakAt } from '../domain/timing'

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function SetupTab({ t }: { t: Tournament }) {
  const { L } = useI18n()
  const [draft, setDraft] = useState('')
  const [retiring, setRetiring] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const started = t.pools.length > 0
  const s = t.settings
  const set = (patch: Partial<TournamentSettings>) => updateSettings(t.id, patch)

  // Можно вставить сразу список — по одному бойцу в строке.
  // Повторы не добавляем: они остаются в поле ввода, чтобы их можно было поправить.
  const add = () => {
    const { ok, duplicates } = splitDuplicates(
      t.fencers.map((f) => f.name),
      draft.split('\n'),
    )
    if (ok.length) {
      modifyTournament(t.id, (cur) => {
        cur.fencers.push(...ok.map((name) => ({ id: newId(), name })))
      })
    }
    setDraft(duplicates.join('\n'))
    setNameError(duplicates.length ? L.duplicateName(duplicates.join(', ')) : null)
  }

  const rename = (id: string, name: string) => {
    const others = t.fencers.filter((f) => f.id !== id).map((f) => f.name)
    const { ok, duplicates } = splitDuplicates(others, [name])
    if (duplicates.length) {
      setNameError(L.duplicateName(duplicates[0]))
      return
    }
    setNameError(null)
    if (ok[0]) {
      modifyTournament(t.id, (cur) => {
        cur.fencers = cur.fencers.map((f) => (f.id === id ? { ...f, name: ok[0] } : f))
      })
    }
  }

  const remove = (id: string) =>
    modifyTournament(t.id, (cur) => {
      cur.fencers = cur.fencers.filter((f) => f.id !== id)
    })

  const move = (id: string, delta: number) =>
    modifyTournament(t.id, (cur) => {
      const index = cur.fencers.findIndex((f) => f.id === id)
      const target = index + delta
      if (index < 0 || target < 0 || target >= cur.fencers.length) return
      const [f] = cur.fencers.splice(index, 1)
      cur.fencers.splice(target, 0, f)
    })

  const preview = splitIntoPools(t.fencers, s.maxPoolSize)

  const startPools = () => {
    updateTournament(t.id, {
      pools: splitIntoPools(t.fencers.map((f) => f.id), s.maxPoolSize),
      pistes: [],
      poolBouts: [],
      tableau: null,
    })
    go(`/t/${t.id}/pools`)
  }

  const resetPools = () => {
    if (confirm(L.resetPoolsAsk)) {
      // Снятия относились к этим пулькам — сбрасываем вместе с ними.
      updateTournament(t.id, {
        pools: [],
        pistes: [],
        poolBouts: [],
        tableau: null,
        fencers: t.fencers.map((f) => ({ id: f.id, name: f.name })),
      })
    }
  }

  return (
    <>
      <section className="section">
        <label className="field">
          <span>{L.name}</span>
          <TextField value={t.name} onCommit={(name) => updateTournament(t.id, { name: name || L.fallbackName })} />
        </label>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>
            {L.fencers} <span className="count">{t.fencers.length}</span>
          </h2>
          {!started && t.fencers.length > 1 && (
            <button className="link" onClick={() => updateTournament(t.id, { fencers: shuffle(t.fencers) })}>
              {L.shuffle}
            </button>
          )}
        </div>
        <p className="hint">{L.seedHint}</p>

        <ol className="fencers">
          {t.fencers.map((f, i) => (
            <li key={f.id}>
              <span className="num">{i + 1}</span>
              <TextField
                value={f.name}
                disabled={started}
                label={L.fencerN(i + 1)}
                onCommit={(name) => name && rename(f.id, name)}
              />
              {started && (
                <span className="fencer-actions">
                  {f.retired && <span className="badge">{statusLabel(L, f)}</span>}
                  <button className="link small" onClick={() => setRetiring(f.id)}>
                    {f.retired ? L.restore : L.retire}
                  </button>
                </span>
              )}
              {!started && (
                <span className="fencer-actions">
                  <button className="icon-btn" aria-label={L.up} disabled={i === 0} onClick={() => move(f.id, -1)}>
                    ↑
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={L.down}
                    disabled={i === t.fencers.length - 1}
                    onClick={() => move(f.id, 1)}
                  >
                    ↓
                  </button>
                  <button className="icon-btn" aria-label={L.deleteLabel(f.name)} onClick={() => remove(f.id)}>
                    ✕
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>

        {nameError && <p className="error left">{nameError}</p>}

        {!started && (
          <div className="add-row">
            <textarea
              rows={1}
              placeholder={L.namePlaceholder}
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
        )}
      </section>

      <section className="section">
        <h2>{L.tournamentSettings}</h2>
        <div className="settings">
          <div className="setting weapon-setting">
            <span>{L.weaponLabel}</span>
            <Segmented
              options={weapons.map((w) => ({ value: w, label: L.weapons[w] }))}
              value={s.weapon}
              onChange={(weapon) => set({ weapon })}
            />
          </div>

          <div className="setting-group">{L.groupPools}</div>
          <div className="setting">
            <span>{L.touches}</span>
            <Stepper value={s.touches} min={1} max={15} disabled={started} onChange={(touches) => set({ touches })} />
          </div>
          <div className="setting">
            <span>{L.maxPoolSize}</span>
            <Stepper
              value={s.maxPoolSize}
              min={3}
              max={16}
              disabled={started}
              onChange={(maxPoolSize) => set({ maxPoolSize })}
            />
          </div>

          <div className="setting-group">{L.groupTableau}</div>
          <div className="setting">
            <span>{L.touches}</span>
            <Stepper value={s.deTouches} min={1} max={45} disabled={!!t.tableau} onChange={(deTouches) => set({ deTouches })} />
          </div>
          <div className="setting">
            <span>
              {L.eliminated}
              <small>{L.eliminatedHint}</small>
            </span>
            <Segmented
              options={Array.from({ length: MAX_ELIMINATED + 1 }, (_, n) => ({ value: n, label: n ? String(n) : L.allPass }))}
              value={s.eliminated}
              disabled={!!t.tableau}
              onChange={(eliminated) => set({ eliminated })}
            />
          </div>
          <div className="setting">
            <span>{L.thirdPlace}</span>
            <Toggle checked={s.thirdPlaceBout} onChange={(thirdPlaceBout) => set({ thirdPlaceBout })} />
          </div>

          <div className="setting-group">{L.groupTimer}</div>
          <div className="setting">
            <span>{L.timer}</span>
            <Toggle checked={s.timerEnabled} onChange={(timerEnabled) => set({ timerEnabled })} />
          </div>
          {s.timerEnabled && (
            <div className="setting">
              <span>
                {L.minutes}
                <small>{s.weapon === 'sabre' ? L.minutesHintSabre(sabreBreakAt(s.deTouches)) : L.minutesHint}</small>
              </span>
              <Stepper value={s.boutMinutes} min={1} max={10} onChange={(boutMinutes) => set({ boutMinutes })} />
            </div>
          )}
        </div>
      </section>

      <section className="section">
        {started ? (
          <>
            <p className="hint">{L.poolsLocked}</p>
            <div className="row-actions">
              <button className="primary" onClick={() => go(`/t/${t.id}/pools`)}>
                {L.toPools}
              </button>
              <button className="danger-link" onClick={resetPools}>
                {L.resetPools}
              </button>
            </div>
          </>
        ) : (
          <>
            {t.fencers.length >= 2 && (
              <p className="hint">
                {L.poolsPreview(preview.length, preview.map((p, i) => `${poolName(i)} — ${p.length}`).join(', '))}
              </p>
            )}
            <button className="primary" disabled={t.fencers.length < 2} onClick={startPools}>
              {L.makePools}
            </button>
          </>
        )}
      </section>

      {retiring && <RetireSheet t={t} fencerId={retiring} onClose={() => setRetiring(null)} />}
    </>
  )
}
