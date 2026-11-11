<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { Project } from '../data'
import ProjectCard from './ProjectCard.vue'

defineProps<{ projects: Project[] }>()
const row = useTemplateRef<HTMLElement>('row')

// Below 60rem the cards are a swipeable row; above, all three sit side by side
const narrow = matchMedia('(max-width: 59.99rem)')
const active = ref(0)

const cards = () => [...(row.value?.querySelectorAll<HTMLElement>('.projects__card') ?? [])]

// --- Wide: the card under the pointer glides to the front (0 = first) ---
let target = 0
let current = 0
let frame = 0

function render() {
  current += (target - current) * 0.1
  if (Math.abs(target - current) < 0.002) current = target
  cards().forEach((card, i) => {
    card.style.setProperty('--d', String(i - current))
    card.style.zIndex = String(10 - Math.round(Math.abs(i - current) * 2))
  })
  frame = current === target ? 0 : requestAnimationFrame(render)
}

function onCardEnter(i: number, event: PointerEvent) {
  if (event.pointerType !== 'mouse' || narrow.matches) return
  target = i
  frame ||= requestAnimationFrame(render)
}

// Back to the first card when the pointer leaves
function onPointerLeave() {
  if (narrow.matches) return
  target = 0
  frame ||= requestAnimationFrame(render)
}

// Shading fades in as the window narrows and the cards start to overlap (around 1340px),
// reaching full strength 240px narrower
function updateShade() {
  const shade = Math.min(Math.max((1344 - innerWidth) / 240, 0), 1)
  row.value?.style.setProperty('--shade', String(shade))
}

// --- Narrow: each card's distance from the centre of the row, in card widths ---
function onScroll() {
  if (!narrow.matches || !row.value) return
  const r = row.value.getBoundingClientRect()
  const centre = r.left + r.width / 2
  cards().forEach((card, i) => {
    const c = card.getBoundingClientRect()
    const d = (c.left + c.width / 2 - centre) / c.width
    card.style.setProperty('--d', String(d))
    if (Math.abs(d) < 0.5) active.value = i
  })
}

function scrollToCard(i: number) {
  cards()[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

function onLayoutChange() {
  updateShade()
  if (narrow.matches) onScroll()
  else render()
}

onMounted(() => {
  onLayoutChange()
  addEventListener('resize', onLayoutChange)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  removeEventListener('resize', onLayoutChange)
})
</script>

<template>
  <div>
    <div
      ref="row"
      class="projects"
      @pointerleave="onPointerLeave"
      @scroll.passive="onScroll"
    >
      <ProjectCard
        v-for="(project, i) in projects"
        :key="project.slug"
        :project="project"
        class="projects__card"
        :style="{ '--d': i, zIndex: 10 - i * 2 }"
        @pointerenter="onCardEnter(i, $event)"
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
        @click="scrollToCard(i)"
      />
    </div>
  </div>
</template>

<style scoped>
.projects__card {
  --a: max(var(--d), -1 * var(--d));
}

/*
 * Narrow screens: a swipeable row that snaps one card at a time, with the next
 * card peeking in. Cards away from the centre shrink and darken as you swipe.
 */
@media (max-width: 59.99rem) {
  .projects {
    --w: min(78vw, 32rem);
    display: flex;
    gap: 0.75rem;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    padding: 0.5rem calc((100vw - var(--w)) / 2) 1rem; /* lets the first and last card snap to the centre */
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
    transform: scale(calc(1 - min(var(--a), 1) * 0.08));
    filter: brightness(calc(1 - min(var(--a), 1) * 0.35));
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
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
}

/*
 * Wide screens: all cards side by side. The card in front is full size;
 * the others sit further back, turned toward it and in shadow.
 * --d is the card's distance from the front card (negative = to the left).
 */
@media (min-width: 60rem) {
  .projects {
    display: grid;
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
