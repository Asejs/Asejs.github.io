<script setup lang="ts">
import { computed } from 'vue'
import type { Interest } from '../data'
import { interestHref } from '../composables/useHashRoute'
import InterestIcon from './InterestIcon.vue'

const props = defineProps<{ interest: Interest }>()

const hasGallery = computed(() => !!props.interest.images?.length)
</script>

<template>
  <component
    :is="hasGallery ? 'a' : 'div'"
    :href="hasGallery ? interestHref(interest.slug) : undefined"
    class="tile"
    :class="{ 'tile--link': hasGallery }"
  >
    <span class="tile__icon">
      <InterestIcon :icon="interest.icon" />
    </span>
    <span class="tile__text">
      <span class="tile__title">{{ interest.title }}</span>
      <span v-if="interest.description" class="tile__desc">{{ interest.description }}</span>
    </span>
    <span v-if="hasGallery" class="tile__arrow" aria-hidden="true">→</span>
  </component>
</template>

<style scoped>
.tile {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.tile--link {
  transition:
    border-color 0.2s,
    background-color 0.2s,
    transform 0.2s;
}

.tile--link:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
  transform: translateY(-2px);
}

.tile__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
}

.tile__text {
  display: grid;
  flex: 1;
  min-width: 0;
}

.tile__title {
  font-weight: 600;
}

.tile__desc {
  font-size: 0.9rem;
  color: var(--muted);
}

.tile__arrow {
  flex: none;
  color: var(--accent);
  transition: transform 0.2s;
}

.tile--link:hover .tile__arrow {
  transform: translateX(3px);
}
</style>
