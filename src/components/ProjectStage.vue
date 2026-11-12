<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { Project } from '../data'
import ProjectCard from './ProjectCard.vue'
import { setModalOrigin } from '../composables/modalOrigin'

defineProps<{ projects: Project[] }>()
const row = useTemplateRef<HTMLElement>('row')

// Which card is in front (0 = first). It glides there smoothly.
const active = ref(0)
let target = 0
let current = 0
let frame = 0

function render() {
  current += (target - current) * 0.1
  if (Math.abs(target - current) < 0.002) current = target
  active.value = Math.round(current)
  row.value?.querySelectorAll<HTMLElement>('.projects__card').forEach((card, i) => {
    card.style.setProperty('--d', String(i - current))
    card.style.zIndex = String(10 - Math.round(Math.abs(i - current) * 2))
  })
  frame = current === target ? 0 : requestAnimationFrame(render)
}

function goTo(i: number) {
  target = i
  frame ||= requestAnimationFrame(render)
}

// Mouse: the card under the pointer comes forward, and the first one when it leaves
function onCardEnter(i: number, event: PointerEvent) {
  if (event.pointerType === 'mouse') goTo(i)
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') goTo(0)
}

// Tapping a card behind brings it forward instead of opening it (touch has no hover).
// Opening the front card remembers where it is, so the modal can be flung out of it.
function onCardClick(i: number, event: MouseEvent) {
  const card = event.currentTarget as HTMLElement
  if (i === active.value) return setModalOrigin(card.getBoundingClientRect())
  event.preventDefault()
  goTo(i)
}

// Shading fades in as the window narrows and the cards start to overlap (around 1340px),
// reaching full strength 240px narrower
function updateShade() {
  const shade = Math.min(Math.max((1344 - innerWidth) / 240, 0), 1)
  row.value?.style.setProperty('--shade', String(shade))
}

onMounted(() => {
  updateShade()
  addEventListener('resize', updateShade)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  removeEventListener('resize', updateShade)
})
</script>

<template>
  <div>
    <div ref="row" class="projects" @pointerleave="onPointerLeave">
      <ProjectCard
        v-for="(project, i) in projects"
        :key="project.slug"
        :project="project"
        class="projects__card"
        :style="{ '--d': i, zIndex: 10 - i * 2 }"
        @pointerenter="onCardEnter(i, $event)"
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
/*
 * All three cards side by side. The card in front is full size; the others sit
 * further back, turned toward it and in shadow. The narrower the screen, the more
 * they overlap, like a hand of cards.
 * --d is the card's distance from the front card (negative = to the left).
 */
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
  --a: max(var(--d), -1 * var(--d));
  position: relative;
  /* Readable width: never narrower than 26rem, unless the screen itself is */
  width: max(100%, min(26rem, 100vw - 8rem));
  justify-self: center;
  background: color-mix(in srgb, var(--text) 4%, var(--bg));
  border-radius: 10px;
  overflow: hidden;
  transform: translateZ(calc(var(--a) * -110px)) rotateY(calc(var(--d) * -9deg));
  filter: brightness(calc(1 - var(--a) * 0.28 * var(--shade, 1)));
}

.projects__card :deep(.card__body) {
  padding: 0 1.25rem 1.25rem;
}

.projects__card:first-child {
  justify-self: start;
}

.projects__card:last-child {
  justify-self: end;
}

/* Dots to switch cards where the cards overlap most (and there is no hover on touch) */
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
    transform: none;
  }
}
</style>
