<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/AppButton/AppButton.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()

const isDark = computed(() => theme.value === 'dark')
</script>

<template>
  <AppButton @click="toggle">
    <AppIcon :name="isDark ? 'sun' : 'moon'" />
    {{ isDark ? 'Светлая тема' : 'Тёмная тема' }}
  </AppButton>
</template>
