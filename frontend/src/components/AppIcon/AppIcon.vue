<script setup lang="ts">
import { computed } from 'vue'
import { iconDefinition, type IconName } from '@/components/AppIcon/helper'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    strokeWidth?: number
  }>(),
  { size: 16, strokeWidth: 2 },
)

const icon = computed(() => iconDefinition(props.name))
</script>

<template>
  <svg
    class="shrink-0"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    :fill="icon.filled ? 'currentColor' : 'none'"
    :stroke="icon.filled ? 'none' : 'currentColor'"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <component :is="tag" v-for="([tag, attrs], index) in icon.nodes" :key="index" v-bind="attrs" />
  </svg>
</template>
