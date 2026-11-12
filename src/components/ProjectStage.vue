<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import type { Project } from '../data'
import ProjectCard from './ProjectCard.vue'
import { setModalOrigin } from '../composables/modalOrigin'

defineProps<{ projects: Project[] }>()
const row = useTemplateRef<HTMLElement>('row')

// Wide screens lay the cards out side by side, narrower ones stacked under each other.
// Either way, --d is each card's distance from the one in front (in cards).
const stacked = matchMedia('(max-width: 59.99rem)')
const cards = () => [...(row.value?.querySelectorAll<HTMLElement>('.projects__card') ?? [])]

// Set here only, never in the template: Vue re-applies bound styles on every re-render,
// which would snap the cards back for a frame.
function place(card: HTMLElement, d: number) {
  card.style.setProperty('--d', String(d))
  // Fine-grained so two cards never share a level mid-glide and swap back and forth
  card.style.zIndex = String(1000 - Math.round(Math.abs(d) * 100))
}

// --- Side by side: the card under the pointer glides to the front ---
let target = 0
let current = 0
let frame = 0
let front = 0

function render() {
  current += (target - current) * 0.1
  if (Math.abs(target - current) < 0.002) current = target
  front = Math.round(current)
  cards().forEach((card, i) => place(card, i - current))
  frame = current === target ? 0 : requestAnimationFrame(render)
}

function goTo(i: number) {
  target = i
  frame ||= requestAnimationFrame(render)
}

// Which card is under the pointer comes from the cards' layout boxes (offsetLeft ignores
// transforms), so a card moving or turning under a still pointer can't flip the choice.
function onPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || stacked.matches || !row.value) return
  const x = event.clientX - row.value.getBoundingClientRect().left
  const distance = (c: HTMLElement) => Math.abs(c.offsetLeft + c.offsetWidth / 2 - x)
  const all = cards()
  const nearest = all.reduce((best, card, i) => (distance(card) < distance(all[best]) ? i : best), 0)
  if (nearest !== target) goTo(nearest)
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse' && !stacked.matches) goTo(0)
}

// Tapping a side-by-side card that isn't in front brings it forward instead of opening it.
// Opening a card remembers where it is, so the modal can be flung out of it.
function onCardClick(i: number, event: MouseEvent) {
  const card = event.currentTarget as HTMLElement
  if (stacked.matches || i === front) return setModalOrigin(card.getBoundingClientRect())
  event.preventDefault()
  goTo(i)
}

// --- Stacked: the card nearest the middle of the screen is in front ---
let scrollFrame = 0
function onScroll() {
  if (!stacked.matches || scrollFrame) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    cards().forEach((card) => {
      const r = card.getBoundingClientRect()
      place(card, (r.top + r.height / 2 - innerHeight / 2) / r.height)
    })
  })
}

// Shading fades in as the window narrows and side-by-side cards start to overlap
// (around 1340px), reaching full strength 240px narrower
function onResize() {
  const shade = Math.min(Math.max((1344 - innerWidth) / 240, 0), 1)
  row.value?.style.setProperty('--shade', String(stacked.matches ? 1 : shade))
  if (stacked.matches) onScroll()
  else render()
}

onMounted(() => {
  onResize()
  addEventListener('resize', onResize)
  addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  cancelAnimationFrame(scrollFrame)
  removeEventListener('resize', onResize)
  removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div ref="row" class="projects" @pointermove="onPointerMove" @pointerleave="onPointerLeave">
    <ProjectCard
      v-for="(project, i) in projects"
      :key="project.slug"
      :project="project"
      class="projects__card"
      @click="onCardClick(i, $event)"
    />
  </div>
</template>

<style scoped>
.projects {
  perspective: 1400px;
}

.projects__card {
  --a: max(var(--d, 0), -1 * var(--d, 0));
  position: relative;
  background: color-mix(in srgb, var(--text) 4%, var(--bg));
  border-radius: 10px;
  overflow: hidden;
  filter: brightness(calc(1 - min(var(--a), 1) * 0.28 * var(--shade, 1)));
}

.projects__card :deep(.card__body) {
  padding: 0 1.25rem 1.25rem;
}

/*
 * Narrow screens: the cards stacked under each other. The one in the middle of the
 * screen is in front; the ones above and below tip back and darken, and the next
 * one comes forward as you scroll.
 */
@media (max-width: 59.99rem) {
  .projects {
    display: grid;
    gap: 2rem;
  }

  .projects__card {
    transform: translateZ(calc(min(var(--a), 1.5) * -60px)) rotateX(calc(clamp(-1.5, var(--d, 0), 1.5) * 8deg));
  }
}

/*
 * Wide screens: all three cards side by side. The card in front is full size; the
 * others sit further back, turned toward it and in shadow. The narrower the screen,
 * the more they overlap, like a hand of cards.
 */
@media (min-width: 60rem) {
  .projects {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem;
    width: calc(100vw - 3rem);
    margin-left: 50%;
    translate: -50% 0;
  }

  .projects__card {
    /* Readable width: never narrower than 26rem; the cards overlap instead */
    width: max(100%, 26rem);
    justify-self: center;
    transform: translateZ(calc(var(--a) * -110px)) rotateY(calc(var(--d, 0) * -9deg));
    filter: brightness(calc(1 - var(--a) * 0.28 * var(--shade, 1)));
  }

  .projects__card:first-child {
    justify-self: start;
  }

  .projects__card:last-child {
    justify-self: end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .projects__card {
    transform: none !important;
  }
}
</style>
