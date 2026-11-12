<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Types `text` out one character at a time with a blinking caret, like someone
// writing it. Screen readers get the whole text at once.
const props = withDefaults(defineProps<{ text: string; delay?: number; speed?: number; keepCaret?: boolean }>(), {
  delay: 0,
  speed: 70,
  keepCaret: false,
})

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const shown = ref(reduceMotion ? props.text.length : 0)
// The caret appears when typing starts, so a delayed line isn't blinking while it waits
const caret = ref(false)
const typing = ref(!reduceMotion)
let timer = 0

onMounted(() => {
  if (reduceMotion) return
  const tick = () => {
    caret.value = true
    shown.value++
    if (shown.value < props.text.length) timer = window.setTimeout(tick, props.speed)
    else {
      typing.value = false
      if (!props.keepCaret) timer = window.setTimeout(() => (caret.value = false), 1600)
    }
  }
  timer = window.setTimeout(tick, props.delay)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span class="typed" :aria-label="text">
    <span aria-hidden="true">{{ text.slice(0, shown) }}</span>
    <span v-if="caret" class="typed__caret" :class="{ 'is-idle': !typing }" aria-hidden="true" />
    <!-- Invisible remainder keeps the line at its final width, so nothing shifts while typing -->
    <span class="typed__rest" aria-hidden="true">{{ text.slice(shown) }}</span>
  </span>
</template>

<style scoped>
.typed__caret {
  display: inline-block;
  width: 0.08em;
  height: 0.9em;
  margin: 0 -0.04em;
  vertical-align: -0.05em;
  background: var(--accent);
}

/* Solid while typing, blinking once it stops, like a real text cursor */
.typed__caret.is-idle {
  animation: blink 0.8s infinite;
}

.typed__rest {
  visibility: hidden;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }

  50%,
  100% {
    opacity: 0;
  }
}
</style>
