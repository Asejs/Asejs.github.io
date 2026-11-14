import { afterEach, describe, expect, it, vi } from 'vitest'
import { setMatches } from '../test/utils'
import { useTheme } from './useTheme'

const click = () => new MouseEvent('click')

afterEach(() => {
  delete document.documentElement.dataset.theme
  localStorage.clear()
  delete (document as Partial<Document>).startViewTransition
})

describe('useTheme', () => {
  it('starts from the theme already on the page', () => {
    document.documentElement.dataset.theme = 'light'
    expect(useTheme().theme.value).toBe('light')
  })

  it('falls back to the system theme', () => {
    setMatches((query) => query.includes('dark'))
    expect(useTheme().theme.value).toBe('dark')
  })

  it('toggles, stores and applies the theme', async () => {
    setMatches(() => false)
    const { theme, toggle } = useTheme()
    await toggle(click())
    expect(theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    await toggle(click())
    expect(theme.value).toBe('light')
  })

  it('still toggles when storage is unavailable', async () => {
    setMatches(() => false)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { theme, toggle } = useTheme()
    await toggle(click())
    expect(theme.value).toBe('dark')
  })

  it('reveals the new theme with a circle from the click', async () => {
    setMatches(() => false)
    const animate = vi.spyOn(document.documentElement, 'animate')
    document.startViewTransition = vi.fn((update) => {
      void (update as () => Promise<void>)()
      return { ready: Promise.resolve() } as ViewTransition
    }) as Document['startViewTransition']
    const button = document.createElement('button')
    const event = new MouseEvent('click', { detail: 1, clientX: 10, clientY: 20 })
    Object.defineProperty(event, 'currentTarget', { value: button })
    const { theme, toggle } = useTheme()
    await toggle(event)
    expect(theme.value).toBe('dark')
    expect(animate).toHaveBeenCalledOnce()
    const [keyframes] = animate.mock.calls[0]
    expect((keyframes as { maskPosition: string[] }).maskPosition[0]).toBe('10px 20px')
  })

  it('starts the circle from the middle of the button for keyboard presses', async () => {
    setMatches(() => false)
    const animate = vi.spyOn(document.documentElement, 'animate')
    document.startViewTransition = vi.fn(() => ({ ready: Promise.resolve() }) as ViewTransition) as Document['startViewTransition']
    const button = document.createElement('button')
    button.getBoundingClientRect = () => ({ left: 100, top: 50, width: 40, height: 20 }) as DOMRect
    const event = new MouseEvent('click', { detail: 0 })
    Object.defineProperty(event, 'currentTarget', { value: button })
    await useTheme().toggle(event)
    const [keyframes] = animate.mock.calls[0]
    expect((keyframes as { maskPosition: string[] }).maskPosition[0]).toBe('120px 60px')
  })
})
