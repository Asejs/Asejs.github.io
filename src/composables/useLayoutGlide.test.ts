import { describe, expect, it, vi } from 'vitest'
import { rect, setMatches, withSetup } from '../test/utils'
import { useLayoutGlide } from './useLayoutGlide'

function setup(reduceMotion = false) {
  setMatches((query) => reduceMotion && query.includes('reduce'))
  const query = { matches: false } as MediaQueryList
  const el = document.createElement('div')
  const animate = vi.fn()
  el.animate = animate
  let box = rect(0, 0, 100, 100)
  el.getBoundingClientRect = () => box
  const { wrapper } = withSetup(() => useLayoutGlide(query, () => [el, null]))
  return {
    animate,
    wrapper,
    resize(matches: boolean, next: DOMRect) {
      Object.assign(query, { matches })
      box = next
      dispatchEvent(new Event('resize'))
    },
  }
}

describe('useLayoutGlide', () => {
  it('glides elements to their new place when the breakpoint flips', () => {
    const { animate, resize } = setup()
    resize(true, rect(200, 100, 50, 50))
    expect(animate).toHaveBeenCalledOnce()
    const [[from]] = animate.mock.calls[0]
    expect(from).toEqual({ translate: '-175px -75px', scale: '2' })
  })

  it('does nothing while the breakpoint stays the same', () => {
    const { animate, resize } = setup()
    resize(false, rect(10, 10, 100, 100))
    expect(animate).not.toHaveBeenCalled()
  })

  it('skips elements that collapsed', () => {
    const { animate, resize } = setup()
    resize(true, rect(0, 0, 0, 0))
    expect(animate).not.toHaveBeenCalled()
  })

  it('jumps instead of gliding with reduced motion', () => {
    const { animate, resize } = setup(true)
    resize(true, rect(200, 100, 50, 50))
    expect(animate).not.toHaveBeenCalled()
  })

  it('stops listening when unmounted', () => {
    const { animate, resize, wrapper } = setup()
    wrapper.unmount()
    resize(true, rect(200, 100, 50, 50))
    expect(animate).not.toHaveBeenCalled()
  })
})
