<script setup lang="ts">
defineProps<{
  value: number
}>()
</script>

<template>
  <div class="flex min-w-[140px] items-center gap-2">
    <div class="h-1 flex-1 overflow-hidden rounded-sm bg-kit-subtle">
      <div class="h-full rounded-sm bg-kit-secondary" :style="{ width: `${value}%` }" />
    </div>
    <span class="min-w-[3.5ch] text-right font-mono text-xs tabular-nums text-kit-secondary">{{ value }}%</span>
  </div>
</template>
