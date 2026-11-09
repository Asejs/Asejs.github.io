<script setup lang="ts">
import type { InterestIcon } from '../data'

defineProps<{ icon: InterestIcon }>()
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
    <template v-if="icon === 'camera'">
      <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </template>
    <template v-else-if="icon === 'brush'">
      <path d="M14.5 4.5 19.5 9.5 11 18l-5-5 8.5-8.5Z" />
      <path d="M6 13c-2 0-3 1.5-3 3.5S2 20 2 20s3.5.5 5-1 1.5-3 1-4" />
    </template>
    <template v-else-if="icon === 'plane'">
      <path
        d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z"
      />
    </template>
    <template v-else-if="icon === 'mountain'">
      <path d="m8 3 4 8 5-5 5 15H2L8 3Z" />
    </template>
    <template v-else-if="icon === 'footprints'">
      <path
        d="M4 16v-2.38C4 11.5 3 10.5 3 8c0-2.72 1.5-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"
      />
      <path
        d="M20 20v-2.38c0-2.12 1-3.12 1-5.62 0-2.72-1.5-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"
      />
      <path d="M16 17h4M4 13h4" />
    </template>
    <template v-else-if="icon === 'yoga'">
      <circle cx="12" cy="4.5" r="2" />
      <path d="M4 10c3 1 5.5 1 8 1s5-0 8-1M12 11v4" />
      <path d="M5 19.5c2.5-2.5 4.5-4 7-4.5 2.5.5 4.5 2 7 4.5M5 19.5h14" />
    </template>
    <template v-else-if="icon === 'dumbbell'">
      <path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7" />
    </template>
  </svg>
</template>

<style scoped>
.icon {
  width: 1.4rem;
  height: 1.4rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
