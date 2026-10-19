<script setup lang="ts">
import AppButton from '@/components/AppButton/AppButton.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { AGENT_NAME } from '@/layouts/LayoutHeader/helper'

/** Модалка «Спросить» ещё не перенесена — кнопка держит место в шапке. */
</script>

<template>
  <AppButton type="button" disabled :title="`Раздел «Спросить ${AGENT_NAME}» ещё не перенесён`">
    <AppIcon name="ask" />
    Спросить {{ AGENT_NAME }}
  </AppButton>
</template>
