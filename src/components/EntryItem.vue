<script setup lang="ts">
import type { Entry } from '../data'
import LogoEmblem from './LogoEmblem.vue'

defineProps<{ entry: Entry }>()
</script>

<template>
  <article
    class="entry"
    :class="{ 'entry--emblem': entry.logo?.emblem, 'entry--minor': entry.minor }"
    :style="entry.logo?.emblem ? { '--emblem-height': entry.logo.height } : undefined"
  >
    <header class="entry__head">
      <div class="entry__main">
        <LogoEmblem v-if="entry.logo?.emblem" :logo="entry.logo" />
        <div>
          <h3 class="entry__title">{{ entry.title }}</h3>
          <p v-if="entry.logo && !entry.logo.emblem" class="entry__org">
            <span class="entry__logo" :style="{ height: entry.logo.height, color: entry.logo.color }" aria-hidden="true" v-html="entry.logo.svg" />
            <span class="visually-hidden">{{ entry.org }}</span>
          </p>
          <p v-else class="entry__org">
            {{ entry.org }}<template v-if="entry.location"> · {{ entry.location }}</template>
          </p>
        </div>
      </div>
      <span class="entry__period">{{ entry.period }}</span>
    </header>
    <ul v-if="entry.points?.length" class="entry__points">
      <li v-for="point in entry.points" :key="point">{{ point }}</li>
    </ul>
  </article>
</template>

<style scoped>
.entry {
  position: relative;
  padding-left: 1.5rem;
}

.entry:not(:last-child) {
  padding-bottom: 3.5rem;
}

.entry::before {
  content: '';
  position: absolute;
  z-index: 1;
  left: -6px;
  top: var(--dot-top);
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--line);
  transition:
    background-color 0.3s,
    border-color 0.3s;
}

.entry.is-lit::before {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 45%, transparent);
  animation: dot-pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.entry::after {
  content: '';
  position: absolute;
  left: -6px;
  top: var(--dot-top);
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  opacity: 0;
  pointer-events: none;
}

.entry.is-lit::after {
  animation: dot-ripple 0.9s ease-out;
}

@keyframes dot-pop {
  0% {
    scale: 1;
  }
  40% {
    scale: 1.6;
  }
  100% {
    scale: 1;
  }
}

@keyframes dot-ripple {
  from {
    opacity: 0.8;
    scale: 1;
  }
  to {
    opacity: 0;
    scale: 3.2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry.is-lit::before,
  .entry.is-lit::after {
    animation: none;
  }
}

.entry__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}

.entry__title {
  font-size: 1.05rem;
  font-weight: 600;
}

.entry__org {
  color: var(--muted);
}

.entry--minor .entry__title {
  font-size: 0.95rem;
}

.entry--minor .entry__org {
  font-size: 0.88rem;
}

.entry__logo {
  display: block;
  margin-top: 0.35rem;
}

.entry__logo :deep(svg) {
  display: block;
  width: auto;
  height: 100%;
}

.entry__main {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.entry__period {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--text);
  white-space: nowrap;
}

@media (max-width: 59.99rem) {
  .entry__head {
    row-gap: 0.6rem;
  }

  .entry__period {
    order: -1;
    width: 100%;
  }

}

@media (min-width: 60rem) {
  .entry__period {
    position: absolute;
    right: calc(100% + 1.25rem);
    top: 0.2rem;
    text-align: right;
  }

  .entry--emblem {
    --dot-top: calc(var(--emblem-height) / 2 - 6.5px);
  }

  .entry--emblem .entry__period {
    top: calc(var(--emblem-height) / 2);
    translate: 0 -50%;
  }
}

.entry__points {
  margin-top: 0.75rem;
  padding-left: 1.1rem;
  font-size: 0.9rem;
}

.entry__points li + li {
  margin-top: 0.35rem;
}

.entry__points li::marker {
  color: var(--accent);
}
</style>
