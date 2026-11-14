import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { flushFrames, setMatches } from '../test/utils'
import WaveLines from './WaveLines.vue'

function pointer(type: string, target: Element, pointerType = 'mouse') {
  const event = new MouseEvent(type, { clientX: 50, clientY: 50, bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  target.dispatchEvent(event)
}

function hero() {
  const wrapper = mount(
    defineComponent({
      render: () =>
        h('header', [h(WaveLines), h('div', { class: 'text' }, 'Tekst'), h('picture', [h('img')]), h('a', { href: '#' }, 'Lenke')]),
    }),
    { attachTo: document.body },
  )
  const canvas = wrapper.find('canvas').element as HTMLCanvasElement
  for (const child of wrapper.element.children) {
    child.getBoundingClientRect = () => ({ left: 100, right: 400, top: 0, width: 300, height: 200 }) as DOMRect
  }
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 400 }) as DOMRect
  return { wrapper, canvas, el: wrapper.element as HTMLElement }
}

describe('WaveLines', () => {
  it('draws and keeps animating, bending toward the mouse and plucking on click', () => {
    setMatches(() => false)
    const { el } = hero()
    flushFrames()
    pointer('pointermove', el)
    pointer('pointermove', el, 'touch')
    for (let i = 0; i < 6; i++) pointer('pointerdown', el)
    pointer('pointerdown', el.querySelector('a')!)
    flushFrames()
    pointer('pointerleave', el)
    flushFrames()
    document.dispatchEvent(new Event('visibilitychange'))
  })

  it('draws a single still frame with reduced motion', () => {
    setMatches((query) => query.includes('reduce'))
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    hero()
    expect(raf).not.toHaveBeenCalled()
  })

  it('stops when unmounted', () => {
    setMatches(() => false)
    const { wrapper, el } = hero()
    wrapper.unmount()
    pointer('pointermove', el)
  })
})
