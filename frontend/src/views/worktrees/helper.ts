import { inject, provide, ref, shallowRef, watch, type InjectionKey } from 'vue'
import type { WorktreesScreenRow } from '@/api/worktrees'
import type { IconName } from '@/components/AppIcon/helper'

/** Занятость копии: свободна или занята незавершённой задачей. Не путать с этапом задачи и сессией агента. */
export type WorktreeOccupancy = 'free' | 'busy'

/**
 * Текущая задача в копии. Сейчас в строке показывается одна;
 * массив оставлен, чтобы позже вывести несколько (например задачи без правок кода).
 */
export interface WorktreeTaskView {
  /** Идентификатор Gentry, например GENTRYDESK-1. */
  id: string
  /** null, если подробности недоступны. */
  title: string | null
  /** Название этапа, «Сценарий пройден» или null. */
  stage: string | null
  /** Номер круга этапа; null — круг не показывают. */
  round: number | null
  /** Процент прогресса 0–100; null — неопределённый. */
  progress: number | null
  /** Исходные поля прогресса для подсказки. */
  progressDetail: { passed: number; totalMin: number; totalMax: number } | null
  /** Закрепление есть, но задача не попала в снимок списка. */
  detailsUnavailable: boolean
}

export interface WorkspaceRow {
  project: string
  /** Путь к знанию проекта — ключ группы. */
  knowledge: string
  path: string
  branch: string | null
  /** Основная копия проекта. */
  main: boolean
  /** Каталог копии есть на диске. */
  exists: boolean
  occupancy: WorktreeOccupancy
  tasks: WorktreeTaskView[]
}

export interface WorkspaceGroup {
  knowledge: string
  project: string
  rows: WorkspaceRow[]
}

/** Только что подключённая копия: её строка отмечена, пока висит уведомление. */
export interface FreshCopy {
  knowledge: string
  path: string
}

export const COLUMN_COUNT = 7

export const WORKTREES_COLUMNS = ['Копия', '№', 'Задача', 'Этап', 'Прогресс', 'Статус', 'Действия'] as const

/** Сколько раздел читает данные, прежде чем показать заготовку: быстрая загрузка обходится без неё. */
export const SKELETON_DELAY_MS = 300

/** Сколько висит уведомление внизу справа. */
export const TOAST_MS = 5000

/** Сколько строка подключённой копии остаётся отмеченной. */
export const FRESH_MS = 8000

export const TABLE_HEAD_CELL =
  'whitespace-nowrap border-b border-kit-subtle px-4 py-2.5 text-left text-xs font-normal text-kit-secondary'

/** Ячейка строки без white-space: колонка задачи переносится, остальные — нет. */
export const TABLE_CELL = 'border-b border-kit-subtle px-4 py-2.5 align-middle'

export const OCCUPANCY_LABELS: Record<WorktreeOccupancy, string> = {
  free: 'Свободна',
  busy: 'Занята',
}

export function rowKey(row: WorkspaceRow): string {
  return `${row.knowledge}|${row.path}`
}

/** Имя копии — последний каталог её пути. */
export function copyName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path
}

/** Текущая задача строки; при нескольких задачах пока берётся первая. */
export function currentTask(row: WorkspaceRow): WorktreeTaskView | null {
  return row.tasks[0] ?? null
}

/** Подпись этапа с кругом: «Реализация, круг 2». */
export function stageLabel(task: WorktreeTaskView): string | null {
  if (!task.stage) return null
  if (task.stage === 'Сценарий пройден') return task.stage
  return task.round != null ? `${task.stage}, круг ${task.round}` : task.stage
}

/** Подсказка прогресса: passed и диапазон total_min–total_max. */
export function progressTitle(task: WorktreeTaskView): string | undefined {
  const d = task.progressDetail
  if (!d) return undefined
  return `${d.passed} из ${d.totalMin}–${d.totalMax}`
}

/** Группа — проект по пути знания; группы и копии в них идут в порядке строк. */
export function groupByKnowledge(rows: WorkspaceRow[]): WorkspaceGroup[] {
  const groups = new Map<string, WorkspaceGroup>()
  for (const row of rows) {
    const group = groups.get(row.knowledge)
    if (group) group.rows.push(row)
    else groups.set(row.knowledge, { knowledge: row.knowledge, project: row.project, rows: [row] })
  }
  return [...groups.values()]
}

export function isFresh(row: WorkspaceRow, fresh: FreshCopy | null): boolean {
  return fresh != null && row.knowledge === fresh.knowledge && row.path === fresh.path
}

/** Число и существительное: 1 ошибка, 2 ошибки, 5 ошибок. */
export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`
  return `${count} ${many}`
}

export function mapScreenRow(row: WorktreesScreenRow): WorkspaceRow {
  const tasks: WorktreeTaskView[] = []
  if (row.task) {
    const t = row.task
    let stage: string | null = null
    let round: number | null = null
    if (t.details_unavailable) {
      stage = null
      round = null
    } else if (t.finished && !t.stage) {
      stage = 'Сценарий пройден'
    } else if (t.stage) {
      stage = t.stage.title
      round = t.stage.round
    }
    tasks.push({
      id: t.id,
      title: t.details_unavailable ? null : t.title,
      stage,
      round,
      progress: t.details_unavailable ? null : t.percent,
      progressDetail:
        t.progress && !t.details_unavailable
          ? { passed: t.progress.passed, totalMin: t.progress.total_min, totalMax: t.progress.total_max }
          : null,
      detailsUnavailable: t.details_unavailable,
    })
  }
  return {
    project: row.project,
    knowledge: row.knowledge,
    path: row.path,
    branch: row.branch,
    main: row.main,
    exists: row.exists,
    occupancy: row.occupancy,
    tasks,
  }
}

const COLLAPSED_GROUPS_KEY = 'gentry-desk.worktrees.collapsed-groups'

// Хранилище может быть недоступно — тогда всё развёрнуто
function readCollapsed(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(COLLAPSED_GROUPS_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeCollapsed(groups: string[]) {
  try {
    localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(groups))
  } catch {
    // выбор проживёт до перезагрузки
  }
}

/** Свёрнутые группы копий помнит браузер. */
export function useCollapsedGroups() {
  const collapsed = ref<string[]>(readCollapsed())

  function isCollapsed(group: string): boolean {
    return collapsed.value.includes(group)
  }

  function toggle(group: string) {
    collapsed.value = isCollapsed(group)
      ? collapsed.value.filter((item) => item !== group)
      : [...collapsed.value, group]
    writeCollapsed(collapsed.value)
  }

  return { isCollapsed, toggle }
}

export interface ToastPart {
  text: string
  code?: boolean
}

export interface ToastMessage {
  icon: IconName
  /** Без зелёной рамки: сообщение не о приобретении. */
  plain?: boolean
  parts: ToastPart[]
}

export type Notify = (message: ToastMessage) => void

const worktreesNotifyKey: InjectionKey<Notify> = Symbol('worktrees-notify')

export function provideWorktreesNotify(notify: Notify) {
  provide(worktreesNotifyKey, notify)
}

export function useWorktreesNotify(): Notify {
  const notify = inject(worktreesNotifyKey)
  if (!notify) throw new Error('useWorktreesNotify вызван вне WorktreesPage')
  return notify
}

/** Заглушка для переходов, которых в панели ещё нет. */
export function stubMessage(text: string): ToastMessage {
  return { icon: 'info', plain: true, parts: [{ text }] }
}

/** Уведомление внизу справа: гаснет само, новое сменяет прежнее. */
export function useToast() {
  const toast = shallowRef<ToastMessage | null>(null)

  watch(toast, (message, _previous, onCleanup) => {
    if (!message) return
    const timer = window.setTimeout(() => (toast.value = null), TOAST_MS)
    onCleanup(() => window.clearTimeout(timer))
  })

  function notify(message: ToastMessage) {
    toast.value = message
  }

  return { toast, notify }
}

export interface LoadError {
  message: string
  hint: string | null
  code: string
}

/** Проект из ответа бэкенда: путь знания и отображаемое имя. */
export interface WorkspaceProject {
  knowledge: string
  name: string
}
