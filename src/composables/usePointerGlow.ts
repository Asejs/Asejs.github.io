import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Keeps --glow-x / --glow-y on <html> at the mouse position, so CSS can paint a soft
 * light that follows the pointer. Mouse only; touch and reduced motion get none.
 */
export function usePointerGlow() {
  const root = document.documentElement
  let frame = 0
  let x = 0
  let y = 0

  function onMove(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    x = event.clientX
    y = event.clientY
    frame ||= requestAnimationFrame(() => {
      frame = 0
      root.style.setProperty('--glow-x', `${x}px`)
      root.style.setProperty('--glow-y', `${y}px`)
      root.classList.add('has-glow')
    })
  }

  function onLeave() {
    root.classList.remove('has-glow')
  }

  onMounted(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerleave', onLeave)
  })
}
