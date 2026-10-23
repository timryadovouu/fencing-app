import { useMemo, useState, type ReactNode } from 'react'
import { dictionaries, I18nContext, loadLang, saveLang, type Lang } from '../i18n'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = loadLang()
    document.documentElement.lang = initial
    return initial
  })

  const value = useMemo(
    () => ({
      lang,
      L: dictionaries[lang],
      setLang: (next: Lang) => {
        saveLang(next)
        setLangState(next)
      },
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
