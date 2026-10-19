import { inject, provide, shallowRef, type InjectionKey } from 'vue'
import type { WorkspaceRow } from '@/views/worktrees/helper'

export type WorktreesDialog =
  | { kind: 'create' }
  | { kind: 'remove'; row: WorkspaceRow }
  | { kind: 'reply'; row: WorkspaceRow }

export interface WorktreesDialogOpeners {
  openCreate: () => void
  openRemove: (row: WorkspaceRow) => void
  openReply: (row: WorkspaceRow) => void
}

const worktreesDialogsKey: InjectionKey<WorktreesDialogOpeners> = Symbol('worktrees-dialogs')

/** Окна раздела: одно открытое за раз; открыть его может любая строка таблицы. */
export function provideWorktreesDialogs() {
  const dialog = shallowRef<WorktreesDialog | null>(null)

  const openers: WorktreesDialogOpeners = {
    openCreate: () => (dialog.value = { kind: 'create' }),
    openRemove: (row) => (dialog.value = { kind: 'remove', row }),
    openReply: (row) => (dialog.value = { kind: 'reply', row }),
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

/** Сколько «кит» делает моковое действие. */
export const MOCK_ACTION_MS = 700

/** kit — дорога в «Настройки»; refused — слова кита, их панель не переписывает. */
export type DialogFailure = { kind: 'kit' | 'refused' | 'other'; text: string }

/** Проект в окне новой копии: база, копия, от которой кит заводит новые, и свободные копии. */
export interface NewWorkspaceProject {
  base: string
  name: string
  source: WorkspaceRow | null
  free: WorkspaceRow[]
}

export function projectsOf(rows: WorkspaceRow[]): NewWorkspaceProject[] {
  const projects = new Map<string, NewWorkspaceProject>()
  for (const row of rows) {
    const project = projects.get(row.base) ?? { base: row.base, name: row.project, source: null, free: [] }
    projects.set(row.base, project)
    if (row.error) continue
    if (row.copiesDir) project.source ??= row
    if (row.status === 'free') project.free.push(row)
  }
  return [...projects.values()]
}

const COPY_NAME_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Проверка имени копии так, как её сделал бы кит; null — имя годится. */
export function copyNameProblem(name: string, taken: string[]): string | null {
  if (!COPY_NAME_FORMAT.test(name)) return `Имя «${name}» не подходит: нужна строчная латиница и цифры через дефис.`
  if (taken.includes(name)) return `Копия «${name}» уже есть у проекта.`
  return null
}

/** Новая свободная копия от основной копии проекта. */
export function createdRow(source: WorkspaceRow, name: string): WorkspaceRow {
  const dir = source.copiesDir ?? source.path.replace(/[\\/][^\\/]+$/, '')
  return {
    project: source.project,
    base: source.base,
    path: `${dir}\\${name}`,
    branch: name,
    task: null,
    flowStep: null,
    progress: null,
    status: 'free',
    error: null,
    sessionState: null,
    problemsState: source.problemsState,
    baseProblems: source.baseProblems,
    problems: 0,
    letters: source.letters,
  }
}

export interface QuestionVariant {
  choice: string
  effect: string | null
  recommended: boolean
}

export interface OperatorQuestion {
  title: string
  context: string | null
  variants: QuestionVariant[]
}

export type ReplyTab = 'feed' | 'context' | 'artifacts'

export const REPLY_TABS: { id: ReplyTab; label: string }[] = [
  { id: 'feed', label: 'Переписка' },
  { id: 'context', label: 'Контекст' },
  { id: 'artifacts', label: 'Артефакты' },
]

/** Пока видно «Ответы отправлены агенту», отправку можно отменить. */
export const UNDO_MS = 1500

/** Записанные ответы уводят окно угасанием. */
export const FADE_MS = 220

export const EMPTY_ANSWER = 'Напишите свой ответ или выберите вариант'

/** Вопросы агента к оператору — мок вместо памяти копии. */
export function mockQuestions(row: WorkspaceRow): OperatorQuestion[] {
  return [
    {
      title: 'Как подписать колонку номера задачи?',
      context: `Задача «${row.task ?? 'без названия'}» дошла до этапа «${row.flowStep ?? '—'}». Колонка номера стоит перед заголовком задачи.`,
      variants: [
        { choice: '«№»', effect: 'Коротко, колонка ужимается по плашке номера', recommended: true },
        { choice: '«Номер»', effect: 'Понятнее, но колонка шире', recommended: false },
      ],
    },
    {
      title: 'Что показывать у задачи не из бэклога?',
      context: null,
      variants: [
        { choice: 'Прочерк', effect: 'Как у свободной копии', recommended: true },
        { choice: 'Пустую ячейку', effect: null, recommended: false },
      ],
    },
  ]
}
