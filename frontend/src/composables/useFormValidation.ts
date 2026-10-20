import { computed, reactive, shallowRef, type ComputedRef, type ShallowRef } from 'vue'

/** Сообщение об ошибке или «ок» (null / undefined / false / void). */
export type FormValidatorResult = string | null | undefined | false | void

/** Правило поля: получает значение и снимок всех значений формы. */
export type FormValidator<TValues extends Record<string, unknown>, K extends keyof TValues = keyof TValues> = (
  value: TValues[K],
  values: TValues,
) => FormValidatorResult

export type FormRule<TValues extends Record<string, unknown>, K extends keyof TValues = keyof TValues> =
  | FormValidator<TValues, K>
  | Array<FormValidator<TValues, K>>

export type FormRules<TValues extends Record<string, unknown>> = {
  [K in keyof TValues]?: FormRule<TValues, K>
}

export type FormErrors<TValues extends Record<string, unknown>> = Partial<Record<keyof TValues & string, string>>

export interface UseFormValidationOptions<TValues extends Record<string, unknown>> {
  initialValues: TValues
  /** Статичные правила или фабрика, если правила зависят от внешнего состояния. */
  rules?: FormRules<TValues> | (() => FormRules<TValues>)
  /**
   * После ошибки: поведение при изменении поля.
   * - `revalidate` — перепроверить поле (как в React Hook Form)
   * - `clear` — только сбросить ошибку поля
   * @default 'revalidate'
   */
  onChange?: 'revalidate' | 'clear'
}

export interface FieldAttrs {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
  onInput: () => void
}

export interface ErrorAttrs {
  id: string
  role: 'alert'
}

export interface UseFormValidationReturn<TValues extends Record<string, unknown>> {
  /**
   * Значения формы. Мутация через `v-model="form.values.field"` — штатный путь;
   * перепроверка ошибок идёт через `fieldAttrs(...).onInput`.
   */
  values: TValues
  errors: ShallowRef<FormErrors<TValues>>
  submitted: ShallowRef<boolean>
  formError: ShallowRef<string | null>
  isValid: ComputedRef<boolean>
  hasErrors: ComputedRef<boolean>
  validate: () => boolean
  validateField: (name: keyof TValues & string) => boolean
  clearError: (name: keyof TValues & string) => void
  clearErrors: () => void
  setError: (name: keyof TValues & string, message: string) => void
  setFormError: (message: string | null) => void
  reset: (next?: Partial<TValues>) => void
  /** Атрибуты для нативного input / textarea (v-bind). `id` обязателен для a11y. */
  fieldAttrs: (name: keyof TValues & string, options: { id: string }) => FieldAttrs
  /** Атрибуты для элемента с текстом ошибки поля (тот же `id`, что у fieldAttrs). */
  errorAttrs: (options: { id: string }) => ErrorAttrs
  /** Текст ошибки поля или null. */
  errorOf: (name: keyof TValues & string) => string | null
  /** Есть ли ошибка у поля (удобно для классов рамки). */
  invalidOf: (name: keyof TValues & string) => boolean
}

function asList<TValues extends Record<string, unknown>, K extends keyof TValues>(
  rule: FormRule<TValues, K> | undefined,
): Array<FormValidator<TValues, K>> {
  if (!rule) return []
  return Array.isArray(rule) ? rule : [rule]
}

function snapshotOf<TValues extends Record<string, unknown>>(values: TValues): TValues {
  return { ...values }
}

function errorElementId(fieldId: string): string {
  return `${fieldId}-error`
}

// --- Готовые правила (чистые функции) ---

/** Поле обязательно (не null/undefined, не пустая строка после trim, не пустой массив). */
export function required(message: string): FormValidator<Record<string, unknown>> {
  return (value) => {
    if (value == null) return message
    if (typeof value === 'string' && value.trim() === '') return message
    if (Array.isArray(value) && value.length === 0) return message
    return null
  }
}

/** Минимальная длина строки (после trim) или массива. */
export function minLength(min: number, message: string): FormValidator<Record<string, unknown>> {
  return (value) => {
    if (value == null) return null
    if (typeof value === 'string') return value.trim().length < min ? message : null
    if (Array.isArray(value)) return value.length < min ? message : null
    return null
  }
}

/** Максимальная длина строки (после trim) или массива. */
export function maxLength(max: number, message: string): FormValidator<Record<string, unknown>> {
  return (value) => {
    if (value == null) return null
    if (typeof value === 'string') return value.trim().length > max ? message : null
    if (Array.isArray(value)) return value.length > max ? message : null
    return null
  }
}

/** Значение должно совпасть с регулярным выражением (строки; пустая строка не проверяется). */
export function pattern(regex: RegExp, message: string): FormValidator<Record<string, unknown>> {
  return (value) => {
    if (typeof value !== 'string' || value.trim() === '') return null
    return regex.test(value) ? null : message
  }
}

/** Цепочка правил: первое непустое сообщение. */
export function rules<TValues extends Record<string, unknown>, K extends keyof TValues = keyof TValues>(
  ...validators: Array<FormValidator<TValues, K>>
): Array<FormValidator<TValues, K>> {
  return validators
}

/**
 * Универсальная валидация форм: значения, ошибки полей, form-level ошибка,
 * проверка на submit и перепроверка при изменении (как в современных form-libs).
 */
export function useFormValidation<TValues extends Record<string, unknown>>(
  options: UseFormValidationOptions<TValues>,
): UseFormValidationReturn<TValues> {
  const initial = { ...options.initialValues }
  const onChange = options.onChange ?? 'revalidate'

  const values = reactive({ ...initial }) as TValues
  const errors = shallowRef<FormErrors<TValues>>({})
  const submitted = shallowRef(false)
  const formError = shallowRef<string | null>(null)

  const hasErrors = computed(
    () => formError.value != null || Object.keys(errors.value).some((key) => Boolean(errors.value[key as keyof TValues & string])),
  )
  const isValid = computed(() => !hasErrors.value)

  function resolveRules(): FormRules<TValues> {
    const source = options.rules
    if (!source) return {}
    return typeof source === 'function' ? source() : source
  }

  function writeError(name: keyof TValues & string, message: string | null) {
    if (message) {
      errors.value = { ...errors.value, [name]: message }
      return
    }
    if (!(name in errors.value)) return
    const next = { ...errors.value }
    delete next[name]
    errors.value = next
  }

  function validateField(name: keyof TValues & string): boolean {
    const list = asList(resolveRules()[name])
    const snap = snapshotOf(values)
    for (const validator of list) {
      const result = validator(values[name], snap)
      if (typeof result === 'string' && result !== '') {
        writeError(name, result)
        return false
      }
    }
    writeError(name, null)
    return true
  }

  function validate(): boolean {
    submitted.value = true
    formError.value = null

    const currentRules = resolveRules()
    const names = Object.keys(currentRules) as Array<keyof TValues & string>
    // Если правил нет — форма валидна (внешняя проверка / setError).
    const keys = names.length > 0 ? names : (Object.keys(values) as Array<keyof TValues & string>)

    let ok = true
    const next: FormErrors<TValues> = {}
    const snap = snapshotOf(values)

    for (const name of keys) {
      for (const validator of asList(currentRules[name])) {
        const result = validator(values[name], snap)
        if (typeof result === 'string' && result !== '') {
          next[name] = result
          ok = false
          break
        }
      }
    }

    errors.value = next
    return ok
  }

  function clearError(name: keyof TValues & string) {
    writeError(name, null)
  }

  function clearErrors() {
    errors.value = {}
    formError.value = null
  }

  function setError(name: keyof TValues & string, message: string) {
    writeError(name, message)
  }

  function setFormError(message: string | null) {
    formError.value = message
  }

  function handleChange(name: keyof TValues & string) {
    if (!submitted.value && !errors.value[name]) return
    if (onChange === 'clear') {
      clearError(name)
      return
    }
    validateField(name)
  }

  function reset(next?: Partial<TValues>) {
    Object.assign(values, { ...initial, ...next })
    errors.value = {}
    submitted.value = false
    formError.value = null
  }

  function errorOf(name: keyof TValues & string): string | null {
    return errors.value[name] ?? null
  }

  function invalidOf(name: keyof TValues & string): boolean {
    return Boolean(errors.value[name])
  }

  function fieldAttrs(name: keyof TValues & string, fieldOptions: { id: string }): FieldAttrs {
    const { id } = fieldOptions
    const error = errors.value[name]
    return {
      id,
      ...(error ? { 'aria-invalid': true as const, 'aria-describedby': errorElementId(id) } : {}),
      onInput: () => handleChange(name),
    }
  }

  function errorAttrs(fieldOptions: { id: string }): ErrorAttrs {
    return {
      id: errorElementId(fieldOptions.id),
      role: 'alert',
    }
  }

  return {
    values,
    errors,
    submitted,
    formError,
    isValid,
    hasErrors,
    validate,
    validateField,
    clearError,
    clearErrors,
    setError,
    setFormError,
    reset,
    fieldAttrs,
    errorAttrs,
    errorOf,
    invalidOf,
  }
}
