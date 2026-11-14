<script setup lang="ts">
import { useTheme } from '../composables/useTheme'
import { profile } from '../data'
import LinkIcon from './LinkIcon.vue'

const { theme, toggle } = useTheme()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer__band" aria-hidden="true" />
    <span class="footer__meta">
      <span>© {{ year }} {{ profile.name }}</span>
      <a class="footer__social" :href="profile.instagram.href" target="_blank" rel="noopener">
        <LinkIcon icon="instagram" />
        <span>@{{ profile.instagram.handle }}</span>
      </a>
    </span>
    <button
      class="theme-toggle"
      type="button"
      :aria-label="theme === 'dark' ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'"
      @click="toggle"
    >
      <svg v-if="theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
    </button>
  </footer>
</template>

<style scoped>
.footer__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}

.footer__social {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer__social:hover {
  color: var(--accent);
}

.footer__social:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: var(--radius);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  position: relative;
  isolation: isolate;
  margin: calc(6rem + min(6vw, 5rem)) 0 -3rem;
  /* As wide as the project row, so the footer spans the page on big screens too */
  margin-inline: calc((100% - min(100vw - 2 * max(1.25rem, 4vw), 88rem)) / 2);
  padding: 1.75rem 0 2.25rem;
  font-size: 0.85rem;
  color: var(--muted);
}

/* A full-width band across the bottom of the page, with a slanted, shadowed top edge
   parallel to the hero's; the content stays in the column. The shadow sits on the
   wrapper because clip-path would cut off a shadow on the shape itself. */
.footer__band {
  position: absolute;
  z-index: -1;
  inset: calc(-1 * min(6vw, 5rem)) calc(50% - 50vw) 0;
  filter: drop-shadow(var(--hero-shadow));
  pointer-events: none;
}

.footer__band::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--hero-bg);
  clip-path: polygon(0 min(6vw, 5rem), 100% 0, 100% 100%, 0 100%);
}

.theme-toggle {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.2s;
}

.theme-toggle:hover {
  border-color: var(--accent);
}

.theme-toggle svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}
</style>
