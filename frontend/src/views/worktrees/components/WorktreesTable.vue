<script setup lang="ts">
import { computed } from 'vue'
import { groupByKnowledge, useCollapsedGroups, type FreshCopy, type WorkspaceRow } from '@/views/worktrees/helper'
import WorktreesGroup from '@/views/worktrees/components/WorktreesGroup.vue'
import WorktreesHead from '@/views/worktrees/components/WorktreesHead.vue'

const props = defineProps<{
  rows: WorkspaceRow[]
  fresh: FreshCopy | null
}>()

const groups = useCollapsedGroups()

const grouped = computed(() => groupByKnowledge(props.rows))
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
