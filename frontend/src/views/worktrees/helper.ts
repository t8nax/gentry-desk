import { inject, onMounted, onUnmounted, provide, ref, shallowRef, watch, type InjectionKey } from 'vue'
import type { IconName } from '@/components/AppIcon/helper'

/**
 * starting — панель запустила задачу, а памяти у копии ещё нет: агент только начал.
 * unread — оператор ответил, а прочесть ответ некому: ни сессии VS Code, ни фоновой сессии задачи в копии нет.
 */
export type WorkspaceStatus = 'free' | 'starting' | 'in-work' | 'waiting' | 'unread'

/** Состояния сессии агента в копии; отсутствие сессии состоянием не считается. */
export type SessionState = 'working' | 'waiting' | 'idle'

export type ProblemsState = 'checked' | 'pending' | 'kit-not-set' | 'kit-not-found' | 'failed'

export interface WorkspaceRow {
  project: string
  base: string
  path: string
  branch: string | null
  task: string | null
  flowStep: string | null
  progress: number | null
  status: WorkspaceStatus | null
  error: string | null
  /** Проблемы связи самой копии с базой, когда problemsState — checked. */
  problems?: number | null
  /** Находки сверки базы — общие для всех её копий. */
  baseProblems?: number | null
  problemsState?: ProblemsState | null
  /** Стоит у основной копии проекта: каталог, куда кит кладёт новые копии. */
  copiesDir?: string | null
  sessionState?: SessionState | null
  backgroundSession?: boolean
  vsCodeSession?: boolean
  /** Буквы номеров проекта: по ним номер задачи отделяется от заголовка. */
  letters?: string | null
}

export interface WorkspaceGroup {
  base: string
  project: string
  rows: WorkspaceRow[]
}

/** Только что заведённая копия: её строка отмечена, пока висит уведомление. */
export interface FreshCopy {
  base: string
  name: string | null
}

export type KitState = 'not-set' | 'not-found'

export const COLUMN_COUNT = 8

export const WORKTREES_COLUMNS = ['Копия', '№', 'Задача', 'Этап', 'Прогресс', 'Статус', 'Проблемы', 'Действия'] as const

/** Сколько длится чтение моковых копий. */
export const MOCK_LOAD_MS = 600

/** Сколько раздел читает данные, прежде чем показать заготовку: быстрая загрузка обходится без неё. */
export const SKELETON_DELAY_MS = 300

/** Сколько висит уведомление внизу справа. */
export const TOAST_MS = 5000

/** Сколько строка заведённой копии остаётся отмеченной. */
export const FRESH_MS = 8000

export const TABLE_HEAD_CELL =
  'whitespace-nowrap border-b border-kit-subtle px-4 py-2.5 text-left text-xs font-normal uppercase tracking-[0.05em] text-kit-secondary'

/** Ячейка строки без white-space: колонка задачи переносится, остальные — нет. */
export const TABLE_CELL = 'border-b border-kit-subtle px-4 py-2.5 align-middle'

export const STATUS_LABELS: Record<WorkspaceStatus, string> = {
  free: 'Свободна',
  starting: 'Запускается',
  'in-work': 'В работе',
  waiting: 'Ждёт оператора',
  unread: 'Ответ не прочитан',
}

export const SESSION_LABELS: Record<SessionState, string> = {
  working: 'сессия работает',
  waiting: 'сессия ждёт вас в терминале',
  idle: 'сессия стоит без дела',
}

export const NO_SESSION_LABEL = 'сессии нет'

export const PROBLEMS_STATE_LABELS: Record<Exclude<ProblemsState, 'checked'>, string> = {
  pending: 'проверяется',
  'kit-not-set': 'кит не задан',
  'kit-not-found': 'кит не найден',
  failed: 'сверка не выполнена',
}

/** Без оператора работа в копии стоит: ждёт его ответа или сессии, которая прочтёт ответ. */
export function needsOperator(row: WorkspaceRow): boolean {
  return row.status === 'waiting' || row.status === 'unread'
}

/** Задача в копии идёт, а ответ оператора прочесть и работу продолжить некому. */
export function needsTaskSession(row: WorkspaceRow): boolean {
  const inWork = row.status === 'in-work' || row.status === 'waiting' || row.status === 'unread'
  return inWork && !row.backgroundSession && !row.vsCodeSession
}

export function rowKey(row: WorkspaceRow): string {
  return `${row.base}|${row.path}`
}

/** Имя копии — последний каталог её пути. */
export function copyName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path
}

/** Группа — база копий; группы и копии в них идут в порядке, в каком пришли строки. */
export function groupByBase(rows: WorkspaceRow[]): WorkspaceGroup[] {
  const groups = new Map<string, WorkspaceGroup>()
  for (const row of rows) {
    const group = groups.get(row.base)
    if (group) group.rows.push(row)
    else groups.set(row.base, { base: row.base, project: row.project, rows: [row] })
  }
  return [...groups.values()]
}

export function isFresh(row: WorkspaceRow, fresh: FreshCopy | null): boolean {
  return fresh?.name != null && row.base === fresh.base && row.branch === fresh.name
}

/** Без кита числа проблем нет ни у одной строки: причина — одной плашкой над таблицей. */
export function kitStateOf(rows: WorkspaceRow[]): KitState | null {
  const state = rows.find((row) => row.problemsState === 'kit-not-set' || row.problemsState === 'kit-not-found')
    ?.problemsState
  if (state === 'kit-not-set') return 'not-set'
  if (state === 'kit-not-found') return 'not-found'
  return null
}

/** Число и существительное: 1 ошибка, 2 ошибки, 5 ошибок. */
export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`
  return `${count} ${many}`
}

// Номер записи бэклога: буквы проекта и число, «ORD-12». Кириллические двойники латинских букв
// в номере, набранном руками, ничего не значат: «в-7» — тот же номер, что «B-7».
const NUMBER_FORMAT = /^([A-Z][A-Z0-9]{0,9})-\d+$/

const LATIN_TWINS: Record<string, string> = {
  А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X',
}

const NUMBERED_TASK = /^(\S+)\s+(.+)$/

function normalizeNumber(text: string): string | null {
  const number = [...text.trim().toUpperCase()].map((c) => LATIN_TWINS[c] ?? c).join('')
  return NUMBER_FORMAT.test(number) ? number : null
}

function numberLetters(number: string): string | null {
  return NUMBER_FORMAT.exec(normalizeNumber(number) ?? '')?.[1] ?? null
}

/** Номер задачи из бэклога отделяется от заголовка, только если начат буквами проекта. */
export function splitTask(task: string, letters: string | null | undefined): { number: string | null; title: string } {
  const match = NUMBERED_TASK.exec(task)
  const number = match ? normalizeNumber(match[1]) : null
  return number && match && letters && numberLetters(number) === letters
    ? { number, title: match[2] }
    : { number: null, title: task }
}

const NAME_WORDS = {
  first: ['brave', 'calm', 'quick', 'quiet', 'bright', 'gentle'],
  second: ['sunny', 'misty', 'snowy', 'windy', 'starry', 'rainy'],
  third: ['otter', 'falcon', 'badger', 'heron', 'lynx', 'marten'],
}

function pick(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)]
}

/** Имя, которое кит придумал бы сам, например brave-sunny-otter. */
export function mockCopyName(): string {
  return `${pick(NAME_WORDS.first)}-${pick(NAME_WORDS.second)}-${pick(NAME_WORDS.third)}`
}

const APP_BASE = 'D:\\Projects\\app-knowledge'
const NOTA_BASE = 'D:\\Projects\\nota-knowledge'

/** Строки из фикстур App.test.tsx agents-kit-web, собранные в одну таблицу. */
export const MOCK_WORKSPACE_ROWS: WorkspaceRow[] = [
  {
    project: 'app-knowledge',
    base: APP_BASE,
    path: 'D:\\Projects\\app-main',
    branch: 'main',
    task: null,
    flowStep: null,
    progress: null,
    status: 'free',
    error: null,
    copiesDir: 'D:\\Projects',
    problemsState: 'checked',
    baseProblems: 2,
    problems: 0,
  },
  {
    project: 'app-knowledge',
    base: APP_BASE,
    path: 'D:\\Projects\\app',
    branch: 'feat/table',
    task: 'B-24 Номер задачи отдельной колонкой',
    flowStep: 'Реализация',
    progress: 33,
    status: 'waiting',
    error: null,
    sessionState: 'idle',
    backgroundSession: true,
    letters: 'B',
    problemsState: 'checked',
    baseProblems: 2,
    problems: 0,
  },
  {
    project: 'app-knowledge',
    base: APP_BASE,
    path: 'D:\\Projects\\app-wt',
    branch: 'dev',
    task: null,
    flowStep: null,
    progress: null,
    status: 'free',
    error: null,
    sessionState: 'working',
    problemsState: 'checked',
    baseProblems: 2,
    problems: 1,
  },
  {
    project: 'app-knowledge',
    base: APP_BASE,
    path: 'D:\\Projects\\left',
    branch: 'feat/table-left',
    task: 'Таблица рабочих копий',
    flowStep: 'Реализация',
    progress: 58,
    status: 'in-work',
    error: null,
    sessionState: null,
    letters: 'B',
  },
  {
    project: 'app-knowledge',
    base: APP_BASE,
    path: 'D:\\Projects\\app-2',
    branch: 'feat/unread',
    task: 'Задача не из бэклога',
    flowStep: 'Проверка',
    progress: 80,
    status: 'unread',
    error: null,
    sessionState: null,
    letters: 'B',
  },
  {
    project: 'app-knowledge',
    base: APP_BASE,
    path: 'E:\\gone',
    branch: null,
    task: null,
    flowStep: null,
    progress: null,
    status: null,
    error: 'Копия не найдена на диске',
  },
  {
    project: 'Nota',
    base: NOTA_BASE,
    path: 'D:\\Projects\\nota',
    branch: 'main',
    task: 'ORD-12 Выгрузка заказов за период',
    flowStep: 'Ревью',
    progress: 75,
    status: 'waiting',
    error: null,
    sessionState: 'waiting',
    vsCodeSession: true,
    letters: 'ORD',
    copiesDir: 'D:\\Projects',
  },
  {
    project: 'Nota',
    base: NOTA_BASE,
    path: 'D:\\Projects\\orders-2',
    branch: 'fix/utf',
    task: 'UTF-8 в именах файлов ломает выгрузку',
    flowStep: null,
    progress: null,
    status: 'starting',
    error: null,
    sessionState: 'working',
    backgroundSession: true,
    letters: 'ORD',
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
      rows.value = MOCK_WORKSPACE_ROWS.map((row) => ({ ...row }))
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
