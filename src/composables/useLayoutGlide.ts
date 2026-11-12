import { onBeforeUnmount, onMounted } from 'vue'

/**
 * When `query` starts or stops matching (the window crosses a breakpoint), the elements
 * glide from where they were to where the new layout puts them, instead of jumping.
 */
export function useLayoutGlide(query: MediaQueryList, elements: () => (HTMLElement | null | undefined)[]) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
  let rects: (DOMRect | undefined)[] = []
  let matched = query.matches

  // Positions relative to the page, so scrolling in between doesn't count as movement
  const measure = () =>
    elements().map((el) => {
      if (!el) return undefined
      const r = el.getBoundingClientRect()
      return new DOMRect(r.left + scrollX, r.top + scrollY, r.width, r.height)
    })

  // Runs after the browser has laid the page out for the new size
  function onResize() {
    const before = rects
    rects = measure()
    if (query.matches === matched) return
    matched = query.matches
    if (reduceMotion.matches) return
    elements().forEach((el, i) => {
      const from = before[i]
      const to = rects[i]
      if (!el || !from || !to || !to.width || !to.height) return
      el.animate(
        [
          {
            // Centre to centre, since elements scale around their middle
            translate: `${from.left + from.width / 2 - to.left - to.width / 2}px ${from.top + from.height / 2 - to.top - to.height / 2}px`,
            scale: `${from.width / to.width} ${from.height / to.height}`,
          },
          { translate: '0 0', scale: '1 1' },
        ],
        { duration: 500, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      )
    })
  }

  onMounted(() => {
    rects = measure()
    addEventListener('resize', onResize)
  })
  onBeforeUnmount(() => removeEventListener('resize', onResize))
}
