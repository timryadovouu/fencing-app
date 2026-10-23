export const themes = [
  { id: 'sage', swatch: ['#495D63', '#629677', '#98B6B1', '#FAC8CD'] },
  { id: 'jungle', swatch: ['#0B0500', '#00A878', '#D8F1A0', '#FE5E41'] },
] as const

export type ThemeId = (typeof themes)[number]['id']

// Светлый или тёмный вариант палитры: как в системе или выбранный явно.
export const modes = ['auto', 'light', 'dark'] as const
export type Mode = (typeof modes)[number]

const THEME_KEY = 'theme'
const MODE_KEY = 'mode'

function load<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    if (allowed.includes(saved as T)) return saved as T
  } catch {
    // хранилище недоступно — значение по умолчанию
  }
  return fallback
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // не сохранилось — действует до перезапуска
  }
}

export function loadTheme(): ThemeId {
  return load(THEME_KEY, themes.map((t) => t.id), 'sage')
}

export function loadMode(): Mode {
  return load(MODE_KEY, modes, 'auto')
}

const systemDark = matchMedia('(prefers-color-scheme: dark)')

function render() {
  const root = document.documentElement
  root.dataset.theme = loadTheme()
  const mode = loadMode()
  root.dataset.scheme = mode === 'dark' || (mode === 'auto' && systemDark.matches) ? 'dark' : 'light'
  const header = getComputedStyle(root).getPropertyValue('--header').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', header)
}

export function initTheme() {
  render()
  systemDark.addEventListener('change', render)
}

export function applyTheme(id: ThemeId) {
  save(THEME_KEY, id)
  render()
}

export function applyMode(mode: Mode) {
  save(MODE_KEY, mode)
  render()
}
