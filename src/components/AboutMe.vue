<script setup lang="ts">
import signatureSvg from '../assets/signature.svg?raw'
import { about, aboutGreeting } from '../data'
import FavoriteThings from './FavoriteThings.vue'
import TypedText from './TypedText.vue'
</script>

<template>
  <FavoriteThings>
    <div class="about">
      <p class="about__greeting">
        <span class="about__prompt" aria-hidden="true">&gt;</span>
        <TypedText :text="aboutGreeting" keep-caret />
      </p>
      <p class="about__tagline">Dataingeniør · Frontend-utvikler</p>
      <p v-for="paragraph in about" :key="paragraph">
        <template v-for="(part, i) in paragraph.split('**')" :key="i">
          <strong v-if="i % 2">{{ part }}</strong>
          <template v-else>{{ part }}</template>
        </template>
      </p>
      <span class="about__signature" role="img" aria-label="Åse" v-html="signatureSvg" />
    </div>
  </FavoriteThings>
</template>

<style scoped>
.about__greeting {
  margin-bottom: 0.25rem;
  font-family: var(--mono);
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  font-weight: 600;
  line-height: 1.2;
  color: var(--text);
}

.about__prompt {
  margin-right: 0.6em;
  color: var(--accent-text);
}

.about__tagline {
  margin: -0.5rem 0 0.5rem;
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

.about__signature {
  justify-self: end;
  margin-top: -2.25rem;
  color: var(--text);
}

.about__signature :deep(svg) {
  display: block;
  width: auto;
  height: 4.5rem;
}

.about strong {
  font-weight: 600;
  color: var(--text);
}

.about {
  display: grid;
  gap: 1rem;
  color: var(--muted);
  line-height: 1.7;
}
</style>
