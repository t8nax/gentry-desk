import { shallowRef } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'gentry-desk.theme'

const DEFAULT_THEME: Theme = 'light'

function chosenTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

/** Ставит тему до монтирования приложения: без выбора оператора — светлую. */
export function applyInitialTheme() {
  applyTheme(chosenTheme() ?? DEFAULT_THEME)
}

/** Тема панели: выбор оператора живёт в localStorage, без него — светлая. */
export function useTheme() {
  const theme = shallowRef<Theme>(chosenTheme() ?? DEFAULT_THEME)

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.value)
    } catch {
      // выбор проживёт до перезагрузки
    }
    applyTheme(theme.value)
  }

  return { theme, toggle }
}
