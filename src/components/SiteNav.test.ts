import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { flushFrames } from '../test/utils'
import SiteNav from './SiteNav.vue'

const ids = ['prosjekter', 'erfaring', 'om-meg', 'kontakt']
let tops: Record<string, number> = {}

function page() {
  ids.forEach((id) => {
    const heading = document.createElement('h2')
    heading.id = id
    heading.getBoundingClientRect = () => ({ top: tops[id] ?? 9999 }) as DOMRect
    heading.scrollIntoView = vi.fn()
    document.body.append(heading)
  })
}

function nav(heroBottom: number) {
  const hero = document.createElement('header')
  hero.getBoundingClientRect = () => ({ bottom: heroBottom }) as DOMRect
  return mount(SiteNav, { props: { hero }, attachTo: document.body })
}

async function scroll() {
  dispatchEvent(new Event('scroll'))
  flushFrames()
  await nextTick()
}

beforeEach(() => {
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 100000, configurable: true })
})

afterEach(() => {
  document.body.innerHTML = ''
  tops = {}
})

describe('SiteNav', () => {
  it('stays hidden over the hero', () => {
    page()
    const wrapper = nav(100)
    expect(wrapper.classes('is-shown')).toBe(false)
    expect(wrapper.attributes('inert')).toBeDefined()
  })

  it('appears past the hero and marks the section in view', async () => {
    page()
    const wrapper = nav(-10)
    tops = { prosjekter: -500, erfaring: 50 }
    await scroll()
    expect(wrapper.classes('is-shown')).toBe(true)
    const active = wrapper.find('.is-active')
    expect(active.attributes('href')).toBe('#erfaring')
    expect(active.attributes('aria-current')).toBe('location')
  })

  it('marks the last section at the bottom of the page', async () => {
    page()
    const wrapper = nav(-10)
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 0, configurable: true })
    await scroll()
    expect(wrapper.find('.is-active').attributes('href')).toBe('#kontakt')
  })

  it('scrolls to a section on click and keeps it marked while scrolling there', async () => {
    page()
    const wrapper = nav(-10)
    const link = wrapper.findAll('a')[2]
    await link.trigger('click')
    expect(document.getElementById('om-meg')!.scrollIntoView).toHaveBeenCalled()
    tops = { prosjekter: 0 }
    await scroll()
    expect(wrapper.find('.is-active').attributes('href')).toBe('#om-meg')
  })

  it('stops listening when unmounted', async () => {
    page()
    const wrapper = nav(100)
    wrapper.unmount()
    await scroll()
  })
})
