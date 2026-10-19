<script setup lang="ts">
import { computed, onUnmounted, shallowRef } from 'vue'
import AppButton from '@/components/AppButton/AppButton.vue'
import AppDialog from '@/components/AppDialog/AppDialog.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { copyName, type WorkspaceRow } from '@/views/worktrees/helper'
import { MOCK_ACTION_MS, type DialogFailure } from '@/views/worktrees/dialogs/helper'

const props = defineProps<{
  row: WorkspaceRow
}>()

const emit = defineEmits<{
  close: []
  removed: [row: WorkspaceRow]
}>()

const busy = shallowRef(false)
const failure = shallowRef<DialogFailure | null>(null)
let timer: number | undefined

const name = computed(() => copyName(props.row.path))

function remove() {
  if (busy.value) return
  busy.value = true
  failure.value = null
  timer = window.setTimeout(() => {
    busy.value = false
    if (props.row.copiesDir) {
      failure.value = { kind: 'other', text: 'Это основная копия проекта: её не удаляют, от неё заводят новые.' }
      return
    }
    if (props.row.status !== 'free') {
      failure.value = { kind: 'other', text: 'В копии идёт задача — сначала её нужно закрыть.' }
      return
    }
    emit('removed', props.row)
  }, MOCK_ACTION_MS)
}

onUnmounted(() => window.clearTimeout(timer))
</script>

<template>
  <AppDialog :locked="busy" @close="emit('close')">
    <div
      class="flex max-h-[90vh] w-[600px] max-w-full flex-col overflow-hidden rounded-lg border border-kit-strong bg-kit-surface shadow-[0_24px_48px_var(--kit-shadow)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-workspace-title"
    >
      <div class="flex items-center gap-3 px-5 pb-1 pt-[18px]">
        <span class="inline-flex text-kit-error-text" aria-hidden="true">
          <AppIcon name="trash" />
        </span>
        <h3 id="delete-workspace-title" class="m-0 text-[15px] font-semibold">Удалить рабочую копию</h3>
        <AppButton variant="icon" class="ml-auto" aria-label="Закрыть" :disabled="busy" @click="emit('close')">
          <AppIcon name="close" />
        </AppButton>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
        <p class="m-0 text-[13px] text-kit-secondary">
          Удалить копию
          <span class="font-mono text-kit-primary">{{ name }}</span>
          проекта
          <span class="font-medium text-kit-primary">{{ row.project }}</span>?
        </p>
        <p v-if="failure" class="mt-3 rounded-md border border-kit-error-border bg-kit-error-bg px-3 py-2 text-[13px] text-kit-error-text" role="alert">
          {{ failure.text }}
        </p>
      </div>

      <div class="flex justify-end gap-2 border-t border-kit-subtle px-5 py-3.5">
        <AppButton type="button" :disabled="busy" @click="emit('close')">Отмена</AppButton>
        <AppButton type="button" variant="danger" :disabled="busy" @click="remove">
          {{ busy ? 'Удаляется…' : 'Удалить' }}
        </AppButton>
      </div>
    </div>
  </AppDialog>
</template>
