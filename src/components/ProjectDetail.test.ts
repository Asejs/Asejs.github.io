import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { projects } from '../data'
import ProjectDetail from './ProjectDetail.vue'

const stubs = { RovPlayground: { template: '<div class="rov-stub" />' } }
const detail = (project = projects[0]) => mount(ProjectDetail, { props: { project }, global: { stubs } })

describe('ProjectDetail', () => {
  it.each(projects.map((project) => [project.title, project]))('shows everything about %s', (_, project) => {
    const wrapper = detail(project)
    expect(wrapper.find('h1').text()).toBe(project.title)
    expect(wrapper.find('.eyebrow').text()).toBe(`${project.subtitle} · ${project.period}`)
    expect(wrapper.findAll('.tag').map((tag) => tag.text())).toEqual(project.tags)
    project.description.forEach((paragraph) => expect(wrapper.text()).toContain(paragraph))
    project.highlights?.forEach((item) => expect(wrapper.text()).toContain(item))
    expect(wrapper.findAll('.detail__link')).toHaveLength(project.links?.length ?? 0)
    expect(wrapper.findAll('figure')).toHaveLength(project.images?.length ?? 0)
  })

  it('uses the video, banner, cover or first picture behind the heading', () => {
    const base = { ...projects[0], video: undefined, banner: undefined, cover: undefined, images: undefined }
    expect(
      detail({ ...base, video: '/v.mp4' })
        .find('.detail__banner video')
        .exists(),
    ).toBe(true)
    expect(
      detail({ ...base, banner: '/b.webp' })
        .find('.detail__banner img')
        .attributes('src'),
    ).toBe('/b.webp')
    expect(
      detail({ ...base, cover: '/c.webp' })
        .find('.detail__banner img')
        .attributes('src'),
    ).toBe('/c.webp')
    expect(
      detail({ ...base, images: [{ src: '/i.webp', alt: 'I' }] })
        .find('.detail__banner img')
        .attributes('src'),
    ).toBe('/i.webp')
    expect(detail(base).find('.detail__banner').exists()).toBe(false)
  })

  it('shows videos, cut-outs and the cover in the gallery', () => {
    const wrapper = detail({
      ...projects[0],
      coverOnPage: true,
      images: [
        { src: '/poster.webp', alt: 'Video', video: '/v.mp4' },
        { src: '/cut.webp', alt: 'Cut', cutout: true },
      ],
    })
    expect(wrapper.find('.gallery video').attributes('poster')).toBe('/poster.webp')
    expect(wrapper.find('.gallery img.cutout').exists()).toBe(true)
    expect(wrapper.find('.gallery .cover').exists()).toBe(true)
  })

  it('adds the ROV playground when the project has a model', () => {
    const withModel = projects.find((project) => project.model)!
    expect(detail(withModel).find('.rov-stub').exists()).toBe(true)
  })
})
