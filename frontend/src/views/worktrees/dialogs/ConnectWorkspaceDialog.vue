<script setup lang="ts">
import { computed, onUnmounted, shallowRef, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { ApiError, addWorktree, pickFolder } from '@/api/worktrees'
import AppButton from '@/components/AppButton/AppButton.vue'
import { FOCUS_RING } from '@/components/AppButton/helper'
import AppDialog from '@/components/AppDialog/AppDialog.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { useFormValidation } from '@/composables/useFormValidation'
import {
  agentsWarningText,
  connectPathProblem,
  normalizePath,
  type ConnectWorkspaceProject,
} from '@/views/worktrees/dialogs/helper'
import { useWorktreesStore } from '@/views/worktrees/worktreesStore'

const emit = defineEmits<{
  close: []
  connected: [path: string, knowledge: string]
  agentsWarning: [text: string]
}>()

const { rows, projects: storeProjects } = storeToRefs(useWorktreesStore())

// Список проектов берётся на открытии: обновление таблицы не должно двигать выбор под рукой
const projects: ConnectWorkspaceProject[] = storeProjects.value.slice()

const knowledge = shallowRef<string | null>(projects[0]?.knowledge ?? null)
const busy = shallowRef(false)
const picking = shallowRef(false)
const field = useTemplateRef<HTMLInputElement>('field')
let abort: AbortController | null = null
let pickAbort: AbortController | null = null

const project = computed(() => projects.find((item) => item.knowledge === knowledge.value) ?? null)
const taken = computed(() =>
  (rows.value ?? []).filter((row) => row.knowledge === knowledge.value).map((row) => row.path),
)
const locked = computed(() => busy.value || picking.value)

const form = useFormValidation({
  initialValues: { path: '' },
  rules: () => ({
    path: (value) => connectPathProblem(String(value), taken.value),
  }),
})

const submitLabel = computed(() =>
  busy.value
    ? 'Добавляется…'
    : (form.submitted.value && form.invalidOf('path')) || form.formError.value
      ? 'Попробовать снова'
      : 'Добавить',
)
const submitDisabled = computed(() => locked.value || !project.value)

function chooseProject(projectKnowledge: string) {
  knowledge.value = projectKnowledge
  form.clearError('path')
  form.setFormError(null)
}

function projectClass(enabled: boolean) {
  return [
    'flex items-center gap-3 rounded-md px-3 py-2.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-kit-primary',
    enabled ? 'cursor-pointer hover:bg-kit-surface-hover' : 'cursor-default opacity-60',
  ]
}

function markClass(on: boolean) {
  return on ? 'border-kit-primary bg-kit-primary' : 'border-kit-strong'
}

async function browse() {
  if (locked.value) return
  form.setFormError(null)
  picking.value = true
  pickAbort = new AbortController()
  try {
    const path = await pickFolder(pickAbort.signal)
    if (path == null) return
    form.values.path = path
    form.clearError('path')
    field.value?.focus()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    if (e instanceof ApiError) {
      const hint = e.hint ? ` ${e.hint}` : ''
      form.setFormError(`${e.message}${hint}`)
    } else {
      form.setFormError(e instanceof Error ? e.message : 'Не удалось выбрать каталог.')
    }
  } finally {
    picking.value = false
  }
}

async function connect() {
  const selected = project.value
  if (!selected || locked.value) return
  form.setFormError(null)
  if (!form.validate()) {
    field.value?.focus()
    return
  }
  busy.value = true
  abort?.abort()
  abort = new AbortController()
  try {
    const result = await addWorktree(selected.name, normalizePath(form.values.path), abort.signal)
    const warning = agentsWarningText(result.agents)
    if (warning) emit('agentsWarning', warning)
    emit('connected', result.path, selected.knowledge)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    if (e instanceof ApiError) {
      const hint = e.hint ? ` ${e.hint}` : ''
      form.setFormError(`${e.message}${hint}`)
    } else {
      form.setFormError(e instanceof Error ? e.message : 'Не удалось добавить копию.')
    }
    field.value?.focus()
  } finally {
    busy.value = false
  }
}

onUnmounted(() => {
  abort?.abort()
  pickAbort?.abort()
})
</script>

<template>
  <AppDialog :locked="locked" @close="emit('close')">
    <form
      class="flex max-h-[90vh] w-[600px] max-w-full flex-col overflow-hidden rounded-lg border border-kit-strong bg-kit-surface shadow-[0_24px_48px_var(--kit-shadow)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-workspace-title"
      novalidate
      @submit.prevent="connect"
    >
      <div class="flex items-center gap-3 px-5 pb-1 pt-[18px]">
        <h3 id="connect-workspace-title" class="m-0 text-[15px] font-semibold">Добавить рабочую копию</h3>
        <AppButton variant="icon" class="ml-auto" aria-label="Закрыть" :disabled="locked" @click="emit('close')">
          <AppIcon name="close" />
        </AppButton>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
        <p class="m-0 mb-3.5 text-[13px] text-kit-secondary">
          Добавьте в пул существующий каталог git-копии. Новая копия на диске при этом не создаётся
        </p>

        <div class="mb-4" role="radiogroup" aria-label="Проект">
          <div
            v-for="item in projects"
            :key="item.knowledge"
            :class="projectClass(!locked)"
            @click="!locked && chooseProject(item.knowledge)"
          >
            <span
              class="relative inline-flex size-4 shrink-0 items-center justify-center rounded-full border-2"
              :class="markClass(item.knowledge === knowledge)"
              aria-hidden="true"
            >
              <span v-if="item.knowledge === knowledge" class="size-1.5 rounded-full bg-kit-base" />
            </span>
            <input
              type="radio"
              class="sr-only"
              name="connect-workspace-project"
              :value="item.knowledge"
              :checked="item.knowledge === knowledge"
              :disabled="locked"
            />
            <span class="min-w-0 flex-1">
              <span class="block font-medium">{{ item.name }}</span>
              <span class="block truncate font-mono text-xs text-kit-tertiary">{{ item.knowledge }}</span>
            </span>
          </div>
        </div>

        <label class="mb-1.5 block text-xs font-semibold text-kit-secondary" for="connect-workspace-path">Путь</label>
        <div class="flex h-9 items-stretch gap-2">
          <input
            ref="field"
            v-model="form.values.path"
            v-bind="form.fieldAttrs('path', { id: 'connect-workspace-path' })"
            class="box-border h-full min-w-0 flex-1 rounded-md border bg-transparent px-3 font-mono text-[13px] text-kit-primary outline-none disabled:cursor-not-allowed disabled:opacity-60"
            :class="
              form.invalidOf('path')
                ? 'border-kit-error-text focus:border-kit-error-text'
                : 'border-kit-subtle focus:border-kit-strong'
            "
            :disabled="locked"
            placeholder="C:\path\to\worktree"
            autocomplete="off"
          />
          <button
            type="button"
            class="box-border inline-flex h-full w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-kit-subtle bg-transparent text-kit-primary enabled:hover:bg-kit-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            :class="FOCUS_RING"
            aria-label="Выбрать каталог"
            :disabled="locked"
            @click="browse"
          >
            <AppIcon name="folder" :size="16" />
          </button>
        </div>
        <p
          v-if="form.errorOf('path')"
          v-bind="form.errorAttrs({ id: 'connect-workspace-path' })"
          class="mt-1.5 text-xs text-kit-error-text"
        >
          {{ form.errorOf('path') }}
        </p>
        <p v-else-if="form.formError" class="mt-1.5 text-xs text-kit-error-text" role="alert">
          {{ form.formError }}
        </p>
      </div>

      <div class="flex justify-end gap-2 border-t border-kit-subtle px-5 py-3.5">
        <AppButton type="button" :disabled="locked" @click="emit('close')">Отмена</AppButton>
        <AppButton type="submit" variant="add" :disabled="submitDisabled">{{ submitLabel }}</AppButton>
      </div>
    </form>
  </AppDialog>
</template>
