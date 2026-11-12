<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { Project } from '../data'
import ProjectCard from './ProjectCard.vue'
import { setModalOrigin } from '../composables/modalOrigin'

defineProps<{ projects: Project[] }>()
const row = useTemplateRef<HTMLElement>('row')

// Phones get a swipeable row; wider screens a fanned-out 3D stack
const phone = matchMedia('(max-width: 39.99rem)')
const active = ref(0)
const cards = () => [...(row.value?.querySelectorAll<HTMLElement>('.projects__card') ?? [])]

// --- Stack: the card in front (0 = first) glides there smoothly ---
let target = 0
let current = 0
let frame = 0

function render() {
  current += (target - current) * 0.1
  if (Math.abs(target - current) < 0.002) current = target
  active.value = Math.round(current)
  cards().forEach((card, i) => {
    card.style.setProperty('--d', String(i - current))
    // Fine-grained so two cards never share a level mid-glide and swap back and forth
    card.style.zIndex = String(1000 - Math.round(Math.abs(i - current) * 100))
  })
  frame = current === target ? 0 : requestAnimationFrame(render)
}

function goTo(i: number) {
  if (phone.matches) {
    // Scroll only the row sideways (scrollIntoView would also move the page)
    const card = cards()[i]
    if (card && row.value) row.value.scrollTo({ left: card.offsetLeft - (row.value.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' })
    return
  }
  target = i
  frame ||= requestAnimationFrame(render)
}

// Mouse: the card under the pointer comes forward, and the first one when it leaves.
// Which card that is comes from the cards' layout boxes (offsetLeft ignores transforms),
// so a card moving or turning under a still pointer can't flip the choice back and forth.
function onPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || phone.matches || !row.value) return
  const x = event.clientX - row.value.getBoundingClientRect().left
  let nearest = 0
  cards().forEach((card, i) => {
    const centre = (c: HTMLElement) => Math.abs(c.offsetLeft + c.offsetWidth / 2 - x)
    if (centre(card) < centre(cards()[nearest])) nearest = i
  })
  if (nearest !== target) goTo(nearest)
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse' && !phone.matches) goTo(0)
}

// Tapping a card that isn't in front brings it forward instead of opening it.
// Opening the front card remembers where it is, so the modal can be flung out of it.
function onCardClick(i: number, event: MouseEvent) {
  const card = event.currentTarget as HTMLElement
  if (i === active.value) return setModalOrigin(card.getBoundingClientRect())
  event.preventDefault()
  goTo(i)
}

// --- Swipe row: each card's distance from the centre, in card widths ---
function onScroll() {
  if (!phone.matches || !row.value) return
  const r = row.value.getBoundingClientRect()
  const centre = r.left + r.width / 2
  cards().forEach((card, i) => {
    const c = card.getBoundingClientRect()
    const d = (c.left + c.width / 2 - centre) / c.width
    card.style.setProperty('--d', String(d))
    if (Math.abs(d) < 0.5) active.value = i
  })
}

// --d and z-index are set here only, never in the template: Vue re-applies bound styles on
// every re-render (e.g. when `active` changes), which would snap the cards back for a frame.

// Shading fades in as the window narrows and the stacked cards start to overlap
// (around 1340px), reaching full strength 240px narrower
function onResize() {
  const shade = Math.min(Math.max((1344 - innerWidth) / 240, 0), 1)
  row.value?.style.setProperty('--shade', String(shade))
  if (phone.matches) onScroll()
  else render()
}

onMounted(() => {
  onResize()
  addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  removeEventListener('resize', onResize)
})
</script>

<template>
  <div>
    <div ref="row" class="projects" @pointermove="onPointerMove" @pointerleave="onPointerLeave" @scroll.passive="onScroll">
      <ProjectCard
        v-for="(project, i) in projects"
        :key="project.slug"
        :project="project"
        class="projects__card"
        @click="onCardClick(i, $event)"
      />
    </div>
    <div class="dots">
      <button
        v-for="(project, i) in projects"
        :key="project.slug"
        type="button"
        class="dots__dot"
        :class="{ 'is-active': i === active }"
        :aria-label="`Vis ${project.title}`"
        :aria-current="i === active ? 'true' : undefined"
        @click="goTo(i)"
      />
    </div>
  </div>
</template>

<style scoped>
.projects__card {
  --a: max(var(--d), -1 * var(--d));
  position: relative;
  background: color-mix(in srgb, var(--text) 4%, var(--bg));
  border-radius: 10px;
  overflow: hidden;
}

.projects__card :deep(.card__body) {
  padding: 0 1.25rem 1.25rem;
}

/*
 * Phones: a swipeable row that snaps one card at a time, with the next card
 * peeking in. Cards away from the centre shrink and darken as you swipe.
 */
@media (max-width: 39.99rem) {
  .projects {
    --w: 82vw;
    display: flex;
    gap: 0.75rem;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    padding: 0.5rem calc((100vw - var(--w)) / 2) 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .projects::-webkit-scrollbar {
    display: none;
  }

  .projects__card {
    flex: 0 0 var(--w);
    scroll-snap-align: center;
    transform: scale(calc(1 - min(var(--a), 1) * 0.06));
    filter: brightness(calc(1 - min(var(--a), 1) * 0.35));
  }
}

/*
 * Wider screens: all three cards side by side. The card in front is full size; the
 * others sit further back, turned toward it and in shadow. The narrower the screen,
 * the more they overlap, like a hand of cards.
 * --d is the card's distance from the front card (negative = to the left).
 */
@media (min-width: 40rem) {
  .projects {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(0.5rem, 2vw, 2rem);
    width: calc(100vw - 3rem);
    margin-left: 50%;
    translate: -50% 0;
    perspective: 1400px;
  }

  .projects__card {
    /* Readable width: never narrower than 26rem; the cards overlap instead */
    width: max(100%, 26rem);
    justify-self: center;
    transform: translateZ(calc(var(--a) * -110px)) rotateY(calc(var(--d) * -9deg));
    filter: brightness(calc(1 - var(--a) * 0.28 * var(--shade, 1)));
  }

  .projects__card:first-child {
    justify-self: start;
  }

  .projects__card:last-child {
    justify-self: end;
  }
}

/* Dots to switch cards where there is no hover (and the cards overlap most) */
.dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.dots__dot {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

/* Small visible dot inside a comfortable tap target */
.dots__dot::before {
  content: '';
  display: block;
  width: 0.45rem;
  height: 0.45rem;
  margin: auto;
  border-radius: 50%;
  background: var(--line);
  transition:
    background 0.3s,
    width 0.3s;
}

.dots__dot.is-active::before {
  width: 1.25rem;
  border-radius: 1rem;
  background: var(--accent);
}

@media (min-width: 60rem) {
  .dots {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .projects__card {
    transform: none !important;
  }
}
</style>
