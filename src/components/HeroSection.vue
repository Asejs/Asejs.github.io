<script setup lang="ts">
import { useTemplateRef } from 'vue'
import horizon56Wordmark from '../assets/logos/horizon56.svg?raw'
import { useLayoutGlide } from '../composables/useLayoutGlide'
import { usePointerGlow } from '../composables/usePointerGlow'
import { experience, profile } from '../data'
import ContactLinks from './ContactLinks.vue'
import TypedText from './TypedText.vue'
import WaveLines from './WaveLines.vue'

const hero = useTemplateRef<HTMLElement>('hero')
usePointerGlow(hero)

const heroText = useTemplateRef<HTMLElement>('heroText')
const heroPhoto = useTemplateRef<HTMLElement>('heroPhoto')
useLayoutGlide(matchMedia('(max-width: 39.99rem)'), () => [heroText.value, heroPhoto.value])

const current = experience.find((entry) => entry.period.endsWith('nå'))

defineExpose({ hero })
</script>

<template>
  <div class="hero-shadow">
    <header ref="hero" class="hero">
      <WaveLines />
      <div ref="heroText" class="hero__text">
        <div class="hero__title">
          <h1 class="hero__name"><TypedText :text="profile.name" :delay="300" /></h1>
          <p class="eyebrow">
            <TypedText :text="`// ${profile.role.toUpperCase()}`" :delay="300 + profile.name.length * 70 + 250" :speed="45" />
          </p>
        </div>
        <p class="hero__summary">{{ profile.summary }}</p>
        <p class="hero__motivation">{{ profile.motivation }}</p>
        <div v-if="current" class="now">
          <p class="now__label"><span class="now__dot" aria-hidden="true" />{{ current.title }} hos</p>
          <span class="now__wordmark" role="img" :aria-label="current.org" v-html="horizon56Wordmark" />
        </div>
        <ContactLinks label="Kontakt" class="hero__links" />
      </div>
      <picture class="hero__picture">
        <img
          ref="heroPhoto"
          class="hero__photo"
          src="/hero-portrait.webp"
          fetchpriority="high"
          :alt="profile.name"
          width="900"
          height="1698"
        />
      </picture>
    </header>
    <div class="hero__edge" aria-hidden="true" />
  </div>
</template>

<style scoped>
.hero-shadow {
  position: relative;
}

.hero__edge {
  position: absolute;
  bottom: 0;
  left: calc(50% - 50vw);
  width: 100vw;
  height: min(6vw, 5rem);
  pointer-events: none;
  filter: drop-shadow(var(--hero-shadow));
  clip-path: inset(-5rem 0 0 0);
  transition: filter 0.3s;
}

.hero__edge::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--band-bg);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  transition: background-color 0.3s;
}

.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-top: -6rem;
  padding: 5rem 1.25rem 6rem;
  background: var(--hero-bg);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - min(6vw, 5rem)), 0 100%);
  transition: background-color 0.3s;
}

.hero__picture {
  display: contents;
}

/* A faint, warm light that follows the mouse over the hero (position set by usePointerGlow) */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(1600px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgb(255 214 150 / 0.025), transparent 70%);
  opacity: 0;
  transition: opacity 0.6s;
}

.hero.has-glow::before {
  opacity: 1;
}

/* Above the wave lines and the glow */
.hero__text,
.hero__photo {
  position: relative;
  z-index: 1;
}

.hero__photo {
  order: -1;
  display: block;
  width: 66%;
  height: min(36vh, 86vw);
  margin: -5rem auto 1.5rem;
  object-fit: cover;
  object-position: center 40%;
  clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%);
  mask-image: linear-gradient(to bottom, #000 65%, transparent);
}

.hero__title {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: flex-start;
}

@media (min-width: 40rem) {
  .hero {
    display: grid;
    grid-template-columns:
      minmax(max(2rem, 4vw), 1fr)
      minmax(22rem, max-content)
      minmax(14rem, 23rem)
      minmax(0, 1fr);
    min-height: 0;
    padding: 0;
  }

  .hero__text {
    grid-area: 1 / 2;
    margin-right: clamp(2.5rem, 5vw, 5rem);
    align-self: center;
    padding-block: 4.5rem 5rem;
  }

  .hero__photo {
    order: 0;
    grid-area: 1 / 3;
    align-self: stretch;
    display: block;
    width: 100%;
    height: 0;
    min-height: 100%;
    margin: 0;
    mask-image: none;
    object-fit: cover;
    object-position: center 78%;
    clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%);
  }
}

.eyebrow {
  font-family: var(--mono);
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--accent-text);
}

.hero__name {
  font-family: var(--display);
  font-size: clamp(2rem, 8.5vw, 5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.hero__title .eyebrow {
  margin-top: 0.5rem;
}

@media (min-width: 40rem) {
  .hero__name {
    font-size: clamp(2.25rem, 5vw, 5rem);
    white-space: nowrap;
  }
}

.hero__summary {
  margin-top: 1.25rem;
  max-width: 34rem;
  font-size: clamp(1.15rem, 1.6vw, 1.35rem);
  line-height: 1.5;
  color: var(--text);
}

.hero__motivation {
  margin-top: 0.6rem;
  max-width: 34rem;
  font-size: 0.95rem;
  color: var(--muted);
  text-wrap: pretty;
}

.now {
  margin-top: 1.75rem;
}

.now__label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.now__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--live);
  box-shadow: 0 0 0 0 rgb(63 181 107 / 0.5);
  animation: now-pulse 2.4s ease-out infinite;
}

@keyframes now-pulse {
  70%,
  100% {
    box-shadow: 0 0 0 7px rgb(63 181 107 / 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .now__dot {
    animation: none;
  }
}

.now__wordmark {
  display: block;
  margin-top: 0.6rem;
  color: var(--text);
}

.now__wordmark :deep(svg) {
  display: block;
  width: auto;
  height: clamp(1.9rem, 3.2vw, 2.4rem);
}

.hero__links {
  margin-top: 1.5rem;
}

@media (max-width: 480px) {
  .hero {
    margin-top: -4.5rem;
  }
}
</style>
