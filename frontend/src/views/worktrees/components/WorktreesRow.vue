<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { FOCUS_RING } from '@/components/AppButton/helper'
import { useWorktreesDialogs } from '@/views/worktrees/dialogs/helper'
import {
  NO_SESSION_LABEL,
  SESSION_LABELS,
  STATUS_LABELS,
  TABLE_CELL,
  copyName,
  needsOperator,
  splitTask,
  stubMessage,
  useWorktreesNotify,
  type SessionState,
  type WorkspaceRow,
  type WorkspaceStatus,
} from '@/views/worktrees/helper'
import WorktreesProblemsButton from '@/views/worktrees/components/WorktreesProblemsButton.vue'
import WorktreesProgress from '@/views/worktrees/components/WorktreesProgress.vue'
import WorktreesRowMenu from '@/views/worktrees/components/WorktreesRowMenu.vue'

const props = defineProps<{
  row: WorkspaceRow
  fresh: boolean
}>()

const { openReply } = useWorktreesDialogs()
const notify = useWorktreesNotify()

const STATUS_CLASSES: Record<WorkspaceStatus, string> = {
  'in-work': 'border-transparent bg-kit-active-bg text-kit-active-text before:size-1.5 before:bg-kit-active-text',
  waiting:
    'border-kit-waiting-border bg-kit-waiting-bg text-kit-waiting-text animate-pulse-border motion-reduce:animate-none before:size-1.5 before:bg-kit-waiting-text',
  free: 'border-transparent bg-kit-free-bg text-kit-secondary before:size-[7px] before:border-[1.5px] before:border-kit-secondary',
  // Цвет ожидания без заливки и пульса, точка кольцом: работа стоит, но ждёт не ответа
  unread:
    'border-kit-waiting-border bg-transparent text-kit-waiting-text before:size-[7px] before:border-[1.5px] before:border-kit-waiting-text',
  starting:
    'border-transparent bg-kit-free-bg text-kit-secondary before:size-1.5 before:bg-kit-secondary before:animate-blink motion-reduce:before:animate-none',
}

const SESSION_CLASSES: Record<SessionState | 'none', string> = {
  working: 'bg-kit-active-text shadow-[0_0_0_3px_var(--kit-active-bg)]',
  waiting: 'bg-kit-waiting-fill shadow-[0_0_0_3px_var(--kit-waiting-bg)]',
  idle: 'bg-kit-secondary',
  none: 'border border-kit-strong',
}

// Заведённая копия отмечена заливкой всех ячеек, пока висит уведомление
const cell = computed(() => [TABLE_CELL, props.fresh && 'bg-kit-active-bg'])

const name = computed(() => copyName(props.row.path))

const task = computed(() => (props.row.task === null ? null : splitTask(props.row.task, props.row.letters)))

const sessionLabel = computed(() => (props.row.sessionState ? SESSION_LABELS[props.row.sessionState] : NO_SESSION_LABEL))

const sessionClass = computed(() => SESSION_CLASSES[props.row.sessionState ?? 'none'])

const statusClass = computed(() => (props.row.status ? STATUS_CLASSES[props.row.status] : ''))

const showsProblems = computed(() => props.row.problemsState === 'checked' && !!props.row.problems)

function openProblems() {
  notify(stubMessage('Раздел «Проблемы баз» ещё не перенесён'))
}
</script>

<template>
  <tr class="hover:bg-kit-surface">
    <td
      :title="row.path"
      :class="[cell, 'whitespace-nowrap', fresh && 'shadow-[inset_2px_0_0_var(--kit-active-text)]']"
    >
      <div class="flex items-center gap-[9px] font-medium">
        <!-- Строке с ошибкой точку ставить не о чем: копии на диске нет или её не прочитали -->
        <span
          v-if="!row.error"
          class="inline-block size-2 shrink-0 rounded-full"
          :class="sessionClass"
          role="img"
          :aria-label="sessionLabel"
          :title="sessionLabel"
        />
        {{ name }}
        <span
          v-if="fresh"
          class="ml-2 inline-flex rounded border border-kit-active-border bg-kit-active-bg px-1.5 text-[11px] font-medium text-kit-active-text"
        >
          новая
        </span>
        <span
          v-if="row.copiesDir"
          class="ml-2 inline-flex items-center rounded border border-kit-subtle bg-kit-surface-hover px-1.5 text-[11px] font-medium text-kit-secondary"
        >
          Основная
        </span>
      </div>
      <div v-if="row.branch" class="mt-0.5 font-mono text-xs text-kit-secondary" :class="{ 'ml-[17px]': !row.error }">
        {{ row.branch }}
      </div>
    </td>

    <td v-if="row.error" :class="[cell, 'w-[32%] whitespace-normal']" colspan="5">
      <span class="inline-flex items-center gap-1.5 text-kit-error-text">
        <AppIcon name="warning" />
        {{ row.error }}
      </span>
    </td>
    <template v-else>
      <td :class="[cell, 'w-[1%] whitespace-nowrap pr-1', !task?.number && 'text-kit-tertiary']">
        <span
          v-if="task?.number"
          class="inline-block rounded border border-kit-subtle bg-kit-surface-hover px-1.5 py-px font-mono text-xs font-medium tabular-nums"
        >
          {{ task.number }}
        </span>
        <template v-else>—</template>
      </td>
      <td :class="[cell, 'w-[32%] whitespace-normal', !task && 'text-kit-tertiary']">
        {{ task?.title ?? '—' }}
      </td>
      <td :class="[cell, 'whitespace-nowrap', !row.flowStep && 'text-kit-tertiary']">
        {{ row.flowStep ?? '—' }}
      </td>
      <td :class="[cell, 'whitespace-nowrap', row.progress === null && 'text-kit-tertiary']">
        <template v-if="row.progress === null">—</template>
        <WorktreesProgress v-else :value="row.progress" :waiting="needsOperator(row)" />
      </td>
      <td :class="[cell, 'whitespace-nowrap']">
        <span
          v-if="row.status"
          class="inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium before:rounded-full before:content-['']"
          :class="statusClass"
        >
          {{ STATUS_LABELS[row.status] }}
        </span>
      </td>
    </template>

    <td :class="[cell, 'whitespace-nowrap']">
      <WorktreesProblemsButton v-if="!row.error && showsProblems" :count="row.problems ?? 0" owner="копии" @open="openProblems" />
    </td>
    <td :class="[cell, 'whitespace-nowrap']">
      <div class="flex items-center justify-end gap-2">
        <button
          v-if="row.status === 'waiting'"
          type="button"
          class="cursor-pointer rounded border-none bg-kit-waiting-fill px-2.5 py-1 text-xs font-semibold text-kit-waiting-on hover:opacity-90"
          :class="FOCUS_RING"
          @click="openReply(row)"
        >
          Ответить
        </button>
        <!-- Строке с ошибкой открывать нечего -->
        <WorktreesRowMenu v-if="!row.error" :row="row" />
      </div>
    </td>
  </tr>
</template>
