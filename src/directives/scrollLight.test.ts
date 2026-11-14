import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { flushFrames, setMatches } from '../test/utils'
import { vScrollLight } from './scrollLight'

function setup() {
  const wrapper = mount(
    defineComponent({
      render: () => withDirectives(h('ul', [h('li', { class: 'tag' }), h('li', { class: 'tag' })]), [[vScrollLight]]),
    }),
  )
  const [near, far] = wrapper.findAll<HTMLElement>('.tag').map((tag) => tag.element)
  near.getBoundingClientRect = () => ({ top: 100, height: 20 }) as DOMRect
  far.getBoundingClientRect = () => ({ top: innerHeight, height: 20 }) as DOMRect
  return { wrapper, near, far }
}

describe('vScrollLight', () => {
  it('lights up tags as they scroll past', () => {
    setMatches(() => false)
    const { near, far } = setup()
    flushFrames()
    expect(near.classList.contains('is-lit')).toBe(true)
    expect(far.classList.contains('is-lit')).toBe(false)
    far.getBoundingClientRect = () => ({ top: 50, height: 20 }) as DOMRect
    dispatchEvent(new Event('scroll'))
    flushFrames()
    expect(far.classList.contains('is-lit')).toBe(true)
  })

  it('lights everything with reduced motion', () => {
    setMatches((query) => query.includes('reduce'))
    const { far } = setup()
    flushFrames()
    expect(far.classList.contains('is-lit')).toBe(true)
  })

  it('stops listening when unmounted', () => {
    setMatches(() => false)
    const { wrapper, far } = setup()
    flushFrames()
    wrapper.unmount()
    far.getBoundingClientRect = () => ({ top: 0, height: 20 }) as DOMRect
    dispatchEvent(new Event('scroll'))
    flushFrames()
    expect(far.classList.contains('is-lit')).toBe(false)
  })
})
