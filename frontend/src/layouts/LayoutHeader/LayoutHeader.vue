<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import LayoutHeaderAgentBar from '@/layouts/LayoutHeader/components/LayoutHeaderAgentBar.vue'
import LayoutHeaderAskButton from '@/layouts/LayoutHeader/components/LayoutHeaderAskButton.vue'
import LayoutHeaderThemeToggle from '@/layouts/LayoutHeader/components/LayoutHeaderThemeToggle.vue'
import { APP_TITLE } from '@/layouts/LayoutHeader/helper'
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b border-kit-subtle px-3 sm:gap-3 sm:px-6">
    <AppIcon name="logo" class="shrink-0" />
    <h3 class="m-0 mr-auto min-w-0 truncate whitespace-nowrap text-sm font-medium">{{ APP_TITLE }}</h3>
    <LayoutHeaderAgentBar />
    <LayoutHeaderAskButton />
    <LayoutHeaderThemeToggle />
  </header>
</template>
