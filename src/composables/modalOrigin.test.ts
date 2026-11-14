import { describe, expect, it } from 'vitest'
import { rect } from '../test/utils'
import { setModalOrigin, takeModalOrigin } from './modalOrigin'

describe('modalOrigin', () => {
  it('hands the origin over once', () => {
    const origin = rect(1, 2, 3, 4)
    setModalOrigin(origin)
    expect(takeModalOrigin()).toBe(origin)
    expect(takeModalOrigin()).toBeUndefined()
  })
})
