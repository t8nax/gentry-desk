<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import AppButton from '@/components/AppButton/AppButton.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { useAppStore } from '@/stores/app'
import WorktreesSkeleton from '@/views/worktrees/components/WorktreesSkeleton.vue'
import WorktreesTable from '@/views/worktrees/components/WorktreesTable.vue'
import WorktreesToast from '@/views/worktrees/components/WorktreesToast.vue'
import DeleteWorkspaceDialog from '@/views/worktrees/dialogs/DeleteWorkspaceDialog.vue'
import NewWorkspaceDialog from '@/views/worktrees/dialogs/NewWorkspaceDialog.vue'
import ReplyDialog from '@/views/worktrees/dialogs/ReplyDialog.vue'
import { createdRow, provideWorktreesDialogs } from '@/views/worktrees/dialogs/helper'
import {
  FRESH_MS,
  copyName,
  needsOperator,
  provideWorktreesNotify,
  rowKey,
  stubMessage,
  useMockWorkspaceRows,
  useToast,
  type FreshCopy,
  type WorkspaceRow,
} from '@/views/worktrees/helper'

const appStore = useAppStore()
const { rows, skeletonShown, revealing, endReveal } = useMockWorkspaceRows()
const { toast, notify } = useToast()
const { dialog, closeDialog, openCreate } = provideWorktreesDialogs()
provideWorktreesNotify(notify)

const fresh = shallowRef<FreshCopy | null>(null)

const waitingCount = computed(() => rows.value?.filter(needsOperator).length ?? 0)

watch(waitingCount, (count) => appStore.setWaitingCount(count), { immediate: true })

watch(fresh, (value, _previous, onCleanup) => {
  if (!value) return
  const timer = window.setTimeout(() => (fresh.value = null), FRESH_MS)
  onCleanup(() => window.clearTimeout(timer))
})

function onCreated(source: WorkspaceRow, name: string) {
  closeDialog()
  rows.value?.push(createdRow(source, name))
  fresh.value = { base: source.base, name }
  notify({ icon: 'check', parts: [{ text: 'Копия ' }, { text: name, code: true }, { text: ' заведена' }] })
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

// Ответ прочтёт живая сессия копии; без неё ответ ждёт, пока сессию заведут
function onAnswered(row: WorkspaceRow) {
  const target = rows.value?.find((candidate) => rowKey(candidate) === rowKey(row))
  if (target) target.status = row.backgroundSession || row.vsCodeSession ? 'in-work' : 'unread'
}

function onSettings() {
  closeDialog()
  notify(stubMessage('Раздел «Настройки» ещё не перенесён'))
}
</script>

<template>
  <div class="flex items-baseline gap-3 px-6 pb-3 pt-4">
    <h2 class="m-0 text-base font-medium">Рабочие копии</h2>
    <!-- Отрицательный отступ не даёт кнопке опустить заголовок ниже, чем в других разделах -->
    <AppButton variant="add" class="-mt-2 self-baseline" :disabled="!rows" @click="openCreate">
      <AppIcon name="plus" />
      Новая копия
    </AppButton>
  </div>

  <WorktreesSkeleton v-if="rows === null" :shown="skeletonShown" />
  <template v-else>
    <div :class="{ 'animate-loaded-in motion-reduce:animate-none': revealing }" @animationend.self="endReveal">
      <WorktreesTable :rows="rows" :fresh="fresh" />
    </div>
    <p v-if="rows.length === 0" class="m-0 px-6 py-8 text-kit-secondary">
      Нет отслеживаемых баз или рабочих копий. Базы добавляются в разделе «Настройки».
    </p>
  </template>

  <NewWorkspaceDialog
    v-if="dialog?.kind === 'create' && rows"
    :rows="rows"
    @close="closeDialog"
    @created="onCreated"
    @settings="onSettings"
  />
  <DeleteWorkspaceDialog v-else-if="dialog?.kind === 'remove'" :row="dialog.row" @close="closeDialog" @removed="onRemoved" />
  <ReplyDialog v-else-if="dialog?.kind === 'reply'" :row="dialog.row" @close="closeDialog" @answered="onAnswered" />

  <WorktreesToast v-if="toast" :message="toast" />
</template>
