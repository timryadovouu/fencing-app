import { useLiveQuery } from 'dexie-react-hooks'
import { AppSettings } from '../components/AppSettings'
import { TournamentSwitcher } from '../components/TournamentSwitcher'
import { db, normalize } from '../db'
import { stageOf } from '../derive'
import { useI18n } from '../i18n'
import { go } from '../nav'
import { PoolsTab } from './PoolsTab'
import { ResultsTab } from './ResultsTab'
import { SetupTab } from './SetupTab'
import { TableauTab } from './TableauTab'

export type Tab = 'setup' | 'pools' | 'tableau' | 'results'

const tabs: Tab[] = ['setup', 'pools', 'tableau', 'results']

export function TournamentScreen({ id, tab }: { id: string; tab?: Tab }) {
  const { L } = useI18n()
  const t = useLiveQuery(async () => {
    const found = await db.tournaments.get(id)
    return found ? normalize(found) : null
  }, [id])

  if (t === undefined) return null
  if (t === null) {
    return (
      <div className="app">
        <main className="content">
          <p className="empty">{L.notFound}</p>
          <button className="primary" onClick={() => go('/')}>
            {L.toList}
          </button>
        </main>
      </div>
    )
  }

  const stage = stageOf(t)
  const defaultTab: Tab = stage === 'finished' ? 'results' : stage
  const current = tab && tabs.includes(tab) ? tab : defaultTab

  return (
    <div className="app">
      <header className="header">
        <div className="header-row">
          <button className="back" aria-label={L.toList} onClick={() => go('/')}>
            ‹
          </button>
          <h1 className="header-title">{t.name}</h1>
          <span className="weapon">{L.weapons[t.settings.weapon]}</span>
          <div className="header-actions">
            <TournamentSwitcher t={t} />
            <AppSettings />
          </div>
        </div>
        <nav className="tabs">
          {tabs.map((x) => (
            <button
              key={x}
              className={x === current ? 'active' : ''}
              aria-current={x === current ? 'page' : undefined}
              onClick={() => go(`/t/${t.id}/${x}`)}
            >
              {L.tabs[x]}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {current === 'setup' && <SetupTab t={t} />}
        {current === 'pools' && <PoolsTab t={t} />}
        {current === 'tableau' && <TableauTab t={t} />}
        {current === 'results' && <ResultsTab t={t} />}
      </main>
    </div>
  )
}
