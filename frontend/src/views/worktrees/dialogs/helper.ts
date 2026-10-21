import { inject, provide, shallowRef, type InjectionKey } from 'vue'
import type { WorkspaceRow } from '@/views/worktrees/helper'

export type WorktreesDialog = { kind: 'connect' } | { kind: 'remove'; row: WorkspaceRow }

export interface WorktreesDialogOpeners {
  openConnect: () => void
  openRemove: (row: WorkspaceRow) => void
}

const worktreesDialogsKey: InjectionKey<WorktreesDialogOpeners> = Symbol('worktrees-dialogs')

/** Окна раздела: одно открытое за раз; открыть его может любая строка таблицы. */
export function provideWorktreesDialogs() {
  const dialog = shallowRef<WorktreesDialog | null>(null)

  const openers: WorktreesDialogOpeners = {
    openConnect: () => (dialog.value = { kind: 'connect' }),
    openRemove: (row) => (dialog.value = { kind: 'remove', row }),
  }

  function closeDialog() {
    dialog.value = null
  }

  provide(worktreesDialogsKey, openers)

  return { dialog, closeDialog, ...openers }
}

export function useWorktreesDialogs(): WorktreesDialogOpeners {
  const openers = inject(worktreesDialogsKey)
  if (!openers) throw new Error('useWorktreesDialogs вызван вне WorktreesPage')
  return openers
}

/** Сколько длится заглушка удаления (в ядре удаления копии пока нет). */
export const MOCK_ACTION_MS = 700

/** Отказ заглушки удаления. */
export type DialogFailure = { kind: 'refused' | 'other'; text: string }

/** Проект в окне подключения копии. */
export interface ConnectWorkspaceProject {
  knowledge: string
  name: string
}

export function projectsOf(rows: WorkspaceRow[]): ConnectWorkspaceProject[] {
  const projects = new Map<string, ConnectWorkspaceProject>()
  for (const row of rows) {
    if (!projects.has(row.knowledge)) {
      projects.set(row.knowledge, { knowledge: row.knowledge, name: row.project })
    }
  }
  return [...projects.values()]
}

/** Нормализация пути для сравнения на Windows и Unix. */
export function normalizePath(path: string): string {
  return path.trim().replace(/\//g, '\\').replace(/\\+$/, '')
}

/** Проверка пути копии; null — путь годится. */
export function connectPathProblem(path: string, taken: string[]): string | null {
  const normalized = normalizePath(path)
  if (!normalized) return 'Укажите путь к каталогу рабочей копии'
  if (taken.some((item) => normalizePath(item).toLowerCase() === normalized.toLowerCase())) {
    return 'Эта копия уже есть в пуле проекта.'
  }
  return null
}

/** Краткое описание проблем раскладки субагентов после успешного подключения. */
export function agentsWarningText(agents: {
  conflicts: Array<{ agent: string }>
  error?: string | null
} | null | undefined): string | null {
  if (!agents) return null
  const parts: string[] = []
  if (agents.error) parts.push(agents.error)
  if (agents.conflicts.length > 0) {
    const names = agents.conflicts.map((c) => c.agent).join(', ')
    parts.push(`Конфликт субагентов: ${names}`)
  }
  return parts.length > 0 ? parts.join('. ') : null
}
