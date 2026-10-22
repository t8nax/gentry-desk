<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import type { ToastMessage } from '@/views/worktrees/helper'

defineProps<{
  message: ToastMessage
}>()
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-6 right-6 z-[900] flex items-center gap-2.5 rounded-lg border bg-kit-surface px-3.5 py-2.5 shadow-[0_12px_24px_var(--kit-shadow)]"
      :class="message.plain ? 'border-kit-strong' : 'border-kit-active-border'"
      role="status"
    >
      <AppIcon :name="message.icon" :class="message.plain ? 'text-kit-secondary' : 'text-kit-active-text'" />
      <span>
        <template v-for="(part, index) in message.parts" :key="index">
          <span v-if="part.code" class="font-mono text-xs">{{ part.text }}</span>
          <template v-else>{{ part.text }}</template>
        </template>
      </span>
    </div>
  </Teleport>
</template>
