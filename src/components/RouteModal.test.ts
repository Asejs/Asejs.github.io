import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setModalOrigin } from '../composables/modalOrigin'
import { rect, setMatches } from '../test/utils'
import RouteModal from './RouteModal.vue'

function open(props = {}) {
  return mount(RouteModal, { props, slots: { default: '<p class="content">Innhold</p>' }, attachTo: document.body })
}

const settle = () => new Promise((resolve) => setTimeout(resolve))

describe('RouteModal', () => {
  it('opens as a modal dialog with its content', () => {
    setMatches(() => false)
    const wrapper = open()
    expect(wrapper.find('dialog').attributes('open')).toBeDefined()
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.find('.modal__column').exists()).toBe(true)
  })

  it('drops the text column when wide', () => {
    setMatches(() => false)
    const wrapper = open({ wide: true })
    expect(wrapper.classes()).toContain('modal--wide')
    expect(wrapper.find('.modal__column').exists()).toBe(false)
  })

  it('grows out of the card that opened it', () => {
    setMatches(() => false)
    setModalOrigin(rect(10, 10, 100, 100))
    const animate = vi.spyOn(HTMLElement.prototype, 'animate')
    open()
    const [frames] = animate.mock.calls[0]
    expect(String((frames as Keyframe[])[0].transform)).toContain('translate(')
  })

  it('closes after fading out, from the button, Escape or the backdrop', async () => {
    setMatches(() => false)
    for (const close of [
      (w: ReturnType<typeof open>) => w.find('.modal__close').trigger('click'),
      (w: ReturnType<typeof open>) => w.find('dialog').trigger('cancel'),
      (w: ReturnType<typeof open>) => w.find('dialog').trigger('click'),
    ]) {
      const wrapper = open()
      await close(wrapper)
      await close(wrapper)
      await settle()
      expect(wrapper.emitted('close')).toHaveLength(1)
    }
  })

  it('ignores clicks inside the content', async () => {
    setMatches(() => false)
    const wrapper = open()
    await wrapper.find('.content').trigger('click')
    await settle()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('opens and closes without animation with reduced motion', async () => {
    setMatches((query) => query.includes('reduce'))
    const animate = vi.spyOn(HTMLElement.prototype, 'animate')
    const wrapper = open()
    await wrapper.find('.modal__close').trigger('click')
    expect(animate).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
