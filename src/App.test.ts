import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { experience, interests, profile, projects } from './data'
import { interestHref, projectHref } from './composables/useHashRoute'
import { setMatches } from './test/utils'
import App from './App.vue'

const stubs = { FavoriteThings: { template: '<div class="favorites-stub"><slot /></div>' }, RovPlayground: true }
const gallery = interests.find((interest) => interest.images?.length)!

function app() {
  setMatches(() => false)
  return mount(App, { global: { stubs }, attachTo: document.body })
}

async function go(hash: string) {
  history.pushState(null, '', hash)
  dispatchEvent(new HashChangeEvent('hashchange'))
  await nextTick()
}

afterEach(() => {
  history.replaceState(null, '', '/')
  document.body.innerHTML = ''
})

describe('App', () => {
  it('renders the page with every section', () => {
    const wrapper = app()
    expect(wrapper.find('h1').text()).toBe(profile.name)
    for (const id of ['prosjekter', 'erfaring', 'utdanning', 'teknologier', 'verv', 'om-meg', 'interesser', 'kontakt']) {
      expect(wrapper.find(`#${id}`).exists()).toBe(true)
    }
    expect(wrapper.findAll('.projects__card')).toHaveLength(projects.length)
    expect(wrapper.text()).toContain(new Date().getFullYear().toString())
  })

  it('shows the current job in the hero', () => {
    const current = experience.find((entry) => entry.period.endsWith('nå'))!
    expect(app().find('.now__label').text()).toBe(`${current.title} hos`)
  })

  it('opens a project from the page and goes back in history to close it', async () => {
    const wrapper = app()
    await go(projectHref(projects[0].slug))
    expect(wrapper.find('dialog .detail').exists()).toBe(true)
    const back = vi.spyOn(history, 'back').mockImplementation(() => {})
    await wrapper.find('.modal__close').trigger('click')
    await new Promise((resolve) => setTimeout(resolve))
    expect(back).toHaveBeenCalled()
  })

  it('closes a shared link by clearing the hash and scrolling to the section', async () => {
    history.replaceState(null, '', interestHref(gallery.slug))
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    const wrapper = app()
    expect(wrapper.find('dialog .grid').exists()).toBe(true)
    await wrapper.find('.modal__close').trigger('click')
    await new Promise((resolve) => setTimeout(resolve))
    await flushPromises()
    expect(location.hash).toBe('')
    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(scroll).toHaveBeenCalled()
  })

  it('switches theme from the toggle', async () => {
    const wrapper = app()
    const toggle = wrapper.find('.theme-toggle, [aria-label*="tema" i], [aria-label*="theme" i]')
    expect(toggle.exists()).toBe(true)
    const before = document.documentElement.dataset.theme
    await toggle.trigger('click')
    expect(document.documentElement.dataset.theme).not.toBe(before)
  })
})
