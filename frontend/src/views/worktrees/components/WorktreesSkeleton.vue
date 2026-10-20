<script setup lang="ts">
import { COLUMN_COUNT, TABLE_CELL } from '@/views/worktrees/helper'
import WorktreesHead from '@/views/worktrees/components/WorktreesHead.vue'

defineProps<{
  /** Пока загрузка не затянулась, полосы держат место невидимыми; шапка колонок видна сразу. */
  shown: boolean
}>()

interface SkeletonRow {
  name: number
  branch: number
  task: string
  stage: number
  badge: number
}

interface SkeletonGroup {
  width: number
  rows: SkeletonRow[]
}

const GROUPS: SkeletonGroup[] = [
  {
    width: 118,
    rows: [
      { name: 104, branch: 150, task: '72%', stage: 84, badge: 84 },
      { name: 88, branch: 124, task: '58%', stage: 96, badge: 72 },
      { name: 96, branch: 138, task: '64%', stage: 70, badge: 72 },
    ],
  },
  {
    width: 86,
    rows: [
      { name: 70, branch: 110, task: '48%', stage: 84, badge: 72 },
      { name: 92, branch: 132, task: '66%', stage: 90, badge: 72 },
    ],
  },
]

function bar(width: number | string, height: number) {
  return { width: typeof width === 'number' ? `${width}px` : width, height: `${height}px` }
}
</script>

<template>
  <div class="worktrees-skeleton" role="status" aria-busy="true" aria-label="Загрузка рабочих копий">
    <table class="w-full border-collapse" aria-hidden="true">
      <WorktreesHead />
      <tbody v-for="(group, groupIndex) in GROUPS" :key="groupIndex" class="pointer-events-none" :class="{ invisible: !shown }">
        <tr>
          <th :colspan="COLUMN_COUNT" class="border-b border-kit-strong px-3 py-2 text-left">
            <div class="flex items-center gap-2.5">
              <span class="worktrees-skeleton__bar" :style="bar(14, 14)" />
              <span class="worktrees-skeleton__bar" :style="bar(group.width, 12)" />
            </div>
          </th>
        </tr>
        <tr v-for="(row, rowIndex) in group.rows" :key="rowIndex">
          <td :class="TABLE_CELL">
            <div class="flex items-center gap-[9px]">
              <span class="worktrees-skeleton__bar" :style="bar(row.name, 11)" />
            </div>
            <div class="mt-0.5">
              <span class="worktrees-skeleton__bar" :style="bar(row.branch, 8)" />
            </div>
          </td>
          <td :class="[TABLE_CELL, 'w-[1%] pr-1']">
            <span class="worktrees-skeleton__bar" :style="bar(46, 18)" />
          </td>
          <td :class="[TABLE_CELL, 'w-[32%]']">
            <span class="worktrees-skeleton__bar" :style="bar(row.task, 11)" />
          </td>
          <td :class="TABLE_CELL">
            <span class="worktrees-skeleton__bar" :style="bar(row.stage, 11)" />
          </td>
          <td :class="TABLE_CELL">
            <div class="flex min-w-[140px] items-center gap-2">
              <span class="worktrees-skeleton__bar flex-1" :style="{ height: '4px' }" />
              <span class="worktrees-skeleton__bar" :style="bar(26, 9)" />
            </div>
          </td>
          <td :class="TABLE_CELL">
            <span class="worktrees-skeleton__bar" :style="bar(row.badge, 22)" />
          </td>
          <td :class="TABLE_CELL">
            <div class="flex justify-end">
              <span class="worktrees-skeleton__bar" :style="bar(24, 24)" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
// Блик привязан к окну (background-attachment: fixed) — все полосы мерцают одной волной.
// Градиент с color-mix и фиксированной подложкой утилитами Tailwind не выразить.
$wave-width: 60vw;

.worktrees-skeleton {
  &__bar {
    display: inline-block;
    flex-shrink: 0;
    vertical-align: middle;
    border-radius: 4px;
    background-color: var(--kit-subtle);
    background-image: linear-gradient(
      100deg,
      transparent 30%,
      color-mix(in srgb, var(--kit-strong) 70%, transparent) 50%,
      transparent 70%
    );
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-size: $wave-width 100%;
    animation: worktrees-skeleton-wave 1.5s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
      background-image: none;
    }
  }
}

@keyframes worktrees-skeleton-wave {
  from {
    background-position: -$wave-width 0;
  }

  to {
    background-position: 100vw 0;
  }
}
</style>
