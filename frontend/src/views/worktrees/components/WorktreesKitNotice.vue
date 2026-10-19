<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { FOCUS_RING } from '@/components/AppButton/helper'
import type { KitState } from '@/views/worktrees/helper'

const props = defineProps<{
  kit: KitState
}>()

const emit = defineEmits<{
  settings: []
}>()

const text = computed(() =>
  props.kit === 'not-set'
    ? 'Проблемы баз не проверяются: не задан путь к киту.'
    : 'Проблемы баз не проверяются: по заданному пути кита нет.',
)
</script>

<template>
  <div
    class="mx-6 mb-3 flex items-center gap-2.5 rounded-md border border-kit-waiting-border bg-kit-waiting-bg py-2 pl-3.5 pr-2 text-kit-waiting-text"
    role="status"
  >
    <AppIcon name="warning" />
    <span class="flex-1">{{ text }}</span>
    <button
      type="button"
      class="rounded-md border border-kit-waiting-border px-2.5 py-1 text-kit-waiting-text hover:bg-kit-waiting-bg"
      :class="FOCUS_RING"
      @click="emit('settings')"
    >
      Открыть настройки
    </button>
  </div>
</template>
