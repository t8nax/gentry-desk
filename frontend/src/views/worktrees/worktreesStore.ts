import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { ApiError, fetchWorktrees } from '@/api/worktrees'
import {
  SKELETON_DELAY_MS,
  mapScreenRow,
  rowKey,
  type LoadError,
  type WorkspaceProject,
  type WorkspaceRow,
} from '@/views/worktrees/helper'

export const useWorktreesStore = defineStore('worktrees', () => {
  const rows = ref<WorkspaceRow[] | null>(null)
  const projects = ref<WorkspaceProject[]>([])
  const error = shallowRef<LoadError | null>(null)
  const loading = shallowRef(false)
  const skeletonShown = shallowRef(false)
  const revealing = shallowRef(false)

  let skeletonTimer: number | undefined
  let abort: AbortController | null = null

  async function load(opts?: { silent?: boolean }) {
    abort?.abort()
    abort = new AbortController()
    const signal = abort.signal

    if (!opts?.silent) {
      error.value = null
      if (rows.value === null) {
        skeletonShown.value = false
        window.clearTimeout(skeletonTimer)
        skeletonTimer = window.setTimeout(() => (skeletonShown.value = true), SKELETON_DELAY_MS)
      }
    }
    loading.value = true

    try {
      const screen = await fetchWorktrees(signal)
      if (signal.aborted) return
      window.clearTimeout(skeletonTimer)
      revealing.value = skeletonShown.value && rows.value === null
      skeletonShown.value = false
      rows.value = screen.rows.map(mapScreenRow)
      projects.value = screen.projects.map((p) => ({ knowledge: p.knowledge, name: p.project }))
      error.value = null
    } catch (e) {
      if (signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) return
      window.clearTimeout(skeletonTimer)
      skeletonShown.value = false
      if (e instanceof ApiError) {
        error.value = { code: e.code, message: e.message, hint: e.hint }
      } else {
        error.value = {
          code: 'network',
          message: e instanceof Error ? e.message : 'Не удалось загрузить рабочие копии.',
          hint: null,
        }
      }
      // Не затираем уже показанные строки при фоновом обновлении; при первой загрузке rows остаётся null.
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  function endReveal() {
    revealing.value = false
  }

  function retry() {
    return load()
  }

  function refresh() {
    return load({ silent: rows.value !== null })
  }

  function removeRow(row: WorkspaceRow) {
    const key = rowKey(row)
    rows.value = rows.value?.filter((candidate) => rowKey(candidate) !== key) ?? null
  }

  function dispose() {
    window.clearTimeout(skeletonTimer)
    abort?.abort()
    abort = null
  }

  return {
    rows,
    projects,
    error,
    loading,
    skeletonShown,
    revealing,
    load,
    endReveal,
    retry,
    refresh,
    removeRow,
    dispose,
  }
})
