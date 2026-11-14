import { computed, onBeforeUnmount, ref } from 'vue'
import { interests, projects } from '../data'

const PROJECT_PREFIX = '#/prosjekt/'
const INTEREST_PREFIX = '#/interesse/'

export function projectHref(slug: string) {
  return PROJECT_PREFIX + slug
}

export function interestHref(slug: string) {
  return INTEREST_PREFIX + slug
}

function slugAfter(hash: string, prefix: string) {
  return hash.startsWith(prefix) ? hash.slice(prefix.length) : undefined
}

export function useHashRoute() {
  const hash = ref(window.location.hash)

  function onHashChange() {
    hash.value = window.location.hash
  }

  function onClick(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#/"]')
    if (!link) return
    event.preventDefault()
    history.pushState(null, '', link.getAttribute('href'))
    onHashChange()
  }

  window.addEventListener('hashchange', onHashChange)
  window.addEventListener('popstate', onHashChange)
  document.addEventListener('click', onClick)
  onBeforeUnmount(() => {
    window.removeEventListener('hashchange', onHashChange)
    window.removeEventListener('popstate', onHashChange)
    document.removeEventListener('click', onClick)
  })

  const activeProject = computed(() => {
    const slug = slugAfter(hash.value, PROJECT_PREFIX)
    return projects.find((p) => p.slug === slug)
  })

  const activeInterest = computed(() => {
    const slug = slugAfter(hash.value, INTEREST_PREFIX)
    return interests.find((i) => i.slug === slug && i.images?.length)
  })

  return { activeProject, activeInterest }
}
