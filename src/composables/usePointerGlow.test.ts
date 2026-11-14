import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { flushFrames, setMatches, withSetup } from '../test/utils'
import { usePointerGlow } from './usePointerGlow'

function pointer(type: string, pointerType: string, x = 0, y = 0) {
  const event = new MouseEvent(type, { clientX: x, clientY: y })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  return event
}

function setup() {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect
  const target = ref<HTMLElement | null>(el)
  const { wrapper } = withSetup(() => usePointerGlow(target))
  return { el, wrapper }
}

describe('usePointerGlow', () => {
  it('follows the mouse inside the element', () => {
    setMatches(() => false)
    const { el } = setup()
    el.dispatchEvent(pointer('pointermove', 'mouse', 60, 70))
    expect(el.classList.contains('has-glow')).toBe(true)
    flushFrames()
    expect(el.style.getPropertyValue('--glow-x')).toBe('50px')
    expect(el.style.getPropertyValue('--glow-y')).toBe('50px')
    el.dispatchEvent(pointer('pointerleave', 'mouse'))
    expect(el.classList.contains('has-glow')).toBe(false)
  })

  it('ignores touch', () => {
    setMatches(() => false)
    const { el } = setup()
    el.dispatchEvent(pointer('pointermove', 'touch'))
    expect(el.classList.contains('has-glow')).toBe(false)
  })

  it('does nothing with reduced motion', () => {
    setMatches((query) => query.includes('reduce'))
    const { el } = setup()
    el.dispatchEvent(pointer('pointermove', 'mouse'))
    expect(el.classList.contains('has-glow')).toBe(false)
  })

  it('stops listening when unmounted', () => {
    setMatches(() => false)
    const { el, wrapper } = setup()
    wrapper.unmount()
    el.dispatchEvent(pointer('pointermove', 'mouse'))
    expect(el.classList.contains('has-glow')).toBe(false)
  })
})
