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

  window.addEventListener('hashchange', onHashChange)
  onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))

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
