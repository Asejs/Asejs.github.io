import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

enableAutoUnmount(afterEach)

function mediaQuery(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

vi.stubGlobal('matchMedia', vi.fn(mediaQuery))

class Observer {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = () => []
}
vi.stubGlobal('IntersectionObserver', Observer)
vi.stubGlobal('ResizeObserver', Observer)

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}
Element.prototype.animate ??= function () {
  return { finished: Promise.resolve(), cancel: vi.fn(), onfinish: null } as unknown as Animation
}

let frames: FrameRequestCallback[] = []
let nextFrame = 0
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
  frames.push(callback)
  return ++nextFrame
})
vi.stubGlobal('cancelAnimationFrame', () => {})

export function flushFrames() {
  const pending = frames
  frames = []
  pending.forEach((callback) => callback(performance.now()))
}

HTMLCanvasElement.prototype.getContext = function () {
  return new Proxy({} as Record<string | symbol, unknown>, {
    get: (target, key) => (key in target ? target[key] : () => {}),
    set: (target, key, value) => {
      target[key] = value
      return true
    },
  })
} as unknown as HTMLCanvasElement['getContext']
