import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { db } from '../db'
import { exportBackup, importBackup } from '../export'
import { dictionaries, useI18n, type Lang } from '../i18n'
import { applyMode, applyTheme, loadMode, loadTheme, modes, themes, type Mode, type ThemeId } from '../theme'
import { Select, Sheet } from './controls'

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// Кнопка-шестерёнка в шапке и окно общих настроек приложения (язык, тема, резервная копия).
export function AppSettings() {
  const { L, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeId>(loadTheme)
  const [mode, setMode] = useState<Mode>(loadMode)
  const fileInput = useRef<HTMLInputElement>(null)
  const count = useLiveQuery(() => db.tournaments.filter((t) => !t.pristine).count())

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      alert(L.backupLoaded((await importBackup(file, L)).length))
    } catch (e) {
      alert(L.backupFailed((e as Error).message))
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <>
      <button className="header-icon" aria-label={L.openSettings} onClick={() => setOpen(true)}>
        <GearIcon />
      </button>

      {open && (
        <Sheet title={L.settings} onClose={() => setOpen(false)}>
          <section className="sheet-section">
            <h3>{L.language}</h3>
            <Select
              label={L.language}
              options={(Object.keys(dictionaries) as Lang[]).map((l) => ({ value: l, label: dictionaries[l].languageName }))}
              value={lang}
              onChange={setLang}
            />
          </section>

          <section className="sheet-section">
            <h3>{L.mode}</h3>
            <Select
              label={L.mode}
              options={modes.map((m) => ({ value: m, label: L.modes[m] }))}
              value={mode}
              onChange={(m) => {
                applyMode(m)
                setMode(m)
              }}
            />
          </section>

          <section className="sheet-section">
            <h3>{L.theme}</h3>
            <div className="theme-picker">
              {themes.map((t, i) => (
                <button
                  key={t.id}
                  className={`theme-option ${theme === t.id ? 'active' : ''}`}
                  aria-pressed={theme === t.id}
                  onClick={() => {
                    applyTheme(t.id)
                    setTheme(t.id)
                  }}
                >
                  <span className="swatches">
                    {t.swatch.map((c) => (
                      <span key={c} style={{ background: c }} />
                    ))}
                  </span>
                  {L.palette(i + 1)}
                </button>
              ))}
            </div>
          </section>

          <section className="sheet-section">
            <h3>{L.backup}</h3>
            <p className="hint">{L.backupHint}</p>
            <div className="row-actions">
              <button className="secondary" onClick={exportBackup} disabled={!count}>
                {L.backupSave}
              </button>
              <button className="secondary" onClick={() => fileInput.current?.click()}>
                {L.backupLoad}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => onImport(e.target.files?.[0])}
              />
            </div>
          </section>
        </Sheet>
      )}
    </>
  )
}
