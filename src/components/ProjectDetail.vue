<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import BackLink from './BackLink.vue'
import type { Project } from '../data'
import LogoEmblem from './LogoEmblem.vue'
import ProjectCover from './ProjectCover.vue'

const props = defineProps<{ project: Project }>()

const RovPlayground = defineAsyncComponent(() => import('./RovPlayground.vue'))
const bannerImage = computed(() => props.project.cover ?? props.project.images?.[0]?.src)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
</script>

<template>
  <article class="detail">
    <div v-if="project.video || bannerImage" class="detail__banner" aria-hidden="true">
      <video v-if="project.video" :src="project.video" :autoplay="!reduceMotion" muted loop playsinline />
      <img v-else :src="bannerImage" alt="" />
    </div>

    <BackLink href="#prosjekter" class="detail__back" />

    <header class="detail__head">
      <div class="detail__heading">
        <span v-if="project.logos?.length" class="detail__logos">
          <LogoEmblem v-for="(logo, index) in project.logos" :key="index" :logo="logo" size="3.5rem" />
        </span>
        <div>
          <p class="eyebrow">{{ project.subtitle }} · {{ project.period }}</p>
          <h1 class="detail__title">{{ project.title }}</h1>
        </div>
      </div>
      <p v-for="paragraph in project.description" :key="paragraph" class="detail__text">
        {{ paragraph }}
      </p>
    </header>

    <section v-if="project.role?.length" class="detail__role">
      <h2 class="detail__subhead">Min rolle</h2>
      <p v-for="paragraph in project.role" :key="paragraph" class="detail__text">
        {{ paragraph }}
      </p>
    </section>

    <ul v-if="project.highlights?.length" class="detail__list">
      <li v-for="item in project.highlights" :key="item">{{ item }}</li>
    </ul>

    <ul class="tags">
      <li v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</li>
    </ul>

    <RovPlayground v-if="project.model" :model="project.model" class="detail__rov" />

    <div v-if="project.coverOnPage !== false || project.images?.length" class="gallery">
      <ProjectCover v-if="project.coverOnPage !== false" :project="project" />
      <figure v-for="image in project.images" :key="image.src">
        <img :src="image.src" :alt="image.alt" loading="lazy" />
        <figcaption v-if="image.caption">{{ image.caption }}</figcaption>
      </figure>
    </div>

    <div v-if="project.links?.length" class="detail__links">
      <a
        v-for="link in project.links"
        :key="link.href"
        :href="link.href"
        target="_blank"
        rel="noopener"
        class="detail__link"
      >
        {{ link.label }} <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>
</template>

<style scoped>
.detail {
  position: relative;
}

.detail__banner {
  position: absolute;
  z-index: 0;
  top: -6rem;
  left: 50%;
  width: 100vw;
  height: clamp(18rem, 42vw, 30rem);
  transform: translateX(-50%);
  overflow: hidden;
  pointer-events: none;
}

.detail__banner img,
.detail__banner video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail__banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--bg) 50%, transparent) 0%,
    color-mix(in srgb, var(--bg) 70%, transparent) 45%,
    var(--bg) 100%
  );
}

.detail__back,
.detail__head,
.detail__role,
.detail__list,
.tags,
.gallery,
.detail__rov,
.detail__links {
  position: relative;
  z-index: 1;
}

.detail__back {
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter: blur(6px);
}

.detail__head {
  margin-top: clamp(6rem, 22vw, 14rem);
}

@media (max-width: 480px) {
  .detail__banner {
    top: -4.5rem;
  }
}

.eyebrow {
  font-family: var(--mono);
  font-size: 0.85rem;
  color: var(--accent);
}

.detail__heading {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.detail__logos {
  display: flex;
  flex: none;
}

.detail__logos > * + * {
  margin-left: -0.75rem;
  box-shadow: 0 0 0 2px var(--bg);
}

.detail__title {
  margin-top: 0.4rem;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.detail__text {
  max-width: 36rem;
  font-size: 1.1rem;
  color: var(--muted);
}

.detail__text + .detail__text {
  margin-top: 0.75rem;
}

.detail__role {
  margin-top: 2.25rem;
}

.detail__subhead {
  margin-bottom: 0.6rem;
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.detail__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-top: 2.5rem;
}

.detail__link {
  font-weight: 500;
  color: var(--accent);
  border-bottom: 1px solid currentColor;
}

.detail__list {
  margin-top: 2rem;
  padding-left: 1.1rem;
}

.detail__list li + li {
  margin-top: 0.35rem;
}

.detail__list li::marker {
  color: var(--accent);
}

.tags {
  margin-top: 1.5rem;
}

.gallery {
  display: grid;
  gap: 1.5rem;
  margin-top: 3rem;
}

.gallery img {
  display: block;
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--line);
}

.gallery figcaption {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
