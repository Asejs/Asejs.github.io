<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ paragraphs: string[] }>()

// The story is about pressing "View source", so the section can show its own source
const showSource = ref(false)
</script>

<template>
  <div class="about">
    <button type="button" class="about__toggle" :aria-pressed="showSource" @click="showSource = !showSource">
      <span aria-hidden="true">&lt;/&gt;</span> {{ showSource ? 'Skjul kilde' : 'Vis kilde' }}
    </button>

    <Transition name="flip" mode="out-in">
      <div v-if="!showSource" key="text" class="about__text">
        <p v-for="paragraph in paragraphs" :key="paragraph">{{ paragraph }}</p>
      </div>

      <pre v-else key="source" class="about__source" aria-label="Kildekoden til Om meg"><code><span class="tok-tag">&lt;section</span> <span class="tok-attr">id</span>=<span class="tok-str">"om-meg"</span><span class="tok-tag">&gt;</span>
  <span class="tok-tag">&lt;h2&gt;</span>Om meg<span class="tok-tag">&lt;/h2&gt;</span>
<template v-for="paragraph in paragraphs" :key="paragraph">  <span class="tok-tag">&lt;p&gt;</span>{{ paragraph }}<span class="tok-tag">&lt;/p&gt;</span>
</template><span class="tok-tag">&lt;/section&gt;</span></code></pre>
    </Transition>
  </div>
</template>

<style scoped>
.about {
  position: relative;
  perspective: 1200px;
}

.about__toggle {
  position: absolute;
  top: -3.35rem;
  right: 0;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  font: 500 0.75rem var(--mono);
  color: var(--muted);
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.about__toggle:hover,
.about__toggle[aria-pressed='true'] {
  border-color: var(--accent);
  color: var(--accent-text);
}

.about__text {
  display: grid;
  gap: 1rem;
  color: var(--muted);
  line-height: 1.7;
}

.about__text p:last-child {
  color: var(--text);
}

.about__source {
  margin: 0;
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: color-mix(in srgb, var(--text) 4%, var(--bg));
  font: 0.8rem/1.7 var(--mono);
  color: var(--text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.tok-tag {
  color: var(--accent-text);
}

.tok-attr {
  color: var(--muted);
}

.tok-str {
  color: #c98a5a;
}

/* The text turns over to reveal its source, like flipping a card */
.flip-enter-active,
.flip-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.flip-leave-to {
  transform: rotateY(90deg);
  opacity: 0;
}

.flip-enter-from {
  transform: rotateY(-90deg);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .flip-leave-to,
  .flip-enter-from {
    transform: none;
  }
}
</style>
