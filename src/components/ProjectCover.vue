<script setup lang="ts">
import type { Project } from '../data'

defineProps<{ project: Project }>()

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
</script>

<template>
  <div class="cover" :style="{ '--hue': project.hue }">
    <video
      v-if="project.video"
      :src="project.video"
      :autoplay="!reduceMotion"
      muted
      loop
      playsinline
      preload="metadata"
      aria-hidden="true"
    />
    <img v-else-if="project.cover" :src="project.cover" :alt="project.title" loading="lazy" />
    <div v-else class="cover__placeholder" aria-hidden="true">
      <span>{{ project.title }}</span>
    </div>
  </div>
</template>

<style scoped>
.cover {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 12px;
  background: var(--tag-bg);
}

.cover img,
.cover video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover__placeholder {
  display: grid;
  place-items: center;
  height: 100%;
  padding: 1.5rem;
  background:
    linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / 24px 24px,
    radial-gradient(
      circle at 30% 20%,
      hsl(var(--hue) 70% 45%),
      hsl(calc(var(--hue) + 30) 60% 18%)
    );
  --grid: rgb(255 255 255 / 0.06);
}

.cover__placeholder span {
  font-size: clamp(1.25rem, 4vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgb(255 255 255 / 0.9);
  text-align: center;
}
</style>
