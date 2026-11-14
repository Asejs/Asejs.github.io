import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { education, experience, interests, projects, roles, type InterestIcon as Icon, type LinkIcon as LinkIconName } from '../data'
import EntryItem from './EntryItem.vue'
import InterestIcon from './InterestIcon.vue'
import InterestTile from './InterestTile.vue'
import LinkIcon from './LinkIcon.vue'
import LogoEmblem from './LogoEmblem.vue'
import ProjectCard from './ProjectCard.vue'
import ProjectCover from './ProjectCover.vue'

describe('EntryItem', () => {
  it.each([...experience, ...education, ...roles].map((entry) => [entry.title, entry]))('renders %s', (_, entry) => {
    const wrapper = mount(EntryItem, { props: { entry } })
    expect(wrapper.find('.entry__title').text()).toBe(entry.title)
    expect(wrapper.text()).toContain(entry.period)
    expect(wrapper.classes('entry--current')).toBe(entry.period.endsWith('nå'))
    entry.points?.forEach((point) => expect(wrapper.text()).toContain(point))
  })

  it('shows the organisation and location as text when there is no logo', () => {
    const wrapper = mount(EntryItem, { props: { entry: { title: 'Rolle', org: 'Firma', location: 'Bergen', period: '2020' } } })
    expect(wrapper.find('.entry__org').text()).toBe('Firma · Bergen')
  })

  it('shows a wordmark logo with the organisation for screen readers', () => {
    const wrapper = mount(EntryItem, { props: { entry: { title: 'Rolle', org: 'Firma', period: '2020', logo: { svg: '<svg/>', height: '1rem' } } } })
    expect(wrapper.find('.entry__logo').exists()).toBe(true)
    expect(wrapper.find('.visually-hidden').text()).toBe('Firma')
  })
})

describe('ProjectCard', () => {
  it.each(projects.map((project) => [project.title, project]))('links %s to its detail page', (_, project) => {
    const wrapper = mount(ProjectCard, { props: { project } })
    expect(wrapper.attributes('href')).toBe(`#/prosjekt/${project.slug}`)
    expect(wrapper.find('.card__title').text()).toBe(project.title)
    expect(wrapper.find('.card__eyebrow').text()).toBe(`${project.subtitle.split(' · ')[0]} · ${project.period}`)
  })
})

describe('ProjectCover', () => {
  const base = projects[0]
  it('prefers a video, then an image, then a placeholder', () => {
    expect(mount(ProjectCover, { props: { project: { ...base, video: '/v.mp4' } } }).find('video').exists()).toBe(true)
    const image = mount(ProjectCover, { props: { project: { ...base, video: undefined, cover: '/c.webp' } } })
    expect(image.find('img').attributes('alt')).toBe(base.title)
    const placeholder = mount(ProjectCover, { props: { project: { ...base, video: undefined, cover: undefined } } })
    expect(placeholder.find('.cover__placeholder').text()).toBe(base.title)
  })
})

describe('InterestTile', () => {
  it.each(interests.map((interest) => [interest.title, interest]))('renders %s', (_, interest) => {
    const wrapper = mount(InterestTile, { props: { interest } })
    const hasGallery = !!interest.images?.length
    expect(wrapper.element.tagName).toBe(hasGallery ? 'A' : 'DIV')
    expect(wrapper.find('.tile__arrow').exists()).toBe(hasGallery)
    if (interest.description) expect(wrapper.find('.tile__desc').text()).toBe(interest.description)
  })
})

describe('icons', () => {
  const interestIcons: Icon[] = ['camera', 'brush', 'plane', 'mountain', 'footprints', 'yoga', 'dumbbell']
  it.each(interestIcons)('draws the %s interest icon', (icon) => {
    expect(mount(InterestIcon, { props: { icon } }).find('svg').element.children.length).toBeGreaterThan(0)
  })

  const linkIcons: LinkIconName[] = ['linkedin', 'github', 'mail', 'phone', 'cv', 'location', 'instagram']
  it.each(linkIcons)('draws the %s link icon', (icon) => {
    expect(mount(LinkIcon, { props: { icon } }).find('svg').exists()).toBe(true)
  })
})

describe('LogoEmblem', () => {
  it('uses the given size, and a square badge when the logo has one', () => {
    const plain = mount(LogoEmblem, { props: { logo: { svg: '<svg/>', height: '2rem', color: 'red' } } })
    expect(plain.attributes('style')).toContain('height: 2rem')
    expect(plain.classes('emblem--badge')).toBe(false)
    const badge = mount(LogoEmblem, { props: { logo: { svg: '<svg/>', height: '2rem', badge: { background: 'black', color: 'white' } }, size: '3rem' } })
    expect(badge.classes('emblem--badge')).toBe(true)
    expect(badge.attributes('style')).toContain('width: 3rem')
  })
})
