<script setup lang="ts">
import type { Entry } from '../data'
import LogoEmblem from './LogoEmblem.vue'

defineProps<{ entry: Entry }>()
</script>

<template>
  <article class="entry">
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
  border-left: 1px solid var(--line);
}

.entry:not(:last-child) {
  padding-bottom: 2.25rem;
}

.entry::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 0.45rem;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--accent);
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
  align-items: baseline;
  gap: 0.85rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.entry__period {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--muted);
  white-space: nowrap;
}

@media (max-width: 59.99rem) {
  .entry__period {
    order: -1;
    width: 100%;
    margin-bottom: 0.4rem;
  }

  .entry::before {
    top: 0.3rem;
  }
}

@media (min-width: 60rem) {
  .entry__period {
    position: absolute;
    right: calc(100% + 1.25rem);
    top: 0.2rem;
    text-align: right;
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
