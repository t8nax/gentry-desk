import { onMounted, onUnmounted, watch, type MaybeRefOrGetter, toValue } from 'vue'

type Target = EventTarget | null | undefined

/**
 * Подписка на DOM-событие с авто-снятием при размонтировании.
 * Если `enabled` ложен — слушатель не вешается (или снимается).
 */
export function useEventListener(
  target: MaybeRefOrGetter<Target>,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions | boolean,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  let attached: Target = null

  function detach() {
    attached?.removeEventListener(event, handler, options)
    attached = null
  }

  function attach() {
    detach()
    if (!toValue(enabled)) return
    const el = toValue(target)
    if (!el) return
    el.addEventListener(event, handler, options)
    attached = el
  }

  onMounted(attach)
  watch(() => [toValue(target), toValue(enabled)] as const, attach)
  onUnmounted(detach)
}
