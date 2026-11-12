import type { Directive } from 'vue'

/**
 * On a timeline: as it scrolls past the middle of the screen, sets --fill (0–1) for the
 * line to fill to, and lights up the entries the fill has reached.
 */
const listeners = new WeakMap<HTMLElement, () => void>()

export const vTimelineFill: Directive<HTMLElement> = {
  mounted(el) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--fill', '1')
      el.querySelectorAll('.entry').forEach((entry) => entry.classList.add('is-lit'))
      return
    }
    let frame = 0
    const update = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const reach = innerHeight * 0.6 - r.top
      el.style.setProperty('--fill', String(Math.min(Math.max(reach / r.height, 0), 1)))
      el.querySelectorAll<HTMLElement>('.entry').forEach((entry) => {
        entry.classList.toggle('is-lit', entry.offsetTop + 8 <= reach)
      })
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }
    listeners.set(el, onScroll)
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    update()
  },
  beforeUnmount(el) {
    const onScroll = listeners.get(el)
    if (!onScroll) return
    removeEventListener('scroll', onScroll)
    removeEventListener('resize', onScroll)
  },
}
