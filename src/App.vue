<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import AboutMe from './components/AboutMe.vue'
import ContactLinks from './components/ContactLinks.vue'
import EntryItem from './components/EntryItem.vue'
import HeroSection from './components/HeroSection.vue'
import InterestGallery from './components/InterestGallery.vue'
import InterestTile from './components/InterestTile.vue'
import ProjectStage from './components/ProjectStage.vue'
import ProjectDetail from './components/ProjectDetail.vue'
import RouteModal from './components/RouteModal.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteNav from './components/SiteNav.vue'
import SkillGroups from './components/SkillGroups.vue'
import { useHashRoute } from './composables/useHashRoute'
import { education, experience, interests, projects, roles } from './data'
import { vReveal } from './directives/reveal'
import { vTimelineFill } from './directives/timelineFill'

const heroSection = useTemplateRef<InstanceType<typeof HeroSection>>('heroSection')

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
  else {
    const section = document.getElementById(activeProject.value ? 'prosjekter' : 'interesser')
    history.replaceState(null, '', location.pathname + location.search)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    section?.scrollIntoView({ block: 'start' })
  }
  openedFromPage = false
}
</script>

<template>
  <RouteModal v-if="activeProject" :key="activeProject.slug" @close="closeModal">
    <ProjectDetail :project="activeProject" />
  </RouteModal>

  <RouteModal v-else-if="activeInterest" :key="activeInterest.slug" wide @close="closeModal">
    <InterestGallery :interest="activeInterest" />
  </RouteModal>

  <SiteNav :hero="heroSection?.hero ?? null" />

  <main class="page">
    <HeroSection ref="heroSection" />

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
      <SkillGroups />
    </section>

    <section v-reveal class="section" aria-labelledby="verv">
      <h2 id="verv" class="section__label">Verv</h2>
      <div v-timeline-fill class="stack timeline">
        <EntryItem v-for="entry in roles" :key="entry.title" :entry="entry" />
      </div>
    </section>

    <div class="section section--group">
      <section v-reveal class="section section--about" aria-labelledby="om-meg">
        <h2 id="om-meg" class="section__label">Om meg</h2>
        <AboutMe />
      </section>

      <section v-reveal class="section" aria-labelledby="interesser">
        <h2 id="interesser" class="section__label">Interesser</h2>
        <div class="interest-grid">
          <InterestTile v-for="interest in interests" :key="interest.slug" :interest="interest" />
        </div>
      </section>
    </div>

    <section v-reveal class="section" aria-labelledby="kontakt">
      <h2 id="kontakt" class="section__label">Kontakt</h2>
      <p class="contact__intro">Ta gjerne kontakt, enten det gjelder kode, prosjekter eller en faglig prat!</p>
      <ContactLinks label="Kontakt nederst" />
    </section>

    <SiteFooter />
  </main>
</template>

<style scoped>
.page {
  counter-reset: section;
  max-width: 44rem;
  margin: 0 auto;
  padding: 6rem 1.25rem 3rem;
}

.page {
  --band-bg: color-mix(in srgb, var(--text) 3%, var(--bg));
}

.section {
  --section-gap: clamp(6.5rem, 13vw, 10rem);
  margin-top: var(--section-gap);
}

/* Carries the timeline of the section above on through this one; the heading
   steps in so the line runs beside it rather than through it */
/* A full-width band of its own that starts right under the hero's slanted edge and
   ends in a slant like the footer's */
.section.section--band {
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

.section--group {
  --slant: min(6vw, 5rem);
  --band-pad: clamp(3rem, 6vw, 4.5rem);
  position: relative;
  isolation: isolate;
  padding-block: calc(var(--band-pad) + var(--slant));
}

.section--group::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 calc(50% - 50vw);
  background: var(--band-bg);
  clip-path: polygon(0 var(--slant), 100% 0, 100% calc(100% - var(--slant)), 0 100%);
}

.section--group > .section:first-child {
  margin-top: 0;
}

.section--about {
  padding-bottom: clamp(2rem, 6vw, 5rem);
}

.section--about + .section {
  margin-top: calc(var(--section-gap) * 0.6);
}

.section--group .section__label {
  position: relative;
  z-index: 1;
}

.section--continued {
  position: relative;
}

.section--continued .section__label {
  padding-left: 1.5rem;
}

/* Editorial section headings: large titles, set apart by space alone */
.section__label {
  counter-increment: section;
  margin-bottom: 2.25rem;
  font-family: var(--display);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.section__label::before {
  content: counter(section, decimal-leading-zero) ' /';
  margin-right: 0.7em;
  font-family: var(--mono);
  font-size: 0.6em;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--accent-text);
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

.contact__intro {
  margin: -1rem 0 1.5rem;
  color: var(--muted);
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 1rem;
}

.section__label {
  scroll-margin-top: 5rem;
}

@media (max-width: 480px) {
  .page {
    padding-top: 4.5rem;
  }

  .section {
    margin-top: 5rem;
  }
}
</style>
