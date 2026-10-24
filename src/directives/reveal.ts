import type { Directive } from 'vue'

let observer: IntersectionObserver | undefined

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer!.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  return observer
}

export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add('reveal')
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible')
      return
    }
    getObserver().observe(el)
  },
  beforeUnmount(el) {
    observer?.unobserve(el)
  },
}
