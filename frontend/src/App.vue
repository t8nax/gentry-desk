<script setup lang="ts">
import { RouterView } from 'vue-router'
import LayoutHeader from '@/layouts/LayoutHeader/LayoutHeader.vue'
import LayoutSidebar from '@/layouts/LayoutSidebar/LayoutSidebar.vue'
</script>

<template>
  <LayoutHeader />
  <div class="flex min-h-0 flex-1">
    <LayoutSidebar />
    <main class="min-w-0 flex-1 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>
