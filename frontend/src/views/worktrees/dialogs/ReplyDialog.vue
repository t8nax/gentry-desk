<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import AppButton from '@/components/AppButton/AppButton.vue'
import AppDialog from '@/components/AppDialog/AppDialog.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { FOCUS_RING } from '@/components/AppButton/helper'
import { copyName, stubMessage, useWorktreesNotify, type WorkspaceRow } from '@/views/worktrees/helper'
import { EMPTY_ANSWER, FADE_MS, MOCK_ACTION_MS, REPLY_TABS, UNDO_MS, mockQuestions, type QuestionVariant, type ReplyTab } from '@/views/worktrees/dialogs/helper'

const props = defineProps<{
  row: WorkspaceRow
}>()

const emit = defineEmits<{
  close: []
  answered: [row: WorkspaceRow]
}>()

// open — оператор отвечает; sending — ответы ждут своих секунд с «Отменить»; writing — запись идёт;
// leaving — записанные ответы уходят вместе с окном, и оно гаснет
type Phase = 'open' | 'sending' | 'writing' | 'leaving'

const notify = useWorktreesNotify()

const questions = mockQuestions(props.row)
const answers = ref<string[]>(questions.map(() => ''))
const current = shallowRef(0)
const error = shallowRef<string | null>(null)
const phase = shallowRef<Phase>('open')
const tab = shallowRef<ReplyTab>('feed')

const feed = useTemplateRef<HTMLDivElement>('feed')
const field = useTemplateRef<HTMLInputElement>('field')
const undoButton = useTemplateRef<HTMLButtonElement>('undoButton')
let timer: number | undefined

const question = computed(() => questions[current.value])
const copy = computed(() => copyName(props.row.path))
const showsComposer = computed(() => !!question.value && (phase.value !== 'open' || tab.value === 'feed'))
const placeholder = computed(() =>
  question.value?.variants.length ? 'Выберите вариант или напишите свой ответ' : 'Ваш ответ',
)

function effectOf(index: number): string | null {
  const given = answers.value[index]
  return questions[index].variants.find((variant) => variant.choice === given)?.effect ?? null
}

function go(index: number) {
  current.value = index
  error.value = null
}

function setAnswer(value: string) {
  answers.value[current.value] = value
  if (error.value === EMPTY_ANSWER && value.trim()) error.value = null
}

// Повторный щелчок по выбранному варианту снимает ответ: иначе его не убрать
function choose(variant: QuestionVariant) {
  setAnswer(answers.value[current.value] === variant.choice ? '' : variant.choice)
  field.value?.focus()
}

function send() {
  const left = answers.value.findIndex((answer) => !answer.trim())
  if (left >= 0) {
    go(left)
    error.value = EMPTY_ANSWER
    return
  }
  error.value = null
  phase.value = 'sending'
  timer = window.setTimeout(write, UNDO_MS)
}

function undo() {
  window.clearTimeout(timer)
  phase.value = 'open'
}

function write() {
  phase.value = 'writing'
  timer = window.setTimeout(() => {
    emit('answered', props.row)
    phase.value = 'leaving'
    timer = window.setTimeout(() => emit('close'), FADE_MS)
  }, MOCK_ACTION_MS)
}

// Enter в строке ввода — следующий вопрос или отправка; набор через IME заканчивается тем же Enter
function onFieldKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return
  if (event.isComposing) return
  event.preventDefault()
  if (current.value < questions.length - 1) go(current.value + 1)
  else send()
}

function openTerminal() {
  notify(stubMessage(`Терминал с сессией ${copy.value} открыт (мок)`))
}

function openVsCode() {
  notify(stubMessage(`VS Code открыт на ${copy.value} (мок)`))
}

// Текущий вопрос встаёт в начало ленты, а строка ввода получает фокус: отвечают, не берясь за мышь
watch(
  [current, phase, tab],
  async () => {
    await nextTick()
    if (phase.value === 'sending') {
      undoButton.value?.focus()
      return
    }
    if (phase.value !== 'open' || tab.value !== 'feed') return
    const item = feed.value?.querySelector<HTMLElement>(`[data-q="${current.value}"]`)
    if (feed.value && item) feed.value.scrollTop = item.offsetTop - 16
    field.value?.focus()
  },
  { immediate: true },
)

onUnmounted(() => window.clearTimeout(timer))

function tabClass(id: ReplyTab) {
  return [
    'cursor-pointer rounded-[5px] border-0 px-3 py-1 text-[13px]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-kit-primary',
    tab.value === id
      ? 'bg-kit-surface font-medium text-kit-primary shadow-[0_1px_2px_var(--kit-shadow)]'
      : 'bg-transparent text-kit-secondary hover:text-kit-primary',
  ]
}

const CODE_BUTTON =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-kit-link-border bg-kit-link-bg px-[11px] py-[5px] text-xs font-medium text-kit-link-text enabled:hover:bg-kit-link-bg-hover disabled:cursor-default disabled:border-kit-subtle disabled:bg-transparent disabled:text-kit-tertiary'
</script>

<template>
  <AppDialog :locked="phase !== 'open'" @close="emit('close')">
    <div
      class="flex h-[min(780px,90vh)] w-[800px] max-w-full flex-col overflow-hidden rounded-xl border border-kit-strong bg-kit-surface shadow-[0_25px_50px_-12px_var(--kit-shadow)] transition-[opacity,transform] duration-[220ms] ease-in-out motion-reduce:transition-none"
      :class="{ 'pointer-events-none scale-[0.985] opacity-0': phase === 'leaving' }"
      role="dialog"
      aria-modal="true"
      aria-label="Ответ оператора"
    >
      <div class="flex items-start gap-3 border-b border-kit-subtle py-3.5 pl-6 pr-5">
        <div class="min-w-0 flex-1">
          <div v-if="row.task" class="text-[15px] font-semibold leading-snug [overflow-wrap:anywhere]">{{ row.task }}</div>
          <div class="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-xs text-kit-secondary">
            <span class="inline-flex min-w-0 items-center gap-1.5" title="Проект">
              <AppIcon name="box" :size="13" />
              <span class="font-sans font-medium text-kit-primary">{{ row.project }}</span>
            </span>
            <span class="inline-flex min-w-0 items-center gap-1.5" title="Рабочая копия">
              <AppIcon name="folder" :size="13" />
              <span>{{ copy }}</span>
            </span>
          </div>
          <div class="mt-2.5 flex flex-wrap items-center gap-2">
            <button type="button" :class="CODE_BUTTON" :disabled="!row.backgroundSession" @click="openTerminal">
              <AppIcon name="terminal" />
              {{ row.backgroundSession ? 'Открыть в терминале' : 'Нет сессии в фоне' }}
            </button>
            <button type="button" :class="CODE_BUTTON" :disabled="!row.vsCodeSession" @click="openVsCode">
              <AppIcon name="vscode" />
              {{ row.vsCodeSession ? 'Открыть в VS Code' : 'Нет сессии в VS Code' }}
            </button>
            <!-- Пока ответы уходят, вкладок нет: окно показывает только отправку -->
            <div
              v-if="phase === 'open'"
              class="ml-auto inline-flex gap-0.5 rounded-lg border border-kit-subtle bg-kit-surface-hover p-[3px]"
              role="tablist"
              aria-label="Вкладки окна"
            >
              <button
                v-for="t in REPLY_TABS"
                :key="t.id"
                type="button"
                role="tab"
                :aria-selected="tab === t.id"
                :class="tabClass(t.id)"
                @click="tab = t.id"
              >
                {{ t.label }}
              </button>
            </div>
          </div>
        </div>
        <AppButton variant="icon" aria-label="Закрыть" :disabled="phase !== 'open'" @click="emit('close')">
          <AppIcon name="close" :size="18" />
        </AppButton>
      </div>

      <div v-if="phase !== 'open'" class="flex min-h-0 flex-1 flex-col items-center justify-center gap-[18px] p-6 text-center" role="status">
        <span class="grid size-[72px] place-items-center rounded-full border-2 border-kit-active-border bg-kit-active-bg text-kit-active-text">
          <AppIcon name="check" :size="34" :stroke-width="2.5" />
        </span>
        <p class="m-0 text-base font-semibold">Ответы отправлены агенту</p>
      </div>

      <div v-else-if="tab !== 'feed'" class="flex min-h-0 flex-1 items-center justify-center p-6" role="tabpanel">
        <p class="m-0 text-center text-kit-secondary">{{ tab === 'context' ? 'Контекста нет' : 'Артефактов нет' }}</p>
      </div>

      <div v-else ref="feed" class="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6" role="tabpanel">
        <div v-for="(q, index) in questions" :key="index" class="flex flex-col gap-4" :data-q="index">
          <section
            v-if="index === current"
            class="grid max-w-[min(620px,92%)] gap-3 self-start rounded-[18px] rounded-bl bg-kit-surface-hover px-5 py-[18px]"
          >
            <h2 class="m-0 text-xl font-semibold leading-tight [text-wrap:balance]">{{ q.title }}</h2>
            <p v-if="q.context" class="m-0 text-sm leading-relaxed">{{ q.context }}</p>
            <div v-if="q.variants.length" class="grid gap-2">
              <button
                v-for="(variant, k) in q.variants"
                :key="k"
                type="button"
                class="grid cursor-pointer grid-cols-[18px_1fr] gap-x-3 gap-y-1 rounded-lg border bg-kit-surface px-3.5 py-3 text-left transition-colors hover:border-kit-waiting-text hover:bg-kit-waiting-bg"
                :class="[
                  FOCUS_RING,
                  answers[index] === variant.choice
                    ? 'border-kit-waiting-text shadow-[0_0_0_1px_var(--kit-waiting-text)]'
                    : 'border-kit-subtle',
                ]"
                :aria-pressed="answers[index] === variant.choice"
                @click="choose(variant)"
              >
                <span
                  class="mt-0.5 grid size-4 place-items-center rounded-full border-[1.5px]"
                  :class="answers[index] === variant.choice ? 'border-kit-waiting-text' : 'border-kit-strong'"
                  aria-hidden="true"
                >
                  <span v-if="answers[index] === variant.choice" class="size-2 rounded-full bg-kit-waiting-fill" />
                </span>
                <span class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-semibold">{{ variant.choice }}</span>
                  <span
                    v-if="variant.recommended"
                    class="whitespace-nowrap rounded border border-kit-waiting-border bg-kit-waiting-bg px-1.5 py-px text-[11px] font-semibold text-kit-waiting-text"
                  >
                    Рекомендовано ИИ
                  </span>
                </span>
                <span v-if="variant.effect" class="col-start-2 text-[13px] leading-normal text-kit-secondary">{{ variant.effect }}</span>
              </button>
            </div>
          </section>
          <button
            v-else
            type="button"
            class="flex max-w-[min(620px,92%)] cursor-pointer self-start rounded-full rounded-bl-md border border-transparent bg-kit-surface-hover px-4 py-2 text-left font-medium text-kit-primary hover:border-kit-strong"
            :class="FOCUS_RING"
            @click="go(index)"
          >
            {{ q.title }}
          </button>

          <div v-if="answers[index].trim()" class="flex justify-end">
            <div
              class="grid min-w-0 max-w-[min(460px,85%)] gap-1.5 rounded-[14px] rounded-tr border bg-kit-base px-3.5 py-3 [overflow-wrap:anywhere]"
              :class="index === current ? 'border-kit-strong' : 'border-kit-subtle'"
            >
              <template v-if="effectOf(index)">
                <p class="m-0 text-sm font-semibold">{{ answers[index] }}</p>
                <p class="m-0 text-xs leading-normal text-kit-secondary">{{ effectOf(index) }}</p>
              </template>
              <p v-else class="m-0 text-sm">{{ answers[index] }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Строка ответа — только у переписки; на время отправки на её месте «Отменить» -->
      <div v-if="showsComposer" class="grid gap-1.5 border-t border-kit-subtle bg-kit-footer-tint px-5 pb-3.5 pt-3">
        <div v-if="phase === 'open'" class="flex items-center gap-2">
          <AppButton variant="icon" aria-label="Предыдущий вопрос" title="Предыдущий вопрос" :disabled="current === 0" @click="go(current - 1)">
            <AppIcon name="chevron-left" :size="18" />
          </AppButton>
          <input
            ref="field"
            class="min-w-0 flex-1 rounded-lg border bg-kit-base px-3 py-2.5 text-sm text-kit-primary outline-none"
            :class="error ? 'border-kit-error-text' : 'border-kit-strong focus:border-kit-waiting-text'"
            aria-label="Ответ"
            autocomplete="off"
            :value="answers[current]"
            :placeholder="placeholder"
            @input="setAnswer(($event.target as HTMLInputElement).value)"
            @keydown="onFieldKeydown"
          />
          <AppButton
            variant="icon"
            aria-label="Следующий вопрос"
            title="Следующий вопрос"
            :disabled="current === questions.length - 1"
            @click="go(current + 1)"
          >
            <AppIcon name="chevron-right" :size="18" />
          </AppButton>
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-kit-waiting-fill bg-kit-waiting-fill px-4 py-[9px] font-semibold text-kit-waiting-on hover:brightness-110"
            :class="FOCUS_RING"
            @click="send"
          >
            <AppIcon name="send" />
            Отправить
          </button>
        </div>
        <div v-else class="flex items-center justify-end">
          <button
            ref="undoButton"
            type="button"
            class="inline-flex cursor-pointer items-center rounded-md border border-kit-strong bg-transparent px-4 py-[9px] font-semibold text-kit-primary enabled:hover:bg-kit-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            :class="FOCUS_RING"
            :disabled="phase !== 'sending'"
            @click="undo"
          >
            Отменить
          </button>
        </div>
        <span v-if="error" class="inline-flex items-start gap-1.5 text-xs text-kit-error-text" role="alert">
          <AppIcon name="warning" :size="14" class="mt-0.5" />
          <span>{{ error }}</span>
        </span>
      </div>
    </div>
  </AppDialog>
</template>
