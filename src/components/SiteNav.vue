<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ hero: HTMLElement | null }>()

const links = [
  { id: 'prosjekter', label: 'Prosjekter' },
  { id: 'erfaring', label: 'Erfaring' },
  { id: 'om-meg', label: 'Om meg' },
  { id: 'kontakt', label: 'Kontakt' },
]

const shown = ref(false)
const active = ref<string>()
let frame = 0
let heldUntil = 0

function update() {
  frame = 0
  shown.value = (props.hero?.getBoundingClientRect().bottom ?? 0) < 0
  if (performance.now() < heldUntil) return
  const line = innerHeight * 0.4
  active.value = undefined
  for (const { id } of links) {
    const heading = document.getElementById(id)
    if (heading && heading.getBoundingClientRect().top <= line) active.value = id
  }
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) active.value = links.at(-1)!.id
}

function onScroll() {
  frame ||= requestAnimationFrame(update)
}

function go(event: MouseEvent, id: string) {
  event.preventDefault()
  active.value = id
  heldUntil = performance.now() + 1200
  document.getElementById(id)?.scrollIntoView({ block: 'start' })
}

onMounted(() => {
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)
  update()
})
onBeforeUnmount(() => {
  removeEventListener('scroll', onScroll)
  removeEventListener('resize', onScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <nav class="nav" :class="{ 'is-shown': shown }" aria-label="Seksjoner" :inert="!shown">
    <ul class="nav__links">
      <li v-for="link in links" :key="link.id">
        <a
          :href="`#${link.id}`"
          class="nav__link"
          :class="{ 'is-active': active === link.id }"
          :aria-current="active === link.id ? 'location' : undefined"
          @click="go($event, link.id)"
          >{{ link.label }}</a
        >
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  z-index: 20;
  inset: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.5rem;
  padding: 0.7rem max(1.25rem, 4vw);
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
  translate: 0 -100%;
  opacity: 0;
  transition:
    translate 0.35s ease,
    opacity 0.35s ease;
}

.nav.is-shown {
  translate: 0 0;
  opacity: 1;
}

.nav__links {
  display: flex;
  gap: clamp(0.9rem, 3vw, 2rem);
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: none;
}

.nav__link {
  position: relative;
  display: block;
  padding: 0.3rem 0;
  font-size: 0.88rem;
  white-space: nowrap;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav__link:hover,
.nav__link.is-active {
  color: var(--text);
}

.nav__link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--accent);
  scale: 0 1;
  transition: scale 0.25s ease;
}

.nav__link.is-active::after {
  scale: 1 1;
}

.nav a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .nav,
  .nav__link::after {
    transition: none;
  }
}
</style>
