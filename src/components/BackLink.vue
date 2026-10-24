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
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid var(--line);
  border-radius: 50%;
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
  width: 1.35rem;
  height: 1.35rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
