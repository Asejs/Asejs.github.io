<script setup lang="ts">
import type { Logo } from '../data'

defineProps<{ logo: Logo; size?: string }>()
</script>

<template>
  <span
    class="emblem"
    :class="{ 'emblem--badge': logo.badge }"
    :style="{
      height: size ?? logo.height,
      color: logo.badge?.color ?? logo.color,
      background: logo.badge?.background,
    }"
    aria-hidden="true"
    v-html="logo.svg"
  />
</template>

<style scoped>
.emblem {
  flex: none;
  align-self: center;
  color: var(--muted);
}

.emblem :deep(svg) {
  display: block;
  width: auto;
  height: 100%;
}

.emblem--badge {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 10px;
}

.emblem--badge :deep(svg) {
  width: 78%;
  height: auto;
}
</style>
