import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { projects } from '../data'
import { takeModalOrigin } from '../composables/modalOrigin'
import { flushFrames, setMatches } from '../test/utils'
import ProjectStage from './ProjectStage.vue'

function pointer(type: string, x: number, pointerType = 'mouse') {
  const event = new MouseEvent(type, { clientX: x, clientY: 0, bubbles: true, cancelable: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  return event
}

function settle() {
  for (let i = 0; i < 300; i++) flushFrames()
}

function stage(stacked: boolean) {
  setMatches((query) => stacked && query.includes('74.99rem'))
  const wrapper = mount(ProjectStage, { props: { projects }, attachTo: document.body })
  const cards = wrapper.findAll<HTMLElement>('.projects__card').map((card) => card.element)
  cards.forEach((card, i) => {
    Object.defineProperty(card, 'offsetLeft', { value: i * 300 })
    Object.defineProperty(card, 'offsetWidth', { value: 300 })
    card.getBoundingClientRect = () => ({ left: i * 300, top: i * 400, width: 300, height: 400 }) as DOMRect
  })
  wrapper.element.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
  settle()
  return { wrapper, cards, row: wrapper.element as HTMLElement }
}

const depth = (card: HTMLElement) => Number(card.style.getPropertyValue('--d'))

describe('ProjectStage side by side', () => {
  it('brings the card under the mouse to the front, and back on leave', () => {
    const { cards, row } = stage(false)
    expect(depth(cards[0])).toBe(0)
    row.dispatchEvent(pointer('pointermove', 950))
    settle()
    expect(depth(cards[2])).toBe(0)
    expect(depth(cards[0])).toBe(-2)
    expect(cards[0].style.getPropertyValue('--spot-x')).toBe('950px')
    row.dispatchEvent(pointer('pointerleave', 0))
    settle()
    expect(depth(cards[0])).toBe(0)
  })

  it('ignores touch', () => {
    const { cards, row } = stage(false)
    row.dispatchEvent(pointer('pointermove', 950, 'touch'))
    settle()
    expect(depth(cards[0])).toBe(0)
  })

  it('brings a card forward on tap, and opens it once it is in front', () => {
    const { cards } = stage(false)
    const tap = new MouseEvent('click', { bubbles: true, cancelable: true })
    cards[1].dispatchEvent(tap)
    expect(tap.defaultPrevented).toBe(true)
    settle()
    expect(depth(cards[1])).toBe(0)
    const open = new MouseEvent('click', { bubbles: true, cancelable: true })
    cards[1].dispatchEvent(open)
    expect(open.defaultPrevented).toBe(false)
    expect(takeModalOrigin()).toBeDefined()
  })
})

describe('ProjectStage stacked', () => {
  it('puts the card nearest the middle of the screen in front as the page scrolls', () => {
    const { cards } = stage(true)
    cards.forEach((card, i) => {
      card.getBoundingClientRect = () => ({ left: 0, top: innerHeight / 2 - 200 + (i - 1) * 400, width: 300, height: 400 }) as DOMRect
    })
    dispatchEvent(new Event('scroll'))
    dispatchEvent(new Event('scroll'))
    flushFrames()
    expect(depth(cards[1])).toBe(0)
    expect(depth(cards[0])).toBe(-1)
    dispatchEvent(new Event('resize'))
    flushFrames()
    expect(depth(cards[2])).toBe(1)
  })

  it('opens cards straight away and ignores the mouse for ordering', () => {
    const { cards, row } = stage(true)
    row.dispatchEvent(pointer('pointermove', 950))
    row.dispatchEvent(pointer('pointerleave', 0))
    const tap = new MouseEvent('click', { bubbles: true, cancelable: true })
    cards[2].dispatchEvent(tap)
    expect(tap.defaultPrevented).toBe(false)
  })

  it('stops listening when unmounted', () => {
    const { wrapper, cards } = stage(true)
    const spy = vi.spyOn(cards[0].style, 'setProperty')
    wrapper.unmount()
    dispatchEvent(new Event('scroll'))
    flushFrames()
    expect(spy).not.toHaveBeenCalled()
  })
})
