<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'
import AppButton from '@/components/AppButton/AppButton.vue'
import AppDialog from '@/components/AppDialog/AppDialog.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { copyName, mockCopyName, type WorkspaceRow } from '@/views/worktrees/helper'
import { MOCK_ACTION_MS, copyNameProblem, projectsOf, type DialogFailure } from '@/views/worktrees/dialogs/helper'

const props = defineProps<{
  rows: WorkspaceRow[]
}>()

const emit = defineEmits<{
  close: []
  created: [source: WorkspaceRow, name: string]
  settings: []
}>()

// Список проектов берётся на открытии: обновление таблицы не должно двигать выбор под рукой
const projects = projectsOf(props.rows)

const base = shallowRef<string | null>((projects.find((p) => p.source) ?? projects[0])?.base ?? null)
const name = shallowRef('')
const busy = shallowRef(false)
const failure = shallowRef<DialogFailure | null>(
  props.rows.some((row) => row.problemsState === 'kit-not-set')
    ? { kind: 'kit', text: 'Путь к киту не задан, а копию заводит скрипт кита. Задайте его в «Настройках».' }
    : null,
)
const field = useTemplateRef<HTMLInputElement>('field')
let timer: number | undefined

const project = computed(() => projects.find((p) => p.base === base.value) ?? null)
const trimmed = computed(() => name.value.trim())
const freeCopies = computed(() => project.value?.free ?? [])
const showsFreeNotice = computed(() => freeCopies.value.length > 0 && !failure.value && !busy.value)
const submitLabel = computed(() =>
  busy.value ? 'Заводится…' : failure.value?.kind === 'refused' ? 'Попробовать снова' : 'Завести копию',
)
const submitDisabled = computed(() => busy.value || !project.value?.source || failure.value?.kind === 'kit')

function clearFailure() {
  if (failure.value?.kind !== 'kit') failure.value = null
}

function chooseProject(projectBase: string) {
  base.value = projectBase
  clearFailure()
}

function onNameInput(event: Event) {
  name.value = (event.target as HTMLInputElement).value
  clearFailure()
}

function projectClass(projectBase: string, enabled: boolean) {
  return [
    'flex items-center gap-3 rounded-md px-3 py-2.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-kit-primary',
    projectBase === base.value && 'bg-kit-surface-hover',
    enabled ? 'cursor-pointer hover:bg-kit-surface-hover' : 'cursor-default opacity-60',
  ]
}

function markClass(on: boolean) {
  return on ? 'border-kit-primary bg-kit-primary' : 'border-kit-strong'
}

function create() {
  const source = project.value?.source
  if (!source || busy.value) return
  const taken = props.rows.filter((row) => row.base === source.base).map((row) => copyName(row.path))
  const problem = trimmed.value ? copyNameProblem(trimmed.value, taken) : null
  busy.value = true
  failure.value = null
  timer = window.setTimeout(() => {
    busy.value = false
    if (problem) {
      failure.value = { kind: 'refused', text: problem }
      field.value?.focus()
      return
    }
    emit('created', source, trimmed.value || mockCopyName())
  }, MOCK_ACTION_MS)
}

onMounted(() => field.value?.focus())
onUnmounted(() => window.clearTimeout(timer))
</script>

<template>
  <AppDialog :locked="busy" @close="emit('close')">
    <form
      class="flex max-h-[90vh] w-[600px] max-w-full flex-col overflow-hidden rounded-lg border border-kit-strong bg-kit-surface shadow-[0_24px_48px_var(--kit-shadow)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-workspace-title"
      novalidate
      @submit.prevent="create"
    >
      <div class="flex items-center gap-3 px-5 pb-1 pt-[18px]">
        <span class="inline-flex text-kit-active-text" aria-hidden="true">
          <AppIcon name="plus" />
        </span>
        <h3 id="new-workspace-title" class="m-0 text-[15px] font-semibold">Новая рабочая копия</h3>
        <AppButton variant="icon" class="ml-auto" aria-label="Закрыть" :disabled="busy" @click="emit('close')">
          <AppIcon name="close" />
        </AppButton>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
        <p class="m-0 mb-3.5 text-[13px] text-kit-secondary">
          Копия заводится от основной копии выбранного проекта.
        </p>

        <div class="mb-4" role="radiogroup" aria-label="Проект">
          <div
            v-for="item in projects"
            :key="item.base"
            :class="projectClass(item.base, !!item.source && !busy)"
            @click="item.source && !busy && chooseProject(item.base)"
          >
            <span
              class="relative inline-flex size-4 shrink-0 items-center justify-center rounded-full border-2"
              :class="markClass(item.base === base)"
              aria-hidden="true"
            >
              <span v-if="item.base === base" class="size-1.5 rounded-full bg-kit-base" />
            </span>
            <input
              type="radio"
              class="sr-only"
              name="new-workspace-project"
              :value="item.base"
              :checked="item.base === base"
              :disabled="!item.source || busy"
              @change="chooseProject(item.base)"
            />
            <span class="min-w-0 flex-1">
              <span class="block font-medium">{{ item.name }}</span>
              <span class="block truncate font-mono text-xs text-kit-tertiary">{{ item.base }}</span>
            </span>
          </div>
        </div>

        <label class="mb-1.5 block text-xs text-kit-secondary" for="new-workspace-name">Имя копии</label>
        <input
          id="new-workspace-name"
          ref="field"
          class="w-full rounded-md border border-kit-subtle bg-kit-base px-3 py-2 font-mono text-[13px] text-kit-primary outline-none focus:border-kit-strong disabled:opacity-60"
          :value="name"
          :disabled="busy || failure?.kind === 'kit'"
          placeholder="например brave-sunny-otter"
          autocomplete="off"
          @input="onNameInput"
        />

        <p v-if="showsFreeNotice" class="mt-3 text-[13px] text-kit-secondary">
          У проекта уже есть свободные копии:
          <span v-for="(row, index) in freeCopies" :key="row.path">
            <span class="font-mono text-kit-primary">{{ copyName(row.path) }}</span>{{ index < freeCopies.length - 1 ? ', ' : '' }}
          </span>
        </p>

        <p
          v-if="failure"
          class="mt-3 rounded-md border px-3 py-2 text-[13px]"
          :class="
            failure.kind === 'kit'
              ? 'border-kit-waiting-border bg-kit-waiting-bg text-kit-waiting-text'
              : 'border-kit-error-border bg-kit-error-bg text-kit-error-text'
          "
          role="alert"
        >
          {{ failure.text }}
          <button
            v-if="failure.kind === 'kit'"
            type="button"
            class="ml-2 cursor-pointer border-0 bg-transparent p-0 font-medium text-kit-link-text underline"
            @click="emit('settings')"
          >
            Настройки
          </button>
        </p>
      </div>

      <div class="flex justify-end gap-2 border-t border-kit-subtle px-5 py-3.5">
        <AppButton type="button" :disabled="busy" @click="emit('close')">Отмена</AppButton>
        <AppButton type="submit" variant="add" :disabled="submitDisabled">{{ submitLabel }}</AppButton>
      </div>
    </form>
  </AppDialog>
</template>
