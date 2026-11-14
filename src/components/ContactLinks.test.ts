import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { profile } from '../data'
import ContactLinks from './ContactLinks.vue'

const mountLinks = () => mount(ContactLinks, { props: { label: 'Kontakt' }, attachTo: document.body })
const menuLink = profile.links.find((link) => link.variants)!

describe('ContactLinks', () => {
  it('lists the links and contact details', () => {
    const wrapper = mountLinks()
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Kontakt')
    expect(wrapper.text()).toContain(profile.email)
    expect(wrapper.text()).toContain(profile.phone)
    expect(wrapper.find(`a[href="mailto:${profile.email}"]`).exists()).toBe(true)
    const external = wrapper.findAll('a.pill').find((a) => a.attributes('href')?.startsWith('http'))
    expect(external?.attributes('target')).toBe('_blank')
  })

  it('opens and closes the CV language menu', async () => {
    const wrapper = mountLinks()
    const button = wrapper.find('button.pill')
    expect(button.text()).toContain(menuLink.label)
    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('.menu__option')).toHaveLength(menuLink.variants!.length)
    await wrapper.find('.menu__option').trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('closes the menu on Escape and returns focus to the button', async () => {
    const wrapper = mountLinks()
    const button = wrapper.find('button.pill')
    await button.trigger('click')
    await wrapper.find('.menu').trigger('keydown', { key: 'Escape' })
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
  })

  it('closes the menu on a click outside it, but not inside', async () => {
    const wrapper = mountLinks()
    const button = wrapper.find('button.pill')
    await button.trigger('click')
    wrapper.find('.menu__popover').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('true')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('false')
  })
})
