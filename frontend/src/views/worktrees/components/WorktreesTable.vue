<script setup lang="ts">
import { computed } from 'vue'
import { groupByBase, kitStateOf, stubMessage, useCollapsedGroups, useWorktreesNotify, type FreshCopy, type WorkspaceRow } from '@/views/worktrees/helper'
import WorktreesGroup from '@/views/worktrees/components/WorktreesGroup.vue'
import WorktreesHead from '@/views/worktrees/components/WorktreesHead.vue'
import WorktreesKitNotice from '@/views/worktrees/components/WorktreesKitNotice.vue'

const props = defineProps<{
  rows: WorkspaceRow[]
  fresh: FreshCopy | null
}>()

const notify = useWorktreesNotify()
const groups = useCollapsedGroups()

const grouped = computed(() => groupByBase(props.rows))

const kitState = computed(() => kitStateOf(props.rows))

function openSettings() {
  notify(stubMessage('Раздел «Настройки» ещё не перенесён'))
}
</script>

<template>
  <WorktreesKitNotice v-if="kitState" :kit="kitState" @settings="openSettings" />
  <table class="w-full border-collapse">
    <WorktreesHead />
    <WorktreesGroup
      v-for="group in grouped"
      :key="group.base"
      :group="group"
      :collapsed="groups.isCollapsed(group.base)"
      :fresh="fresh"
      @toggle="groups.toggle(group.base)"
    />
  </table>
</template>
