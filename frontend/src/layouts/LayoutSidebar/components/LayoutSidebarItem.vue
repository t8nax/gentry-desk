<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import type { IconName } from '@/components/AppIcon/helper'

const props = withDefaults(
  defineProps<{
    label: string
    icon: IconName
    expanded: boolean
    active?: boolean
    note?: string | null
    to?: RouteLocationRaw | null
  }>(),
  { active: false, note: null, to: null },
)

// Свёрнутая полоса оставляет от раздела один значок — название держится в имени пункта
const accessibleLabel = computed(() => (props.note ? `${props.label}, ${props.note}` : props.label))
const title = computed(() => (props.note ? `${props.label} — ${props.note}` : props.label))

const itemClass = computed(() => [
  'relative flex w-full min-h-[calc(1.5em+18px)] items-center gap-2.5 border-l-2 px-4 py-[9px] text-left text-sm no-underline',
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kit-primary',
  props.active
    ? 'border-kit-primary bg-kit-surface-hover text-kit-primary'
    : 'border-transparent text-kit-secondary hover:bg-kit-surface-hover hover:text-kit-primary',
  props.to ? 'cursor-pointer' : 'cursor-default',
])
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    v-bind="to ? { to } : { type: 'button', disabled: true }"
    :class="itemClass"
    :aria-label="accessibleLabel"
    :title="title"
  >
    <AppIcon :name="icon" />
    <span v-if="expanded" class="flex-1 animate-side-label-in truncate motion-reduce:animate-none">{{ label }}</span>
    <template v-if="note">
      <span
        v-if="expanded"
        class="shrink-0 whitespace-nowrap rounded border border-kit-waiting-border bg-kit-waiting-bg px-1.5 font-mono text-xs tabular-nums text-kit-waiting-text"
      >
        {{ note }}
      </span>
      <span v-else class="absolute left-[26px] top-2 size-1.5 rounded-full bg-kit-waiting-fill" />
    </template>
  </component>
</template>
