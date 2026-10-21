<script setup lang="ts">
import { computed } from 'vue'
import {
  OCCUPANCY_LABELS,
  TABLE_CELL,
  TABLE_STICKY_FIRST,
  TABLE_STICKY_FIRST_FRESH,
  copyName,
  type WorktreeOccupancy,
  type WorkspaceRow,
} from '@/views/worktrees/helper'
import WorktreesRowMenu from '@/views/worktrees/components/WorktreesRowMenu.vue'
import WorktreesTaskCells from '@/views/worktrees/components/WorktreesTaskCells.vue'

const props = defineProps<{
  row: WorkspaceRow
  fresh: boolean
}>()

const OCCUPANCY_CLASSES: Record<WorktreeOccupancy, string> = {
  busy: 'border-transparent bg-kit-active-bg text-kit-active-text before:size-1.5 before:bg-kit-active-text',
  free: 'border-transparent bg-kit-free-bg text-kit-secondary before:size-[7px] before:border-[1.5px] before:border-kit-secondary',
}

// Подключённая копия отмечена заливкой всех ячеек, пока висит уведомление
const cell = computed(() => [TABLE_CELL, props.fresh && 'bg-kit-active-bg'])

const stickyCell = computed(() => [
  TABLE_CELL,
  props.fresh ? TABLE_STICKY_FIRST_FRESH : TABLE_STICKY_FIRST,
  'group-hover/row:bg-kit-surface',
])

const name = computed(() => copyName(props.row.path))

const occupancyClass = computed(() => OCCUPANCY_CLASSES[props.row.occupancy])
</script>

<template>
  <tr class="group/row hover:bg-kit-surface">
    <td :title="row.path" :class="[stickyCell, 'whitespace-nowrap']">
      <div class="flex flex-wrap items-center gap-2">
        <div class="min-w-0" :class="!row.exists && 'text-kit-secondary'">
          <div class="font-medium">{{ name }}</div>
          <div v-if="row.branch" class="mt-0.5 font-mono text-xs text-kit-secondary">
            {{ row.branch }}
          </div>
        </div>
        <span
          v-if="!row.exists"
          class="inline-flex items-center whitespace-nowrap rounded border border-kit-error-border bg-kit-error-bg px-1.5 text-[11px] font-medium text-kit-error-text"
          title="Каталог копии отсутствует"
        >
          Не найдена
        </span>
        <span
          v-if="fresh"
          class="inline-flex rounded border border-kit-active-border bg-kit-active-bg px-1.5 text-[11px] font-medium text-kit-active-text"
        >
          новая
        </span>
        <span
          v-if="row.main"
          class="inline-flex items-center rounded border border-kit-subtle bg-kit-surface-hover px-1.5 text-[11px] font-medium text-kit-secondary"
        >
          Основная
        </span>
      </div>
    </td>

    <WorktreesTaskCells :row="row" :cell-class="cell" />

    <td :class="[cell, 'whitespace-nowrap']">
      <span
        class="inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium before:rounded-full before:content-['']"
        :class="occupancyClass"
      >
        {{ OCCUPANCY_LABELS[row.occupancy] }}
      </span>
    </td>
    <td :class="[cell, 'whitespace-nowrap']">
      <div class="flex items-center justify-end gap-2">
        <WorktreesRowMenu v-if="row.exists" :row="row" />
      </div>
    </td>
  </tr>
</template>
