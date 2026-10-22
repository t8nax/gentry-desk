export type ButtonVariant = 'default' | 'primary' | 'add' | 'danger' | 'icon'

export type ButtonSize = 'md' | 'sm'

export const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kit-primary'

const BASE = `inline-flex items-center gap-2 whitespace-nowrap rounded-md border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`

const VARIANTS: Record<ButtonVariant, string> = {
  default:
    'border-kit-subtle bg-kit-surface text-kit-primary enabled:hover:border-kit-strong enabled:hover:bg-kit-surface-hover',
  primary: 'border-kit-primary bg-kit-primary font-medium text-kit-base enabled:hover:opacity-90',
  add: 'border-kit-active-border bg-kit-active-bg font-medium text-kit-active-text enabled:hover:border-kit-active-text enabled:hover:bg-kit-active-bg-hover',
  danger: 'border-transparent bg-kit-error-text font-medium text-kit-surface enabled:hover:opacity-90',
  icon: 'border-transparent bg-transparent text-kit-secondary enabled:hover:bg-kit-surface-hover enabled:hover:text-kit-primary disabled:cursor-default',
}

const TEXT_SIZES: Record<ButtonSize, string> = { md: 'px-3 py-1.5', sm: 'px-2.5 py-1 text-xs' }

const SIZES: Record<ButtonVariant, Record<ButtonSize, string>> = {
  default: TEXT_SIZES,
  primary: TEXT_SIZES,
  add: TEXT_SIZES,
  danger: TEXT_SIZES,
  icon: { md: 'p-1', sm: 'p-0.5' },
}

export function buttonClasses(variant: ButtonVariant, size: ButtonSize): string[] {
  return [BASE, VARIANTS[variant], SIZES[variant][size]]
}
