<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import {
  COLUMN_COUNT,
  PROBLEMS_STATE_LABELS,
  isFresh,
  needsOperator,
  rowKey,
  stubMessage,
  useWorktreesNotify,
  type FreshCopy,
  type WorkspaceGroup,
} from '@/views/worktrees/helper'
import WorktreesProblemsButton from '@/views/worktrees/components/WorktreesProblemsButton.vue'
import WorktreesRow from '@/views/worktrees/components/WorktreesRow.vue'

const props = defineProps<{
  group: WorkspaceGroup
  collapsed: boolean
  fresh: FreshCopy | null
}>()

const emit = defineEmits<{
  toggle: []
}>()

const notify = useWorktreesNotify()

const waiting = computed(() => props.group.rows.some(needsOperator))

// Проблемы базы и почему их нет — один раз в заголовке группы: состояние проверки у копий базы общее
const baseProblems = computed(() => {
  const row = props.group.rows.find((candidate) => !candidate.error && candidate.problemsState)
  const state = row?.problemsState ?? null
  if (state === null || (state === 'checked' && !row?.baseProblems)) return null
  if (state !== 'checked') return { label: PROBLEMS_STATE_LABELS[state], count: null }
  return { label: null, count: row?.baseProblems ?? 0 }
})

const toggleLabel = computed(() => `${props.collapsed ? 'Развернуть' : 'Свернуть'} ${props.group.project}`)

function openProblems() {
  notify(stubMessage('Раздел «Проблемы баз» ещё не перенесён'))
}
</script>

<template>
  <tbody>
    <tr>
      <!-- Сворачивает клик по всей шапке; клавиатуре и диктору — кнопка-стрелка, её клик всплывает сюда же -->
      <th
        scope="rowgroup"
        :colspan="COLUMN_COUNT"
        class="group cursor-pointer select-none border-b border-kit-strong px-3 py-2 text-left text-[13px] font-normal text-kit-primary hover:bg-kit-surface"
        @click="emit('toggle')"
      >
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="inline-flex cursor-pointer rounded border-none bg-transparent p-0.5 text-kit-secondary hover:bg-kit-surface-hover hover:text-kit-primary group-hover:text-kit-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kit-primary"
            :aria-expanded="!collapsed"
            :aria-label="toggleLabel"
            :title="collapsed ? 'Развернуть' : 'Свернуть'"
          >
            <AppIcon
              name="chevron-down"
              :size="14"
              class="transition-transform duration-150 motion-reduce:transition-none"
              :class="{ '-rotate-90': collapsed }"
            />
          </button>
          <span class="font-semibold">{{ group.project }}</span>
          <!-- У свёрнутой группы ожидание держит точка -->
          <span
            v-if="collapsed && waiting"
            class="size-1.5 rounded-full bg-kit-waiting-fill"
            title="Есть копии, ждущие оператора"
          >
            <span class="sr-only">есть копии, ждущие оператора</span>
          </span>
          <!-- Число проблем ведёт в свой раздел и группу не сворачивает -->
          <span v-if="baseProblems" class="ml-auto text-xs" @click.stop>
            <span v-if="baseProblems.label" class="text-kit-tertiary">{{ baseProblems.label }}</span>
            <WorktreesProblemsButton v-else :count="baseProblems.count ?? 0" owner="базы" @open="openProblems" />
          </span>
        </div>
      </th>
    </tr>
    <template v-if="!collapsed">
      <WorktreesRow v-for="row in group.rows" :key="rowKey(row)" :row="row" :fresh="isFresh(row, fresh)" />
    </template>
  </tbody>
</template>
