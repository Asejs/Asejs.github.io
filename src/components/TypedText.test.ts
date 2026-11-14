import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setMatches } from '../test/utils'
import TypedText from './TypedText.vue'

const typed = (wrapper: ReturnType<typeof mount>) => wrapper.find('[aria-hidden="true"]').text()

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('TypedText', () => {
  it('types the text out after the delay, then hides the caret', async () => {
    setMatches(() => false)
    const wrapper = mount(TypedText, { props: { text: 'Hei', delay: 100, speed: 50 } })
    expect(wrapper.attributes('aria-label')).toBe('Hei')
    expect(typed(wrapper)).toBe('')
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(typed(wrapper)).toBe('H')
    expect(wrapper.find('.typed__caret').exists()).toBe(true)
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(typed(wrapper)).toBe('Hei')
    expect(wrapper.find('.typed__caret').classes('is-idle')).toBe(true)
    vi.advanceTimersByTime(1600)
    await nextTick()
    expect(wrapper.find('.typed__caret').exists()).toBe(false)
  })

  it('can keep the caret blinking at the end', async () => {
    setMatches(() => false)
    const wrapper = mount(TypedText, { props: { text: 'Å', keepCaret: true } })
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(wrapper.find('.typed__caret').exists()).toBe(true)
  })

  it('shows the whole text at once with reduced motion', () => {
    setMatches((query) => query.includes('reduce'))
    const wrapper = mount(TypedText, { props: { text: 'Hei' } })
    expect(typed(wrapper)).toBe('Hei')
    expect(wrapper.find('.typed__caret').exists()).toBe(false)
  })
})
