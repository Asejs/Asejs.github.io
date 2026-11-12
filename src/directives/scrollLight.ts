import type { Directive } from 'vue'

const listeners = new WeakMap<HTMLElement, () => void>()

export const vScrollLight: Directive<HTMLElement> = {
  mounted(el) {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const update = () => {
      frame = 0
      const reach = reduceMotion ? Infinity : innerHeight * 0.6
      el.querySelectorAll<HTMLElement>('.tag').forEach((tag) => {
        const box = tag.getBoundingClientRect()
        tag.classList.toggle('is-lit', box.top + box.height / 2 <= reach)
      })
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }
    listeners.set(el, onScroll)
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    requestAnimationFrame(update)
  },
  beforeUnmount(el) {
    const onScroll = listeners.get(el)
    if (!onScroll) return
    removeEventListener('scroll', onScroll)
    removeEventListener('resize', onScroll)
  },
}
