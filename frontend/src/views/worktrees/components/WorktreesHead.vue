<script setup lang="ts">
import { TABLE_HEAD_CELL, TABLE_STICKY_FIRST, WORKTREES_COLUMNS } from '@/views/worktrees/helper'

const COLUMN_CLASSES: Partial<Record<(typeof WORKTREES_COLUMNS)[number], string>> = {
  Копия: TABLE_STICKY_FIRST,
  '№': 'w-[1%] pr-1',
  Действия: 'text-right',
}
</script>

<template>
  <thead>
    <tr>
      <th v-for="column in WORKTREES_COLUMNS" :key="column" :class="[TABLE_HEAD_CELL, COLUMN_CLASSES[column]]">
        {{ column }}
      </th>
    </tr>
  </thead>
</template>
