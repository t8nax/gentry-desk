// Цвета панели из agents-kit-web (index.css). Tailwind берёт их как CSS-переменные `--kit-<ключ>`:
// тема переключается атрибутом data-theme без пересборки классов.

/** Тёмная тема — тема по умолчанию. */
export const dark = {
  base: '#09090b',
  surface: '#121214',
  'surface-hover': '#18181b',
  subtle: '#27272a',
  strong: '#3f3f46',
  primary: '#ededed',
  secondary: '#a1a1aa',
  tertiary: '#71717a',
  'waiting-bg': 'rgba(245, 158, 11, 0.15)',
  'waiting-text': '#fbbf24',
  'waiting-border': 'rgba(245, 158, 11, 0.3)',
  'waiting-fill': '#fbbf24',
  'waiting-on': '#000',
  'waiting-glow': 'rgba(245, 158, 11, 0.4)',
  'active-bg': 'rgba(16, 185, 129, 0.1)',
  'active-bg-hover': 'rgba(16, 185, 129, 0.18)',
  'active-text': '#34d399',
  'active-border': 'rgba(52, 211, 153, 0.3)',
  'free-bg': 'rgba(161, 161, 170, 0.1)',
  'done-bg': 'rgba(37, 99, 235, 0.1)',
  'done-text': '#60a5fa',
  'error-text': '#f87171',
  'error-bg': 'rgba(248, 113, 113, 0.08)',
  'error-border': 'rgba(248, 113, 113, 0.35)',
  'link-text': '#0098ff',
  'link-bg': 'rgba(0, 152, 255, 0.12)',
  'link-bg-hover': 'rgba(0, 152, 255, 0.22)',
  'link-border': 'rgba(0, 152, 255, 0.35)',
  'grid-line': 'rgba(255, 255, 255, 0.035)',
  overlay: 'rgba(9, 9, 11, 0.72)',
  'overlay-deep': 'rgba(0, 0, 0, 0.85)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  'footer-tint': 'rgba(0, 0, 0, 0.2)',
}

/** Светлая тема — те же ключи с другими значениями. */
export const light = {
  base: '#f4f4f6',
  surface: '#ffffff',
  'surface-hover': '#ebebef',
  subtle: '#e2e2e7',
  strong: '#c8c8d0',
  primary: '#18181b',
  secondary: '#52525b',
  tertiary: '#78787f',
  'waiting-bg': 'rgba(245, 158, 11, 0.2)',
  'waiting-text': '#854d0e',
  'waiting-border': 'rgba(180, 83, 9, 0.4)',
  'waiting-fill': '#f59e0b',
  'waiting-on': '#422006',
  'waiting-glow': 'rgba(245, 158, 11, 0.5)',
  'active-bg': 'rgba(16, 185, 129, 0.12)',
  'active-bg-hover': 'rgba(16, 185, 129, 0.2)',
  'active-text': '#047857',
  'active-border': 'rgba(4, 120, 87, 0.35)',
  'free-bg': 'rgba(113, 113, 122, 0.1)',
  'done-bg': 'rgba(29, 78, 216, 0.1)',
  'done-text': '#1d4ed8',
  'error-text': '#b91c1c',
  'error-bg': 'rgba(185, 28, 28, 0.08)',
  'error-border': 'rgba(185, 28, 28, 0.35)',
  'link-text': '#0066cc',
  'link-bg': 'rgba(0, 102, 204, 0.1)',
  'link-bg-hover': 'rgba(0, 102, 204, 0.18)',
  'link-border': 'rgba(0, 102, 204, 0.35)',
  'grid-line': 'rgba(24, 24, 27, 0.05)',
  overlay: 'rgba(24, 24, 27, 0.38)',
  'overlay-deep': 'rgba(24, 24, 27, 0.45)',
  shadow: 'rgba(24, 24, 27, 0.18)',
  'footer-tint': 'rgba(24, 24, 27, 0.03)',
}

export const fonts = {
  sans: [
    'Inter',
    'Inter Variable',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  mono: [
    'JetBrains Mono',
    'JetBrains Mono Variable',
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'monospace',
  ],
}

/** Имя CSS-переменной токена. */
export function kitVar(key) {
  return `--kit-${key}`
}

/** Палитра как набор CSS-переменных для :root. */
export function kitVars(palette) {
  return Object.fromEntries(Object.entries(palette).map(([key, value]) => [kitVar(key), value]))
}

/** Цвета для theme.extend.colors.kit: каждый ключ ссылается на свою переменную. */
export const kitColors = Object.fromEntries(Object.keys(dark).map((key) => [key, `var(${kitVar(key)})`]))
