import { inject, onMounted, onUnmounted, provide, ref, shallowRef, watch, type InjectionKey } from 'vue'
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
  title: string
  /** Название этапа, например «Реализация». */
  stage: string | null
  /** Номер круга этапа; null — круг не показывают. */
  round: number | null
  /** Процент прогресса 0–100; из ядра считается отдельно. */
  progress: number | null
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

/** Сколько длится чтение моковых копий. */
export const MOCK_LOAD_MS = 600

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
  return task.round != null ? `${task.stage}, круг ${task.round}` : task.stage
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

const GENTRY_DESK_KNOWLEDGE = 'C:\\projects\\ai\\gentry-desk-knowledge'
const SHOP_KNOWLEDGE = 'D:\\Projects\\shop-knowledge'

/** Моки: свободная, занятая, основная, круг 2, отсутствующий каталог (свободная и занятая). */
export const MOCK_WORKSPACE_ROWS: WorkspaceRow[] = [
  {
    project: 'gentry-desk',
    knowledge: GENTRY_DESK_KNOWLEDGE,
    path: 'C:\\projects\\ai\\gentry-desk',
    branch: 'main',
    main: true,
    exists: true,
    occupancy: 'busy',
    tasks: [
      {
        id: 'GENTRYDESK-1',
        title: 'Экран рабочих копий под ядро Gentry',
        stage: 'Реализация',
        round: 2,
        progress: 42,
      },
    ],
  },
  {
    project: 'gentry-desk',
    knowledge: GENTRY_DESK_KNOWLEDGE,
    path: 'C:\\projects\\ai\\gentry-desk-wt',
    branch: 'feat/connect',
    main: false,
    exists: true,
    occupancy: 'free',
    tasks: [],
  },
  {
    project: 'gentry-desk',
    knowledge: GENTRY_DESK_KNOWLEDGE,
    path: 'E:\\gone\\gentry-desk-old',
    branch: null,
    main: false,
    exists: false,
    occupancy: 'free',
    tasks: [],
  },
  {
    project: 'gentry-desk',
    knowledge: GENTRY_DESK_KNOWLEDGE,
    path: 'E:\\gone\\gentry-desk-feature',
    branch: 'feat/missing',
    main: false,
    exists: false,
    occupancy: 'busy',
    tasks: [
      {
        id: 'GENTRYDESK-3',
        title: 'Задача на копии без каталога',
        stage: 'Реализация',
        round: 1,
        progress: 35,
      },
    ],
  },
  {
    project: 'shop',
    knowledge: SHOP_KNOWLEDGE,
    path: 'D:\\Projects\\shop\\main',
    branch: 'main',
    main: true,
    exists: true,
    occupancy: 'busy',
    tasks: [
      {
        id: 'SHOP-1',
        title: 'Скидка в корзине',
        stage: 'Реализация',
        round: 2,
        progress: 67,
      },
    ],
  },
  {
    project: 'shop',
    knowledge: SHOP_KNOWLEDGE,
    path: 'D:\\Projects\\shop\\wt-1',
    branch: 'feat/pay',
    main: false,
    exists: true,
    occupancy: 'free',
    tasks: [],
  },
  {
    project: 'shop',
    knowledge: SHOP_KNOWLEDGE,
    path: 'D:\\Projects\\shop\\wt-2',
    branch: 'feat/import',
    main: false,
    exists: true,
    occupancy: 'busy',
    tasks: [
      {
        id: 'SHOP-4',
        title: 'Фильтр каталога по наличию',
        stage: 'План',
        round: 1,
        progress: 20,
      },
    ],
  },
]

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

/**
 * Моковое чтение копий: заготовка проявляется через SKELETON_DELAY_MS, строки приходят через MOCK_LOAD_MS
 * и встают коротким проявлением, только если заготовку успели показать.
 */
export function useMockWorkspaceRows() {
  const rows = ref<WorkspaceRow[] | null>(null)
  const skeletonShown = shallowRef(false)
  const revealing = shallowRef(false)
  let skeletonTimer: number | undefined
  let loadTimer: number | undefined

  onMounted(() => {
    skeletonTimer = window.setTimeout(() => (skeletonShown.value = true), SKELETON_DELAY_MS)
    loadTimer = window.setTimeout(() => {
      window.clearTimeout(skeletonTimer)
      revealing.value = skeletonShown.value
      skeletonShown.value = false
      rows.value = MOCK_WORKSPACE_ROWS.map((row) => ({
        ...row,
        tasks: row.tasks.map((task) => ({ ...task })),
      }))
    }, MOCK_LOAD_MS)
  })

  onUnmounted(() => {
    window.clearTimeout(skeletonTimer)
    window.clearTimeout(loadTimer)
  })

  function endReveal() {
    revealing.value = false
  }

  return { rows, skeletonShown, revealing, endReveal }
}
