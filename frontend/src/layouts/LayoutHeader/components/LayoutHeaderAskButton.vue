<script setup lang="ts">
import AppButton from '@/components/AppButton/AppButton.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { AGENT_NAME } from '@/layouts/LayoutHeader/helper'

/** Модалка «Спросить» ещё не перенесена — кнопка держит место в шапке. */
</script>

<template>
  <AppButton
    type="button"
    disabled
    class="shrink-0"
    :aria-label="`Спросить ${AGENT_NAME}`"
    :title="`Раздел «Спросить ${AGENT_NAME}» ещё не перенесён`"
  >
    <AppIcon name="ask" />
    <span class="hidden md:inline">Спросить {{ AGENT_NAME }}</span>
  </AppButton>
</template>
