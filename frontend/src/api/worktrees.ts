/** HTTP-клиент экрана «Рабочие копии» к бэкенду панели. */

export interface ApiErrorBody {
  code: string
  message: string
  hint?: string | null
}

export class ApiError extends Error {
  readonly code: string
  readonly hint: string | null

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.code = body.code
    this.hint = body.hint ?? null
  }
}

export interface WorktreesScreenProject {
  project: string
  prefix: string
  knowledge: string
  main_worktree: string
}

export interface WorktreesScreenTaskProgress {
  passed: number
  total_min: number
  total_max: number
}

export interface WorktreesScreenTaskStage {
  node: string
  id: string
  title: string
  round: number
}

export interface WorktreesScreenTask {
  id: string
  title: string | null
  finished: boolean | null
  stage: WorktreesScreenTaskStage | null
  progress: WorktreesScreenTaskProgress | null
  percent: number | null
  details_unavailable: boolean
}

export interface WorktreesScreenRow {
  project: string
  knowledge: string
  path: string
  branch: string | null
  main: boolean
  exists: boolean
  occupancy: 'free' | 'busy'
  task: WorktreesScreenTask | null
}

export interface WorktreesScreen {
  projects: WorktreesScreenProject[]
  rows: WorktreesScreenRow[]
}

export interface WorktreeAddResult {
  path: string
  project: string
  main: boolean
  action: string
  agents?: {
    worktrees: unknown[]
    conflicts: Array<{ worktree: string; agent: string; file: string; reason: string }>
    error?: string | null
  } | null
}

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

async function readError(res: Response): Promise<ApiError> {
  try {
    const data = (await res.json()) as { error?: ApiErrorBody }
    if (data.error?.code && data.error.message) {
      return new ApiError(data.error)
    }
  } catch {
    // fall through
  }
  return new ApiError({
    code: 'http_error',
    message: `Запрос не выполнен (${res.status}).`,
  })
}

export async function fetchWorktrees(signal?: AbortSignal): Promise<WorktreesScreen> {
  const res = await fetch(`${API_BASE}/api/worktrees`, { signal })
  if (!res.ok) throw await readError(res)
  return (await res.json()) as WorktreesScreen
}

export async function addWorktree(project: string, path: string, signal?: AbortSignal): Promise<WorktreeAddResult> {
  const res = await fetch(`${API_BASE}/api/worktrees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, path }),
    signal,
  })
  if (!res.ok) throw await readError(res)
  return (await res.json()) as WorktreeAddResult
}
