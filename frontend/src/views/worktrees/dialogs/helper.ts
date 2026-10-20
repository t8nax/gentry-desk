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

/** Сколько длится моковое действие. */
export const MOCK_ACTION_MS = 700

/** refused — отказ проверки пути; other — прочая ошибка. */
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

/** Свободная копия, добавленная в пул по пути. */
export function connectedRow(project: ConnectWorkspaceProject, path: string): WorkspaceRow {
  return {
    project: project.name,
    knowledge: project.knowledge,
    path: normalizePath(path),
    branch: null,
    main: false,
    exists: true,
    occupancy: 'free',
    tasks: [],
  }
}
