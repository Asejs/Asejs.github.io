<script setup lang="ts">
import type { Project } from '../data'
import { projectHref } from '../composables/useHashRoute'
import LogoEmblem from './LogoEmblem.vue'
import ProjectCover from './ProjectCover.vue'

defineProps<{ project: Project }>()
</script>

<template>
  <a :href="projectHref(project.slug)" class="card">
    <ProjectCover :project="project" class="card__cover" />
    <div class="card__body">
      <div class="card__head">
        <span v-if="project.logos?.length" class="card__logos">
          <LogoEmblem v-for="(logo, index) in project.logos" :key="index" :logo="logo" size="2.75rem" />
        </span>
        <div>
          <h3 class="card__title">{{ project.title }}</h3>
          <p class="card__subtitle">{{ project.subtitle }}</p>
        </div>
      </div>
      <p class="card__summary">{{ project.summary }}</p>
    </div>
  </a>
</template>

<style scoped>
.card {
  display: block;
}

.card .card__cover {
  aspect-ratio: 16 / 9;
}

.card__cover {
  position: relative;
  transition:
    transform 0.4s ease,
    box-shadow 0.4s ease;
}

.card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgb(6 12 14 / 0.4);
  transition: background-color 0.4s ease;
  pointer-events: none;
}

.card:hover .card__cover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px -12px rgb(0 0 0 / 0.35);
}

.card:hover .card__cover::after {
  background: rgb(6 12 14 / 0.2);
}

.card__body {
  margin-top: 0.9rem;
}

.card__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card__logos {
  display: flex;
  flex: none;
}

.card__logos > * + * {
  margin-left: -0.6rem;
  box-shadow: 0 0 0 2px var(--bg);
}

.card__title {
  font-size: 1.05rem;
  font-weight: 600;
  transition: color 0.2s;
}

.card:hover .card__title {
  color: var(--accent);
}

.card__subtitle {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--muted);
}

.card__summary {
  margin-top: 0.6rem;
  font-size: 0.95rem;
  color: var(--muted);
}
</style>
