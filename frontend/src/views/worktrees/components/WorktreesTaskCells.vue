<script setup lang="ts">
import { computed } from 'vue'
import { FOCUS_RING } from '@/components/AppButton/helper'
import {
  currentTask,
  stageLabel,
  stubMessage,
  useWorktreesNotify,
  type WorkspaceRow,
} from '@/views/worktrees/helper'
import WorktreesProgress from '@/views/worktrees/components/WorktreesProgress.vue'

const props = defineProps<{
  row: WorkspaceRow
  /** Заливка ячеек у только что подключённой копии. */
  cellClass: Array<string | false | undefined>
}>()

const notify = useWorktreesNotify()

/**
 * Сейчас показывается одна текущая задача (tasks[0]).
 * При появлении нескольких задач без правок кода сюда можно вывести список, не меняя колонки строки.
 */
const task = computed(() => currentTask(props.row))
const stage = computed(() => (task.value ? stageLabel(task.value) : null))

function openTask(id: string) {
  notify(stubMessage(`Карточка задачи ${id} ещё не перенесена`))
}
</script>

<template>
  <td :class="[cellClass, 'w-[1%] whitespace-nowrap pr-1', !task && 'text-kit-tertiary']">
    <button
      v-if="task"
      type="button"
      class="inline-block cursor-pointer rounded border border-kit-subtle bg-kit-surface-hover px-1.5 py-px font-mono text-xs font-medium tabular-nums text-kit-primary hover:border-kit-strong"
      :class="FOCUS_RING"
      :title="`Открыть ${task.id}`"
      @click="openTask(task.id)"
    >
      {{ task.id }}
    </button>
  </td>
  <td :class="[cellClass, 'w-[32%] whitespace-normal', !task && 'text-kit-tertiary']">
    <button
      v-if="task"
      type="button"
      class="cursor-pointer border-0 bg-transparent p-0 text-left text-kit-primary hover:underline"
      :class="FOCUS_RING"
      :title="`Открыть ${task.id}`"
      @click="openTask(task.id)"
    >
      {{ task.title }}
    </button>
  </td>
  <td :class="[cellClass, 'whitespace-nowrap', !stage && 'text-kit-tertiary']">
    {{ stage ?? '' }}
  </td>
  <td :class="[cellClass, 'whitespace-nowrap', (task?.progress == null) && 'text-kit-tertiary']">
    <WorktreesProgress v-if="task?.progress != null" :value="task.progress" />
  </td>
</template>
