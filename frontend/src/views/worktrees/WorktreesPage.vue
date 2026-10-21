<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppButton from '@/components/AppButton/AppButton.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import WorktreesSkeleton from '@/views/worktrees/components/WorktreesSkeleton.vue'
import WorktreesTable from '@/views/worktrees/components/WorktreesTable.vue'
import WorktreesToast from '@/views/worktrees/components/WorktreesToast.vue'
import ConnectWorkspaceDialog from '@/views/worktrees/dialogs/ConnectWorkspaceDialog.vue'
import DeleteWorkspaceDialog from '@/views/worktrees/dialogs/DeleteWorkspaceDialog.vue'
import { provideWorktreesDialogs } from '@/views/worktrees/dialogs/helper'
import {
  FRESH_MS,
  copyName,
  provideWorktreesNotify,
  useToast,
  type FreshCopy,
  type WorkspaceRow,
} from '@/views/worktrees/helper'
import { useWorktreesStore } from '@/views/worktrees/worktreesStore'

const worktrees = useWorktreesStore()
const { rows, projects, error, loading, skeletonShown, revealing } = storeToRefs(worktrees)
const { endReveal, retry, refresh, removeRow, dispose } = worktrees

onMounted(() => {
  void worktrees.load()
})

onUnmounted(() => {
  dispose()
})

const { toast, notify } = useToast()
const { dialog, closeDialog, openConnect } = provideWorktreesDialogs()
provideWorktreesNotify(notify)

const fresh = shallowRef<FreshCopy | null>(null)

watch(fresh, (value, _previous, onCleanup) => {
  if (!value) return
  const timer = window.setTimeout(() => (fresh.value = null), FRESH_MS)
  onCleanup(() => window.clearTimeout(timer))
})

async function onConnected(path: string, knowledge: string) {
  closeDialog()
  fresh.value = { knowledge, path }
  await refresh()
  notify({
    icon: 'check',
    parts: [{ text: 'Копия ' }, { text: copyName(path), code: true }, { text: ' подключена' }],
  })
}

function onAgentsWarning(text: string) {
  notify({ icon: 'warning', plain: true, parts: [{ text }] })
}

function onRemoved(row: WorkspaceRow) {
  closeDialog()
  removeRow(row)
  notify({
    icon: 'trash',
    plain: true,
    parts: [{ text: 'Копия ' }, { text: copyName(row.path), code: true }, { text: ' удалена' }],
  })
}
</script>

<template>
  <div class="flex items-center justify-between gap-3 px-6 pb-3 pt-4">
    <div class="flex items-center gap-2">
      <h2 class="m-0 text-base font-medium">Рабочие копии</h2>
      <AppButton
        class="box-border h-8 w-8 justify-center !bg-kit-base !p-0"
        aria-label="Обновить"
        title="Обновить"
        :disabled="loading && rows === null"
        @click="refresh"
      >
        <AppIcon name="refresh" />
      </AppButton>
    </div>
    <AppButton class="h-8" variant="add" :disabled="!rows || loading || projects.length === 0" @click="openConnect">
      <AppIcon name="plus" />
      Добавить
    </AppButton>
  </div>

  <div v-if="error && rows === null" class="px-6 py-8">
    <p class="m-0 text-kit-error-text">{{ error.message }}</p>
    <p v-if="error.hint" class="m-0 mt-1 text-sm text-kit-secondary">{{ error.hint }}</p>
    <AppButton class="mt-4" @click="retry">Повторить</AppButton>
  </div>

  <WorktreesSkeleton v-else-if="rows === null" :shown="skeletonShown" />
  <template v-else>
    <p
      v-if="error"
      class="mx-6 mb-3 rounded border border-kit-error-border bg-kit-error-bg px-3 py-2 text-sm text-kit-error-text"
    >
      {{ error.message }}
      <AppButton size="sm" class="ml-2" @click="retry">Обновить</AppButton>
    </p>
    <div :class="{ 'animate-loaded-in motion-reduce:animate-none': revealing }" @animationend.self="endReveal">
      <WorktreesTable :fresh="fresh" />
    </div>
    <p v-if="rows.length === 0" class="m-0 px-6 py-8 text-kit-secondary">
      Нет отслеживаемых проектов или рабочих копий. Проекты добавляются в разделе «Настройки».
    </p>
  </template>

  <ConnectWorkspaceDialog
    v-if="dialog?.kind === 'connect' && rows"
    @close="closeDialog"
    @connected="onConnected"
    @agents-warning="onAgentsWarning"
  />
  <DeleteWorkspaceDialog v-else-if="dialog?.kind === 'remove'" :row="dialog.row" @close="closeDialog" @removed="onRemoved" />

  <WorktreesToast v-if="toast" :message="toast" />
</template>
