<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { COLUMN_COUNT, isFresh, rowKey, type FreshCopy, type WorkspaceGroup } from '@/views/worktrees/helper'
import WorktreesRow from '@/views/worktrees/components/WorktreesRow.vue'

const props = defineProps<{
  group: WorkspaceGroup
  collapsed: boolean
  fresh: FreshCopy | null
}>()

const emit = defineEmits<{
  toggle: []
}>()

const toggleLabel = computed(() => `${props.collapsed ? 'Развернуть' : 'Свернуть'} ${props.group.project}`)
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
        <div class="sticky left-0 flex w-max max-w-[min(100vw-5rem,24rem)] items-center gap-2.5 bg-kit-base py-0.5 group-hover:bg-kit-surface">
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
        </div>
      </th>
    </tr>
    <template v-if="!collapsed">
      <WorktreesRow v-for="row in group.rows" :key="rowKey(row)" :row="row" :fresh="isFresh(row, fresh)" />
    </template>
  </tbody>
</template>
