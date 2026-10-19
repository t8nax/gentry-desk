<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import LayoutSidebarItem from '@/layouts/LayoutSidebar/components/LayoutSidebarItem.vue'
import { SIDEBAR_GROUP_LABEL, SIDEBAR_NAV_ITEMS, itemRoute, waitingNote } from '@/layouts/LayoutSidebar/helper'

const route = useRoute()
const { waitingCount } = storeToRefs(useAppStore())

// Сайдбар стоит полосой значков и разъезжается под мышью или фокусом — своей кнопки у него нет
const expanded = shallowRef(false)

const note = computed(() => waitingNote(waitingCount.value))

const navClass = computed(() => [
  'absolute inset-y-0 left-0 z-[5] flex flex-col border-r border-kit-subtle bg-kit-surface py-3',
  'transition-[width,box-shadow] duration-[160ms] ease-in-out motion-reduce:transition-none',
  expanded.value
    ? 'w-[232px] overflow-y-auto overflow-x-hidden shadow-[0_8px_24px_-8px_var(--kit-shadow)]'
    : 'w-[52px] overflow-hidden',
])

function onFocusout(event: FocusEvent) {
  const nav = event.currentTarget as HTMLElement
  if (!nav.contains(event.relatedTarget as Node | null)) expanded.value = false
}
</script>

<template>
  <!-- Полоса держит место в потоке, а сайдбар разъезжается поверх содержимого: таблица не ездит -->
  <div class="relative w-[52px] shrink-0">
    <nav
      :class="navClass"
      aria-label="Разделы панели"
      @mouseenter="expanded = true"
      @mouseleave="expanded = false"
      @focusin="expanded = true"
      @focusout="onFocusout"
    >
      <div
        class="whitespace-nowrap px-4 pb-1 pt-2.5 text-xs uppercase tracking-[0.06em] text-kit-tertiary"
        :class="{ invisible: !expanded }"
      >
        {{ SIDEBAR_GROUP_LABEL }}
      </div>
      <LayoutSidebarItem
        v-for="item in SIDEBAR_NAV_ITEMS"
        :key="item.id"
        :label="item.label"
        :icon="item.icon"
        :expanded="expanded"
        :active="item.routeName !== undefined && route.name === item.routeName"
        :note="item.showsWaiting ? note : null"
        :to="itemRoute(item)"
      />
    </nav>
  </div>
</template>
