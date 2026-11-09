<script setup lang="ts">
import BackLink from './BackLink.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Interest } from '../data'

const props = defineProps<{ interest: Interest }>()

const images = computed(() => props.interest.images ?? [])
const openIndex = ref<number>()
const openImage = computed(() =>
  openIndex.value === undefined ? undefined : images.value[openIndex.value],
)

function step(delta: number) {
  if (openIndex.value === undefined) return
  const count = images.value.length
  openIndex.value = (openIndex.value + delta + count) % count
}

const BREAKPOINTS = [
  { maxWidth: 600, columns: 1 },
  { maxWidth: 1100, columns: 2 },
  { maxWidth: 1800, columns: 3 },
  { maxWidth: 2600, columns: 4 },
]
const WIDEST_COLUMNS = 5
const queries = BREAKPOINTS.map(({ maxWidth }) => window.matchMedia(`(max-width: ${maxWidth}px)`))
const currentColumnCount = () =>
  BREAKPOINTS.find((_, i) => queries[i].matches)?.columns ?? WIDEST_COLUMNS
const columnCount = ref(currentColumnCount())
function onWidthChange() {
  columnCount.value = currentColumnCount()
}

const SIZES = [
  ...BREAKPOINTS.map(({ maxWidth, columns }) => `(max-width: ${maxWidth}px) ${Math.round(100 / columns)}vw`),
  `${Math.round(100 / WIDEST_COLUMNS)}vw`,
].join(', ')
const srcset = (image: { src: string; thumb?: string }) =>
  image.thumb ? `${image.thumb} 460w, ${image.src} 1200w` : undefined

const columns = computed(() =>
  Array.from({ length: columnCount.value }, (_, column) =>
    images.value
      .map((image, index) => ({ image, index }))
      .filter(({ index }) => index % columnCount.value === column),
  ),
)

function onKeydown(event: KeyboardEvent) {
  if (openIndex.value === undefined) return
  if (event.key === 'Escape') openIndex.value = undefined
  else if (event.key === 'ArrowRight') step(1)
  else if (event.key === 'ArrowLeft') step(-1)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  queries.forEach((query) => query.addEventListener('change', onWidthChange))
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  queries.forEach((query) => query.removeEventListener('change', onWidthChange))
})
</script>

<template>
  <article>
    <BackLink href="#interesser" />

    <h1 class="visually-hidden">{{ interest.galleryTitle ?? interest.title }}</h1>
    <p v-if="interest.galleryDescription" class="head__desc">{{ interest.galleryDescription }}</p>

    <div class="grid">
      <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="grid__column">
        <button
          v-for="{ image, index } in column"
          :key="image.src"
          type="button"
          class="grid__item"
          :aria-label="`Vis ${image.alt} i stort format`"
          @click="openIndex = index"
        >
          <img
            :src="image.thumb ?? image.src"
            :srcset="srcset(image)"
            :sizes="SIZES"
            :alt="image.alt"
            loading="lazy"
            decoding="async"
          />
        </button>
      </div>
    </div>

    <div
      v-if="openImage"
      class="lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="openImage.alt"
      @click.self="openIndex = undefined"
    >
      <figure class="lightbox__figure">
        <img :src="openImage.src" :alt="openImage.alt" />
        <figcaption v-if="openImage.caption">{{ openImage.caption }}</figcaption>
      </figure>
      <button type="button" class="lightbox__close" aria-label="Lukk" @click="openIndex = undefined">
        ✕
      </button>
      <template v-if="images.length > 1">
        <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Forrige" @click="step(-1)">
          ←
        </button>
        <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Neste" @click="step(1)">
          →
        </button>
      </template>
    </div>
  </article>
</template>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.head__desc {
  margin-top: 2rem;
  color: var(--muted);
}

.grid {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 2rem;
}

.grid__column {
  flex: 1;
  min-width: 0;
}

.grid__item {
  display: block;
  width: 100%;
  margin-bottom: 0.75rem;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: var(--tag-bg);
  cursor: zoom-in;
  break-inside: avoid;
}

.grid__item img {
  display: block;
  width: 100%;
  transition: transform 0.4s ease;
}

.grid__item:hover img {
  transform: scale(1.03);
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 3.5rem 1rem;
  background: rgb(0 0 0 / 0.9);
}

.lightbox__figure img {
  display: block;
  max-width: min(100%, 72rem);
  max-height: calc(100vh - 8rem);
  margin: 0 auto;
}

.lightbox__figure figcaption {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.9rem;
  color: #c8d0d4;
}

.lightbox__close,
.lightbox__nav {
  position: absolute;
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid rgb(255 255 255 / 0.25);
  border-radius: 50%;
  background: rgb(0 0 0 / 0.4);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}

.lightbox__close {
  top: 1rem;
  right: 1rem;
}

.lightbox__nav {
  top: 50%;
  transform: translateY(-50%);
}

.lightbox__nav--prev {
  left: 1rem;
}

.lightbox__nav--next {
  right: 1rem;
}
</style>
