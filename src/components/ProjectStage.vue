<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import type { Project } from '../data'
import ProjectCard from './ProjectCard.vue'

const props = defineProps<{ projects: Project[] }>()
const row = useTemplateRef<HTMLElement>('row')

// Which card is "in front": 0 = first. Follows the pointer smoothly.
let target = 0
let current = 0
let frame = 0

function render() {
  current += (target - current) * 0.1
  if (Math.abs(target - current) < 0.002) current = target
  row.value?.querySelectorAll<HTMLElement>('.projects__card').forEach((card, i) => {
    card.style.setProperty('--d', String(i - current))
    card.style.zIndex = String(10 - Math.round(Math.abs(i - current) * 2))
  })
  frame = current === target ? 0 : requestAnimationFrame(render)
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  const r = row.value!.getBoundingClientRect()
  const x = Math.min(Math.max((event.clientX - r.left) / r.width, 0), 1)
  target = x * (props.projects.length - 1)
  frame ||= requestAnimationFrame(render)
}

// Back to the first card when the pointer leaves
function onPointerLeave() {
  target = 0
  frame ||= requestAnimationFrame(render)
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
  <div ref="row" class="projects" @pointermove="onPointerMove" @pointerleave="onPointerLeave">
    <ProjectCard
      v-for="(project, i) in projects"
      :key="project.slug"
      :project="project"
      class="projects__card"
      :style="{ '--d': i, zIndex: 10 - i * 2 }"
    />
  </div>
</template>

<style scoped>
.projects {
  display: grid;
  gap: 3rem;
}

/*
 * Wide screens: all cards side by side. The card in front is full size;
 * the others sit further back, turned toward it and in shadow.
 * --d is the card's distance from the front card (negative = to the left).
 */
@media (min-width: 60rem) {
  .projects {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem;
    width: calc(100vw - 3rem);
    margin-left: 50%;
    translate: -50% 0;
    perspective: 1400px;
  }

  /* Cards keep a readable width; on narrower screens they overlap like a hand of cards, the one in focus on top */
  .projects__card {
    position: relative;
    width: max(100%, 26rem);
    background: color-mix(in srgb, var(--text) 4%, var(--bg));
    border-radius: 10px;
    overflow: hidden;
    justify-self: center;
    --a: max(var(--d), -1 * var(--d));
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
}

@media (min-width: 60rem) and (prefers-reduced-motion: reduce) {
  .projects__card {
    transform: none;
  }
}
</style>
