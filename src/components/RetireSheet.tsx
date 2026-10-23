import { restoreFencer, retireFencer, type Tournament } from '../db'
import { fencerOf, statusLabel } from '../derive'
import { useI18n } from '../i18n'
import { Sheet } from './controls'

// Снять бойца (травма) или исключить чёрной карточкой (неявка, грубое нарушение); либо вернуть.
export function RetireSheet({ t, fencerId, onClose }: { t: Tournament; fencerId: string; onClose: () => void }) {
  const { L } = useI18n()
  const f = fencerOf(t, fencerId)
  if (!f) return null
  const inTableau = !!t.tableau
  // Вернуть снятого в пульке после формирования олимпийки нельзя — посев уже сделан без него.
  const canRestore = !!f.retired && !(f.retired.stage === 'pools' && inTableau)

  const act = async (fn: () => Promise<unknown>) => {
    await fn()
    onClose()
  }

  return (
    <Sheet title={L.retireTitle(f.name)} onClose={onClose}>
      {f.retired ? (
        <div className="sheet-section">
          <p className="hint">
            <span className="badge">{statusLabel(L, f)}</span>
          </p>
          <button className="primary" disabled={!canRestore} onClick={() => act(() => restoreFencer(t.id, f.id))}>
            {L.restore}
          </button>
        </div>
      ) : (
        <div className="sheet-section retire-options">
          <p className="hint">{inTableau ? L.retireTableauNote : L.retirePoolsNote}</p>
          <button className="retire-option" onClick={() => act(() => retireFencer(t.id, f.id, 'withdrawn'))}>
            <strong>{L.retireWithdraw}</strong>
            <small>{L.retireWithdrawHint}</small>
          </button>
          <button className="retire-option" onClick={() => act(() => retireFencer(t.id, f.id, 'absent'))}>
            <strong>{L.retireAbsent}</strong>
            <small>{L.retireAbsentHint}</small>
          </button>
          <button className="retire-option black" onClick={() => act(() => retireFencer(t.id, f.id, 'excluded'))}>
            <strong>
              <span className="card-chip black" /> {L.retireBlack}
            </strong>
            <small>{L.retireBlackHint}</small>
          </button>
        </div>
      )}
    </Sheet>
  )
}
