import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { flushFrames, setMatches } from '../test/utils'
import { vTimelineFill } from './timelineFill'

function layout(el: HTMLElement, values: Partial<Record<'offsetTop' | 'offsetHeight', number>> & { offsetParent?: Element | null }) {
  for (const [key, value] of Object.entries(values)) Object.defineProperty(el, key, { value, configurable: true })
}

function mountTimeline(arg?: string, { continued = false, continues = false, top = 0 } = {}) {
  const wrapper = mount(
    defineComponent({
      render: () =>
        h('div', [
          h('section', { class: continued ? 'section--continued' : '' }, [
            withDirectives(h('ol', { class: 'timeline' }, [h('li', { class: 'entry' }), h('li', { class: 'entry' })]), [[vTimelineFill, undefined, arg]]),
          ]),
          continues ? h('section', { class: 'section--continued' }) : null,
        ]),
    }),
    { attachTo: document.body },
  )
  const el = wrapper.find<HTMLElement>('ol').element
  const [first, last] = wrapper.findAll<HTMLElement>('.entry').map((entry) => entry.element)
  layout(el, { offsetHeight: 400 })
  layout(first, { offsetTop: 0, offsetParent: el })
  layout(last, { offsetTop: 300, offsetParent: el })
  el.getBoundingClientRect = () => ({ top }) as DOMRect
  return { wrapper, el, first, last }
}

const style = (el: HTMLElement, name: string) => el.style.getPropertyValue(name)

afterEach(() => vi.restoreAllMocks())

describe('vTimelineFill', () => {
  it('runs the line between the dots and fills it as the page scrolls', () => {
    setMatches(() => false)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ top: '10px', height: '20px', marginTop: '0px' } as CSSStyleDeclaration)
    const { el, first, last } = mountTimeline(undefined, { top: innerHeight * 0.6 - 170 })
    flushFrames()
    expect(style(el, '--line-start')).toBe('20px')
    expect(style(el, '--line-end')).toBe('320px')
    expect(Number(style(el, '--fill'))).toBe(0.5)
    expect(first.classList.contains('is-lit')).toBe(true)
    expect(last.classList.contains('is-lit')).toBe(false)
  })

  it('joins the timeline above and below', () => {
    setMatches(() => false)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ top: '10px', height: '20px' } as CSSStyleDeclaration)
    const { el } = mountTimeline(undefined, { continued: true, continues: true })
    flushFrames()
    expect(style(el, '--line-start')).toBe('0px')
    expect(style(el, '--line-end')).toBe('400px')
  })

  it('fills a gap section from its margin down to the timeline inside it', () => {
    setMatches(() => false)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ marginTop: '80px' } as CSSStyleDeclaration)
    const { el } = mountTimeline('gap')
    flushFrames()
    expect(style(el, '--line-start')).toBe('-80px')
    expect(style(el, '--line-end')).toBe('400px')
  })

  it('fills everything with reduced motion', () => {
    setMatches((query) => query.includes('reduce'))
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ top: '10px', height: '20px' } as CSSStyleDeclaration)
    const { el, last } = mountTimeline()
    flushFrames()
    expect(style(el, '--fill')).toBe('1')
    expect(last.classList.contains('is-lit')).toBe(true)
  })

  it('handles an empty timeline and stops listening when unmounted', () => {
    setMatches(() => false)
    const wrapper = mount(defineComponent({ render: () => withDirectives(h('ol'), [[vTimelineFill]]) }))
    const el = wrapper.element as HTMLElement
    layout(el, { offsetHeight: 200 })
    flushFrames()
    expect(style(el, '--line-end')).toBe('200px')
    wrapper.unmount()
    el.style.removeProperty('--line-end')
    dispatchEvent(new Event('scroll'))
    flushFrames()
    expect(style(el, '--line-end')).toBe('')
  })
})
