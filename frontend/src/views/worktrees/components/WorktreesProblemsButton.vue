<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { FOCUS_RING } from '@/components/AppButton/helper'
import { plural } from '@/views/worktrees/helper'

const props = defineProps<{
  count: number
  /** Чьи проблемы: «копии» или «базы». */
  owner: string
}>()

const emit = defineEmits<{
  open: []
}>()

const label = computed(() => `${plural(props.count, 'проблема', 'проблемы', 'проблем')} ${props.owner} — открыть «Проблемы баз»`)
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded border border-kit-error-border bg-kit-error-bg px-2 py-0.5 font-mono text-xs tabular-nums text-kit-error-text hover:border-kit-error-text"
    :class="FOCUS_RING"
    :aria-label="label"
    title="Открыть «Проблемы баз»"
    @click="emit('open')"
  >
    <AppIcon name="warning" :size="14" />
    {{ count }}
  </button>
</template>
