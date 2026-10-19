import { onScopeDispose, shallowRef } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'gentry-desk.theme'

const SYSTEM_LIGHT_QUERY = '(prefers-color-scheme: light)'

function chosenTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.(SYSTEM_LIGHT_QUERY).matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

/** Ставит тему до монтирования приложения: без выбора оператора — системную. */
export function applyInitialTheme() {
  applyTheme(chosenTheme() ?? systemTheme())
}

/** Тема панели: выбор оператора живёт в localStorage, без него панель следует за системой. */
export function useTheme() {
  const theme = shallowRef<Theme>(chosenTheme() ?? systemTheme())

  const media = window.matchMedia?.(SYSTEM_LIGHT_QUERY)
  const onSystemChange = () => {
    if (chosenTheme()) return
    theme.value = systemTheme()
    applyTheme(theme.value)
  }
  media?.addEventListener('change', onSystemChange)
  onScopeDispose(() => media?.removeEventListener('change', onSystemChange))

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
