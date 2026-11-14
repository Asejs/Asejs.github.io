import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { interests, projects } from '../data'
import { withSetup } from '../test/utils'
import { interestHref, projectHref, useHashRoute } from './useHashRoute'

const project = projects[0]
const gallery = interests.find((interest) => interest.images?.length)!
const noGallery = interests.find((interest) => !interest.images?.length)!

afterEach(() => history.replaceState(null, '', '/'))

function link(href: string) {
  const a = document.createElement('a')
  a.setAttribute('href', href)
  document.body.append(a)
  return a
}

describe('hrefs', () => {
  it('builds route hashes', () => {
    expect(projectHref('echo')).toBe('#/prosjekt/echo')
    expect(interestHref('foto')).toBe('#/interesse/foto')
  })
})

describe('useHashRoute', () => {
  it('reads the route from the hash on load', () => {
    history.replaceState(null, '', projectHref(project.slug))
    const { result } = withSetup(() => useHashRoute())
    expect(result.activeProject.value).toBe(project)
    expect(result.activeInterest.value).toBeUndefined()
  })

  it('only opens interests that have a gallery', () => {
    history.replaceState(null, '', interestHref(gallery.slug))
    expect(withSetup(() => useHashRoute()).result.activeInterest.value).toBe(gallery)
    history.replaceState(null, '', interestHref(noGallery.slug))
    expect(withSetup(() => useHashRoute()).result.activeInterest.value).toBeUndefined()
  })

  it('ignores unknown slugs', () => {
    history.replaceState(null, '', projectHref('nope'))
    expect(withSetup(() => useHashRoute()).result.activeProject.value).toBeUndefined()
  })

  it('follows hash changes and the back button', async () => {
    const { result } = withSetup(() => useHashRoute())
    history.replaceState(null, '', projectHref(project.slug))
    dispatchEvent(new HashChangeEvent('hashchange'))
    await nextTick()
    expect(result.activeProject.value).toBe(project)
    history.replaceState(null, '', '/')
    dispatchEvent(new PopStateEvent('popstate'))
    expect(result.activeProject.value).toBeUndefined()
  })

  it('opens route links without a fragment jump', () => {
    const { result } = withSetup(() => useHashRoute())
    const a = link(projectHref(project.slug))
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    a.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(location.hash).toBe(projectHref(project.slug))
    expect(result.activeProject.value).toBe(project)
  })

  it('leaves other clicks alone', () => {
    withSetup(() => useHashRoute())
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true })
    link('#kontakt').dispatchEvent(plain)
    expect(plain.defaultPrevented).toBe(false)
    const newTab = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true })
    link(projectHref(project.slug)).dispatchEvent(newTab)
    expect(newTab.defaultPrevented).toBe(false)
  })

  it('stops listening when unmounted', () => {
    const { result, wrapper } = withSetup(() => useHashRoute())
    wrapper.unmount()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    link(projectHref(project.slug)).dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(result.activeProject.value).toBeUndefined()
  })
})
