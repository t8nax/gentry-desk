import type { RouteLocationRaw } from 'vue-router'
import type { IconName } from '@/components/AppIcon/helper'

export interface SidebarNavItem {
  id: string
  label: string
  icon: IconName
  /** Имя маршрута раздела; без него раздел ещё не перенесён и пункт только показан. */
  routeName?: string
  /** Пункт показывает число копий, ждущих оператора. */
  showsWaiting?: boolean
}

export const SIDEBAR_GROUP_LABEL = 'Панель'

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'worktrees', label: 'Рабочие копии', icon: 'table', routeName: 'worktrees' },
  { id: 'backlog', label: 'Бэклог', icon: 'list' },
  { id: 'flow', label: 'Флоу', icon: 'flow' },
  { id: 'performers', label: 'Исполнители', icon: 'performer' },
  { id: 'sessions', label: 'Сессии', icon: 'sessions' },
  { id: 'usage', label: 'Расход', icon: 'usage' },
  { id: 'problems', label: 'Проблемы баз', icon: 'warning' },
  { id: 'settings', label: 'Настройки', icon: 'gear' },
]

export function itemRoute(item: SidebarNavItem): RouteLocationRaw | null {
  return item.routeName ? { name: item.routeName } : null
}

/** Подпись ожидания у пункта: «1 ждёт», «3 ждут»; без ждущих — null. */
export function waitingNote(count: number): string | null {
  if (count <= 0) return null
  return `${count} ${count === 1 ? 'ждёт' : 'ждут'}`
}
