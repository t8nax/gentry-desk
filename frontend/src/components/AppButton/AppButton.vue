<script setup lang="ts">
import { computed } from 'vue'
import { buttonClasses, type ButtonSize, type ButtonVariant } from '@/components/AppButton/helper'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit'
  }>(),
  { variant: 'default', size: 'md', type: 'button' },
)

const classes = computed(() => buttonClasses(props.variant, props.size))
</script>

<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>
