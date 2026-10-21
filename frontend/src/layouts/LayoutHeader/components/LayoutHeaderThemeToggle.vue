<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/AppButton/AppButton.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()

const isDark = computed(() => theme.value === 'dark')

const label = computed(() => (isDark.value ? 'Светлая тема' : 'Тёмная тема'))
</script>

<template>
  <AppButton class="shrink-0" :aria-label="label" :title="label" @click="toggle">
    <AppIcon :name="isDark ? 'sun' : 'moon'" />
    <span class="hidden md:inline">{{ label }}</span>
  </AppButton>
</template>
