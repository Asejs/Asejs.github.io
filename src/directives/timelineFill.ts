import type { Directive } from 'vue'

/**
 * Draws a timeline's line from the first dot to the last one and fills it as it scrolls
 * past the middle of the screen: sets --line-start / --line-end (px) for the line and
 * --fill (0–1) for the accent part, and lights up the entries the fill has reached.
 *
 * `v-timeline-fill:gap` is for a section that carries the line of the timeline above it
 * through the gap: its line runs from the top of its margin to the timeline inside it.
 */
const listeners = new WeakMap<HTMLElement, () => void>()

// Centre of an entry's dot, from the top of the entry
const dotCentre = (entry: HTMLElement) => {
  const dot = getComputedStyle(entry, '::before')
  return parseFloat(dot.top) + parseFloat(dot.height) / 2
}

function measure(el: HTMLElement, gapMode: boolean) {
  if (gapMode) {
    const gap = parseFloat(getComputedStyle(el).marginTop)
    const inner = el.querySelector<HTMLElement>('.timeline')
    return { start: -gap, end: inner ? inner.offsetTop : el.offsetHeight }
  }
  const entries = [...el.querySelectorAll<HTMLElement>('.entry')].filter((e) => e.offsetParent === el)
  const first = entries[0]
  const last = entries[entries.length - 1]
  if (!first || !last) return { start: 0, end: el.offsetHeight }
  // A timeline continuing one from above starts at its top, to join the line coming in
  const start = el.closest('.section--continued') ? 0 : first.offsetTop + dotCentre(first)
  // It ends at the last dot, unless the next section carries the line on
  const continues = el.closest('section')?.nextElementSibling?.classList.contains('section--continued')
  return { start, end: continues ? el.offsetHeight : last.offsetTop + dotCentre(last) }
}

export const vTimelineFill: Directive<HTMLElement> = {
  mounted(el, { arg }) {
    const gapMode = arg === 'gap'
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    const update = () => {
      frame = 0
      const { start, end } = measure(el, gapMode)
      el.style.setProperty('--line-start', `${start}px`)
      el.style.setProperty('--line-end', `${end}px`)
      const reach = reduceMotion ? Infinity : innerHeight * 0.6 - el.getBoundingClientRect().top
      el.style.setProperty('--fill', String(Math.min(Math.max((reach - start) / (end - start), 0), 1)))
      el.querySelectorAll<HTMLElement>('.entry').forEach((entry) => {
        if (entry.offsetParent === el) entry.classList.toggle('is-lit', entry.offsetTop + dotCentre(entry) <= reach)
      })
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }

    listeners.set(el, onScroll)
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    // Wait a frame so fonts and layout have settled before measuring
    requestAnimationFrame(update)
  },
  beforeUnmount(el) {
    const onScroll = listeners.get(el)
    if (!onScroll) return
    removeEventListener('scroll', onScroll)
    removeEventListener('resize', onScroll)
  },
}
