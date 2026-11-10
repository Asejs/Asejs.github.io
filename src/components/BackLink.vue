<script setup lang="ts">
defineProps<{ href: string }>()
</script>

<template>
  <a :href="href" class="back" aria-label="Tilbake">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  </a>
</template>

<style scoped>
.back {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 10;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter: blur(6px);
  color: var(--muted);
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s;
}

.back:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.back svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
