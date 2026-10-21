<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { groupByKnowledge, useCollapsedGroups, type FreshCopy } from '@/views/worktrees/helper'
import { useWorktreesStore } from '@/views/worktrees/worktreesStore'
import WorktreesGroup from '@/views/worktrees/components/WorktreesGroup.vue'
import WorktreesHead from '@/views/worktrees/components/WorktreesHead.vue'

defineProps<{
  fresh: FreshCopy | null
}>()

const { rows } = storeToRefs(useWorktreesStore())
const groups = useCollapsedGroups()

const grouped = computed(() => groupByKnowledge(rows.value ?? []))
</script>

<template>
  <table class="w-full border-collapse">
    <WorktreesHead />
    <WorktreesGroup
      v-for="group in grouped"
      :key="group.knowledge"
      :group="group"
      :collapsed="groups.isCollapsed(group.knowledge)"
      :fresh="fresh"
      @toggle="groups.toggle(group.knowledge)"
    />
  </table>
</template>
