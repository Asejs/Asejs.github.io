import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { interests } from '../data'
import { setMatches } from '../test/utils'
import InterestGallery from './InterestGallery.vue'

const interest = interests.find((i) => i.images?.length)!
const images = interest.images!
const key = (k: string) => dispatchEvent(new KeyboardEvent('keydown', { key: k, cancelable: true }))

function mountGallery(columns = 3) {
  const width = [500, 1000, 1500, 2000, 3000][columns - 1]
  setMatches((query) => width <= Number(query.match(/max-width: (\d+)px/)?.[1]))
  return mount(InterestGallery, { props: { interest } })
}

describe('InterestGallery', () => {
  it('shows a heading and every picture, spread over the columns', () => {
    const wrapper = mountGallery(3)
    expect(wrapper.find('.head__title').text()).toBe(interest.galleryTitle)
    expect(wrapper.find('.head__eyebrow').text()).toContain(`${images.length} bilder`)
    expect(wrapper.findAll('.grid__column')).toHaveLength(3)
    expect(wrapper.findAll('.grid__item')).toHaveLength(images.length)
  })

  it.each([1, 2, 4, 5])('uses %i columns at that width', (columns) => {
    expect(mountGallery(columns).findAll('.grid__column')).toHaveLength(columns)
  })

  it('opens a picture large and steps through them with the keyboard', async () => {
    const wrapper = mountGallery()
    await wrapper.findAll('.grid__item')[0].trigger('click')
    const shown = () => wrapper.find('.lightbox img').attributes('src')
    expect(shown()).toBe(images[0].src)
    expect(wrapper.find('figcaption').text()).toBe(images[0].caption)
    key('ArrowRight')
    await nextTick()
    expect(shown()).toBe(images[1].src)
    key('ArrowLeft')
    key('ArrowLeft')
    await nextTick()
    expect(shown()).toBe(images[images.length - 1].src)
    key('x')
    key('Escape')
    await nextTick()
    expect(wrapper.find('.lightbox').exists()).toBe(false)
  })

  it('steps with the arrow buttons and closes with the button or the backdrop', async () => {
    const wrapper = mountGallery()
    await wrapper.findAll('.grid__item')[0].trigger('click')
    await wrapper.find('.lightbox__nav--next').trigger('click')
    expect(wrapper.find('.lightbox img').attributes('src')).toBe(images[1].src)
    await wrapper.find('.lightbox__nav--prev').trigger('click')
    await wrapper.find('.lightbox__close').trigger('click')
    expect(wrapper.find('.lightbox').exists()).toBe(false)
    await wrapper.findAll('.grid__item')[0].trigger('click')
    await wrapper.find('.lightbox').trigger('click')
    expect(wrapper.find('.lightbox').exists()).toBe(false)
  })

  it('ignores keys while closed', () => {
    const wrapper = mountGallery()
    key('ArrowRight')
    expect(wrapper.find('.lightbox').exists()).toBe(false)
  })

  it('works for a gallery with a single picture and no camera', async () => {
    setMatches(() => false)
    const wrapper = mount(InterestGallery, {
      props: { interest: { slug: 's', title: 'Maling', icon: 'brush', galleryDescription: 'Olje', images: [{ src: '/a.webp', alt: 'A' }] } },
    })
    expect(wrapper.find('.head__title').text()).toBe('Maling')
    expect(wrapper.find('.head__desc').text()).toBe('Olje')
    await wrapper.find('.grid__item').trigger('click')
    expect(wrapper.find('.lightbox__nav').exists()).toBe(false)
  })
})
