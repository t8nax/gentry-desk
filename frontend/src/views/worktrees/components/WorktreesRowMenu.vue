<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import type { IconName } from '@/components/AppIcon/helper'
import { FOCUS_RING } from '@/components/AppButton/helper'
import { useEventListener } from '@/composables/useEventListener'
import { useWorktreesDialogs } from '@/views/worktrees/dialogs/helper'
import { copyName, stubMessage, useWorktreesNotify, type WorkspaceRow } from '@/views/worktrees/helper'

const props = defineProps<{
  row: WorkspaceRow
}>()

interface MenuItem {
  id: string
  label: string
  icon: IconName
  disabled: boolean
  danger?: boolean
  /** Разделитель отделяет необратимое от переходов. */
  separated?: boolean
  run: () => void
}

const { openRemove } = useWorktreesDialogs()
const notify = useWorktreesNotify()

const open = shallowRef(false)
const host = useTemplateRef<HTMLDivElement>('host')

const name = computed(() => copyName(props.row.path))

const items = computed<MenuItem[]>(() => {
  const list: MenuItem[] = [
    {
      id: 'vscode',
      label: 'Открыть в VS Code',
      icon: 'vscode',
      disabled: false,
      run: () => notify(stubMessage(`VS Code открыт на ${name.value} (мок)`)),
    },
  ]
  if (!props.row.main) {
    list.push({
      id: 'remove',
      label: 'Удалить копию',
      icon: 'trash',
      disabled: props.row.occupancy !== 'free',
      danger: true,
      separated: true,
      run: () => openRemove(props.row),
    })
  }
  return list
})

function choose(item: MenuItem) {
  open.value = false
  item.run()
}

// Меню перекрывает соседние строки: его закрывают и клик мимо, и Escape
function onDocumentMousedown(event: MouseEvent) {
  if (!host.value?.contains(event.target as Node)) open.value = false
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

useEventListener(document, 'mousedown', onDocumentMousedown as EventListener, undefined, open)
useEventListener(document, 'keydown', onDocumentKeydown as EventListener, undefined, open)

function itemClass(item: MenuItem) {
  return [
    'group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left',
    'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-kit-primary',
    'disabled:cursor-default disabled:text-kit-tertiary',
    item.danger
      ? 'cursor-pointer text-kit-error-text enabled:hover:bg-kit-error-bg'
      : 'cursor-pointer text-kit-primary enabled:hover:bg-kit-surface-hover',
  ]
}

function iconClass(item: MenuItem) {
  return item.danger ? 'text-kit-error-text group-disabled:text-kit-tertiary' : 'text-kit-secondary group-disabled:text-kit-tertiary'
}
</script>

<template>
  <div ref="host" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex cursor-pointer rounded border p-1"
      :class="[
        FOCUS_RING,
        open
          ? 'border-kit-strong bg-kit-surface-hover text-kit-primary'
          : 'border-transparent text-kit-secondary hover:border-kit-strong hover:bg-kit-surface-hover hover:text-kit-primary',
      ]"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="`Действия с ${name}`"
      title="Действия"
      @click="open = !open"
    >
      <AppIcon name="dots" />
    </button>
    <div
      v-if="open"
      class="absolute right-0 top-[calc(100%+4px)] z-[5] flex min-w-[230px] flex-col gap-0.5 rounded-lg border border-kit-strong bg-kit-surface p-1 shadow-[0_10px_28px_var(--kit-shadow)]"
      role="menu"
    >
      <template v-for="item in items" :key="item.id">
        <div v-if="item.separated" class="mx-1.5 my-1 h-px bg-kit-subtle" />
        <button type="button" role="menuitem" :class="itemClass(item)" :disabled="item.disabled" @click="choose(item)">
          <AppIcon :name="item.icon" :class="iconClass(item)" />
          {{ item.label }}
        </button>
      </template>
    </div>
  </div>
</template>
