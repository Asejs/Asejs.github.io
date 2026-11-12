import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Keeps --glow-x / --glow-y on `target` at the mouse position inside it, and toggles
 * `has-glow` while the mouse is over it, so CSS can paint a soft light there.
 * Mouse only; touch and reduced motion get none.
 */
export function usePointerGlow(target: Readonly<Ref<HTMLElement | null>>) {
  let frame = 0
  let event: PointerEvent | undefined

  function update() {
    frame = 0
    const el = target.value
    if (!el || !event) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--glow-x', `${event.clientX - r.left}px`)
    el.style.setProperty('--glow-y', `${event.clientY - r.top}px`)
  }

  function onMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return
    event = e
    target.value?.classList.add('has-glow')
    frame ||= requestAnimationFrame(update)
  }

  function onLeave() {
    target.value?.classList.remove('has-glow')
  }

  onMounted(() => {
    const el = target.value
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    target.value?.removeEventListener('pointermove', onMove)
    target.value?.removeEventListener('pointerleave', onLeave)
  })
}
