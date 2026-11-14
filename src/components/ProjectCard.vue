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
        <div class="card__heading">
          <p class="card__eyebrow">{{ project.subtitle.split(' · ')[0] }} · {{ project.period }}</p>
          <h3 class="card__title">{{ project.title }}</h3>
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
  background: var(--card-veil);
  transition: background-color 0.4s ease;
  pointer-events: none;
}

.card:hover .card__cover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px -12px rgb(0 0 0 / 0.35);
}

.card:hover .card__cover::after {
  background: var(--card-veil-hover);
}

.card__body {
  margin-top: 1.25rem;
}

.card__head {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.card__heading {
  flex: 1;
  min-width: 0;
}

.card__eyebrow {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-text);
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
  margin-top: 0.15rem;
  font-size: 1.3rem;
  line-height: 1.2;
  font-weight: 600;
  transition: color 0.2s;
}

.card:hover .card__title {
  color: var(--accent);
}

.card__summary {
  margin-top: 0.9rem;
  font-size: 0.95rem;
  color: var(--muted);
}
</style>
