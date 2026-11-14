import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'

async function load() {
  vi.resetModules()
  return (await import('./reveal')).vReveal
}

const host = (directive: Awaited<ReturnType<typeof load>>) =>
  mount(defineComponent({ render: () => withDirectives(h('section'), [[directive]]) }))

describe('vReveal', () => {
  it('reveals an element once it scrolls into view', async () => {
    let callback!: IntersectionObserverCallback
    const unobserve = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb
        }
        observe = vi.fn()
        unobserve = unobserve
      },
    )
    const wrapper = host(await load())
    const el = wrapper.element as HTMLElement
    expect(el.classList.contains('reveal')).toBe(true)
    callback([{ isIntersecting: false, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(el.classList.contains('is-visible')).toBe(false)
    callback([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(el.classList.contains('is-visible')).toBe(true)
    expect(unobserve).toHaveBeenCalledWith(el)
    wrapper.unmount()
    expect(unobserve).toHaveBeenCalledTimes(2)
  })

  it('shows everything at once without IntersectionObserver', async () => {
    const original = window.IntersectionObserver
    Reflect.deleteProperty(window, 'IntersectionObserver')
    const wrapper = host(await load())
    expect(wrapper.element.classList.contains('is-visible')).toBe(true)
    window.IntersectionObserver = original
  })
})
