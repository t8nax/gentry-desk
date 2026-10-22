<script setup lang="ts">
import { useEventListener } from '@/composables/useEventListener'

const props = withDefaults(
  defineProps<{
    /** Пока идёт действие, окно не закрывается ни Escape, ни кликом мимо. */
    locked?: boolean
  }>(),
  { locked: false },
)

const emit = defineEmits<{
  close: []
}>()

function requestClose() {
  if (!props.locked) emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') requestClose()
}

function onOverlayMousedown(event: MouseEvent) {
  if (event.target === event.currentTarget) requestClose()
}

useEventListener(window, 'keydown', onKeydown as EventListener)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[1000] flex items-center justify-center bg-kit-overlay-deep p-4 backdrop-blur-sm"
      @mousedown="onOverlayMousedown"
    >
      <slot />
    </div>
  </Teleport>
</template>
