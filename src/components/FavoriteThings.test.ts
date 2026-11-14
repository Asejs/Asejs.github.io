import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setMatches } from '../test/utils'

const dispose = vi.fn()
const createFavoritesScene = vi.fn(() => ({ dispose }))
vi.mock('../favorites/createFavoritesScene', () => ({ createFavoritesScene }))

type Callback = (entries: { isIntersecting: boolean }[]) => unknown
const observers: Callback[] = []

async function mountFavorites() {
  observers.length = 0
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: Callback) {
        observers.push(callback)
      }
      observe() {}
      disconnect() {}
    },
  )
  Object.defineProperty(document, 'fonts', { value: { load: () => Promise.resolve() }, configurable: true })
  const { default: FavoriteThings } = await import('./FavoriteThings.vue')
  return mount(FavoriteThings, { slots: { default: '<p class="about">Om meg</p>' } })
}

describe('FavoriteThings', () => {
  it('shows its content and lets the objects fly in when it scrolls into view', async () => {
    setMatches(() => false)
    const wrapper = await mountFavorites()
    expect(wrapper.find('.about').exists()).toBe(true)
    expect(wrapper.find('.favorites__stage').classes()).toContain('is-away')
    const [arrival] = observers
    arrival([{ isIntersecting: false }])
    arrival([{ isIntersecting: true }])
    await nextTick()
    expect(wrapper.find('.favorites__stage').classes()).not.toContain('is-away')
  })

  it('starts the 3D scene once it is nearby, and disposes it on unmount', async () => {
    setMatches(() => false)
    const wrapper = await mountFavorites()
    const [, nearby] = observers
    await nearby([{ isIntersecting: false }])
    expect(createFavoritesScene).not.toHaveBeenCalled()
    await nearby([{ isIntersecting: true }])
    await flushPromises()
    expect(createFavoritesScene).toHaveBeenCalledOnce()
    wrapper.unmount()
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('keeps the objects in place with reduced motion', async () => {
    setMatches((query) => query.includes('reduce'))
    const wrapper = await mountFavorites()
    expect(wrapper.find('.favorites__stage').classes()).not.toContain('is-away')
  })
})
