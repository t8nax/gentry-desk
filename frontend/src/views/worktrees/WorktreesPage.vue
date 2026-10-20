<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import AppButton from '@/components/AppButton/AppButton.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import WorktreesSkeleton from '@/views/worktrees/components/WorktreesSkeleton.vue'
import WorktreesTable from '@/views/worktrees/components/WorktreesTable.vue'
import WorktreesToast from '@/views/worktrees/components/WorktreesToast.vue'
import ConnectWorkspaceDialog from '@/views/worktrees/dialogs/ConnectWorkspaceDialog.vue'
import DeleteWorkspaceDialog from '@/views/worktrees/dialogs/DeleteWorkspaceDialog.vue'
import { connectedRow, provideWorktreesDialogs, type ConnectWorkspaceProject } from '@/views/worktrees/dialogs/helper'
import {
  FRESH_MS,
  copyName,
  provideWorktreesNotify,
  rowKey,
  useMockWorkspaceRows,
  useToast,
  type FreshCopy,
  type WorkspaceRow,
} from '@/views/worktrees/helper'

const { rows, skeletonShown, revealing, endReveal } = useMockWorkspaceRows()
const { toast, notify } = useToast()
const { dialog, closeDialog, openConnect } = provideWorktreesDialogs()
provideWorktreesNotify(notify)

const fresh = shallowRef<FreshCopy | null>(null)

watch(fresh, (value, _previous, onCleanup) => {
  if (!value) return
  const timer = window.setTimeout(() => (fresh.value = null), FRESH_MS)
  onCleanup(() => window.clearTimeout(timer))
})

function onConnected(project: ConnectWorkspaceProject, path: string) {
  closeDialog()
  const row = connectedRow(project, path)
  rows.value?.push(row)
  fresh.value = { knowledge: row.knowledge, path: row.path }
  notify({
    icon: 'check',
    parts: [{ text: 'Копия ' }, { text: copyName(row.path), code: true }, { text: ' подключена' }],
  })
}

function onRemoved(row: WorkspaceRow) {
  closeDialog()
  const key = rowKey(row)
  rows.value = rows.value?.filter((candidate) => rowKey(candidate) !== key) ?? null
  notify({
    icon: 'trash',
    plain: true,
    parts: [{ text: 'Копия ' }, { text: copyName(row.path), code: true }, { text: ' удалена' }],
  })
}
</script>

<template>
  <div class="flex items-baseline gap-3 px-6 pb-3 pt-4">
    <h2 class="m-0 text-base font-medium">Рабочие копии</h2>
    <!-- Отрицательный отступ не даёт кнопке опустить заголовок ниже, чем в других разделах -->
    <AppButton variant="add" class="-mt-2 self-baseline" :disabled="!rows" @click="openConnect">
      <AppIcon name="plus" />
      Подключить копию
    </AppButton>
  </div>

  <WorktreesSkeleton v-if="rows === null" :shown="skeletonShown" />
  <template v-else>
    <div :class="{ 'animate-loaded-in motion-reduce:animate-none': revealing }" @animationend.self="endReveal">
      <WorktreesTable :rows="rows" :fresh="fresh" />
    </div>
    <p v-if="rows.length === 0" class="m-0 px-6 py-8 text-kit-secondary">
      Нет отслеживаемых проектов или рабочих копий. Проекты добавляются в разделе «Настройки».
    </p>
  </template>

  <ConnectWorkspaceDialog
    v-if="dialog?.kind === 'connect' && rows"
    :rows="rows"
    @close="closeDialog"
    @connected="onConnected"
  />
  <DeleteWorkspaceDialog v-else-if="dialog?.kind === 'remove'" :row="dialog.row" @close="closeDialog" @removed="onRemoved" />

  <WorktreesToast v-if="toast" :message="toast" />
</template>
