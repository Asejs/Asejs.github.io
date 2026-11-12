<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import ContactLinks from './components/ContactLinks.vue'
import EntryItem from './components/EntryItem.vue'
import InterestGallery from './components/InterestGallery.vue'
import InterestTile from './components/InterestTile.vue'
import ProjectStage from './components/ProjectStage.vue'
import ProjectDetail from './components/ProjectDetail.vue'
import RouteModal from './components/RouteModal.vue'
import TypedText from './components/TypedText.vue'
import WaveLines from './components/WaveLines.vue'
import { useHashRoute } from './composables/useHashRoute'
import { useLayoutGlide } from './composables/useLayoutGlide'
import { usePointerGlow } from './composables/usePointerGlow'
import { useTheme } from './composables/useTheme'
import { about, education, experience, interests, profile, projects, roles, skills } from './data'
import { vReveal } from './directives/reveal'
import { vTimelineFill } from './directives/timelineFill'

const { theme, toggle } = useTheme()

// A soft light follows the mouse across the hero's background
const hero = useTemplateRef<HTMLElement>('hero')
usePointerGlow(hero)

// Crossing the phone breakpoint, the photo glides between the side and the top
const heroText = useTemplateRef<HTMLElement>('heroText')
const heroPhoto = useTemplateRef<HTMLElement>('heroPhoto')
useLayoutGlide(matchMedia('(max-width: 39.99rem)'), () => [heroText.value, heroPhoto.value])
const { activeProject, activeInterest } = useHashRoute()

// Projects and galleries open as modals over the page. Closing goes back in history
// when the modal was opened from the page, so the back button and scroll position stay intact.
const modalOpen = computed(() => Boolean(activeProject.value || activeInterest.value))
let openedFromPage = false
watch(modalOpen, (open) => {
  if (open) openedFromPage = true
})

function closeModal() {
  if (openedFromPage) history.back()
  else location.replace(activeProject.value ? '#prosjekter' : '#interesser')
  openedFromPage = false
}

const year = new Date().getFullYear()
</script>

<template>
  <RouteModal v-if="activeProject" :key="activeProject.slug" @close="closeModal">
    <ProjectDetail :project="activeProject" />
  </RouteModal>

  <RouteModal v-else-if="activeInterest" :key="activeInterest.slug" wide @close="closeModal">
    <InterestGallery :interest="activeInterest" />
  </RouteModal>

  <main class="page">
    <div class="hero-shadow">
      <header ref="hero" class="hero">
        <WaveLines />
        <div ref="heroText" class="hero__text">
          <div class="hero__title">
            <h1 class="hero__name"><TypedText :text="profile.name" :delay="300" /></h1>
            <p class="eyebrow">
              <TypedText :text="`// ${profile.role.toLowerCase()}`" :delay="300 + profile.name.length * 70 + 250" :speed="45" />
            </p>
          </div>
          <p class="hero__summary">{{ profile.summary }}</p>
          <p class="hero__motivation">{{ profile.motivation }}</p>
          <ContactLinks label="Kontakt" class="hero__links" />
        </div>
        <picture class="hero__picture">
          <img ref="heroPhoto" class="hero__photo" src="/hero-portrait.webp" fetchpriority="high" :alt="profile.name" width="900" height="1698" />
        </picture>
      </header>
      <div class="hero__edge" aria-hidden="true" />
    </div>

    <section v-reveal class="section section--band" aria-labelledby="prosjekter">
      <h2 id="prosjekter" class="section__label">Prosjekter</h2>
      <ProjectStage :projects="projects" />
    </section>

    <section v-reveal class="section" aria-labelledby="erfaring">
      <h2 id="erfaring" class="section__label">Erfaring</h2>
      <div v-timeline-fill class="stack timeline">
        <EntryItem v-for="entry in experience" :key="entry.org" :entry="entry" />
      </div>
    </section>

    <section v-reveal v-timeline-fill:gap class="section section--continued" aria-labelledby="utdanning">
      <h2 id="utdanning" class="section__label">Utdanning</h2>
      <div v-timeline-fill class="stack timeline">
        <EntryItem v-for="entry in education" :key="entry.title" :entry="entry" />
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="teknologier">
      <h2 id="teknologier" class="section__label">Teknologier</h2>
      <div class="skill-groups">
        <div>
          <h3 class="skill-groups__label">Bruker daglig</h3>
          <ul class="tags">
            <li v-for="skill in skills.daily" :key="skill" class="tag">{{ skill }}</li>
          </ul>
        </div>
        <div>
          <h3 class="skill-groups__label">Tidligere erfaring</h3>
          <ul class="tags">
            <li v-for="skill in skills.used" :key="skill" class="tag">{{ skill }}</li>
          </ul>
        </div>
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="verv">
      <h2 id="verv" class="section__label">Verv</h2>
      <div v-timeline-fill class="stack timeline">
        <EntryItem v-for="entry in roles" :key="entry.title" :entry="entry" />
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="interesser">
      <h2 id="interesser" class="section__label">Interesser</h2>
      <div class="interest-grid">
        <InterestTile v-for="interest in interests" :key="interest.slug" :interest="interest" />
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="om-meg">
      <h2 id="om-meg" class="section__label">Om meg</h2>
      <div class="about">
        <p v-for="paragraph in about" :key="paragraph">{{ paragraph }}</p>
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="kontakt">
      <h2 id="kontakt" class="section__label">Kontakt</h2>
      <ContactLinks label="Kontakt nederst" />
    </section>

    <footer class="footer">
      <div class="footer__band" aria-hidden="true" />
      <span>© {{ year }} {{ profile.name }}</span>
      <button
        class="theme-toggle"
        type="button"
        :aria-label="theme === 'dark' ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'"
        @click="toggle"
      >
        <svg v-if="theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        </svg>
      </button>
    </footer>
  </main>
</template>

<style scoped>
.page {
  max-width: 44rem;
  margin: 0 auto;
  padding: 6rem 1.25rem 3rem;
}

.page {
  --band-bg: color-mix(in srgb, var(--text) 3%, var(--bg));
}

.hero-shadow {
  position: relative;
}

.hero__edge {
  position: absolute;
  bottom: 0;
  left: calc(50% - 50vw);
  width: 100vw;
  height: min(6vw, 5rem);
  pointer-events: none;
  filter: drop-shadow(var(--hero-shadow));
  clip-path: inset(-5rem 0 0 0);
  transition: filter 0.3s;
}

.hero__edge::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--band-bg);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  transition: background-color 0.3s;
}

.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-top: -6rem;
  padding: 5rem 1.25rem 6rem;
  background: var(--hero-bg);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - min(6vw, 5rem)), 0 100%);
  transition: background-color 0.3s;
}

.hero__picture {
  display: contents;
}

/* A faint light that follows the mouse over the hero (position set by usePointerGlow) */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(
    900px circle at var(--glow-x, 50%) var(--glow-y, 50%),
    color-mix(in srgb, var(--accent) 4%, transparent),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.6s;
}

.hero.has-glow::before {
  opacity: 1;
}

/* Above the wave lines and the glow */
.hero__text,
.hero__photo {
  position: relative;
  z-index: 1;
}

.hero__photo {
  order: -1;
  display: block;
  width: 72%;
  height: min(42vh, 88vw);
  margin: -5rem auto 2rem;
  object-fit: cover;
  object-position: center 38%;
  mask-image: linear-gradient(to bottom, #000 65%, transparent);
}

.hero__title {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: flex-start;
}

@media (min-width: 40rem) {
  .hero {
    --photo-width: clamp(12rem, 22vw, 19rem);

    display: grid;
    grid-template-columns: auto var(--photo-width);
    /* Text and photo centred together as one group */
    justify-content: center;
    column-gap: clamp(1.5rem, 2.5vw, 2.5rem);
    min-height: 0;
    /* No vertical padding: the photo runs from the top edge down under the slant */
    padding: 0 max(2rem, 4vw);
  }

  .hero__text {
    grid-area: 1 / 1;
    align-self: center;
    padding-block: 4.5rem 5rem;
  }

  .hero__photo {
    order: 0;
    grid-area: 1 / 2;
    align-self: stretch;
    display: block;
    width: 100%;
    height: 0;
    min-height: 100%;
    margin: 0;
    mask-image: none;
    object-fit: cover;
    object-position: center 78%;
  }
}

.eyebrow {
  font-family: var(--mono);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--accent-text);
}

.hero__name {
  font-family: var(--display);
  font-size: clamp(2rem, 8.5vw, 5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.hero__title .eyebrow {
  margin-top: 0.5rem;
}

@media (min-width: 40rem) {
  .hero__name {
    font-size: clamp(2.25rem, 5vw, 5rem);
    white-space: nowrap;
  }
}

.hero__summary {
  margin-top: 1.25rem;
  max-width: 34rem;
  font-size: clamp(1.15rem, 1.6vw, 1.35rem);
  line-height: 1.5;
  color: var(--text);
}

.hero__motivation {
  margin-top: 0.6rem;
  max-width: 34rem;
  font-size: 0.95rem;
  color: var(--muted);
  text-wrap: pretty;
}

.hero__links {
  margin-top: 1.75rem;
}

.skill-groups {
  display: grid;
  gap: 1.5rem;
}

.skill-groups__label {
  margin-bottom: 0.75rem;
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  opacity: 0.7;
}

.section {
  --section-gap: clamp(5rem, 10vw, 7.5rem);
  margin-top: var(--section-gap);
}

/* Carries the timeline of the section above on through this one; the heading
   steps in so the line runs beside it rather than through it */
/* A full-width band of its own that starts right under the hero's slanted edge and
   ends in a slant like the footer's */
.section--band {
  position: relative;
  isolation: isolate;
  margin-top: 0;
  /* Bottom = top + one slant, so the space above the title and below the cards
     looks the same where the slanted edges meet in the middle */
  --band-pad: clamp(3rem, 6vw, 4.5rem);
  padding-block: var(--band-pad) calc(var(--band-pad) + min(6vw, 5rem));
}

.section--band::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 calc(50% - 50vw);
  background: var(--band-bg);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - min(6vw, 5rem)), 0 100%);
}

.section--continued {
  position: relative;
}

.section--continued .section__label {
  padding-left: 1.5rem;
}

/* Editorial section headings: large titles, set apart by space alone */
.section__label {
  margin-bottom: 2.25rem;
  font-family: var(--display);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.stack {
  display: grid;
}

/* The timeline: a line from the first dot to the last, and an accent line that fills it
   as you scroll. vTimelineFill sets --line-start, --line-end and --fill; --dot-top places
   the dots (in EntryItem). */
.timeline {
  --dot-top: 0.3rem;
  position: relative;
}

@media (min-width: 60rem) {
  .timeline {
    --dot-top: 0.45rem;
  }
}

.timeline::before,
.timeline::after,
.section--continued::before,
.section--continued::after {
  content: '';
  position: absolute;
  top: var(--line-start, 0);
  left: 0;
  width: 1px;
  pointer-events: none;
}

.timeline::before,
.section--continued::before {
  height: calc(var(--line-end, 0px) - var(--line-start, 0px));
  background: var(--line);
}

.timeline::after,
.section--continued::after {
  height: calc(var(--fill, 0) * (var(--line-end, 0px) - var(--line-start, 0px)));
  background: var(--accent);
}

.about {
  display: grid;
  gap: 1rem;
  color: var(--muted);
  line-height: 1.7;
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 1rem;
}

.section__label {
  scroll-margin-top: 2rem;
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

@media (max-width: 480px) {
  .page {
    padding-top: 4.5rem;
  }

  .hero {
    margin-top: -4.5rem;
  }

  .section {
    margin-top: 3.75rem;
  }
}
</style>
