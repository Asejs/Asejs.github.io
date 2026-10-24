<script setup lang="ts">
import { nextTick, watch } from 'vue'
import ContactLinks from './components/ContactLinks.vue'
import EntryItem from './components/EntryItem.vue'
import InterestGallery from './components/InterestGallery.vue'
import InterestTile from './components/InterestTile.vue'
import ProjectCard from './components/ProjectCard.vue'
import ProjectDetail from './components/ProjectDetail.vue'
import { useHashRoute } from './composables/useHashRoute'
import { useTheme } from './composables/useTheme'
import { education, experience, interests, profile, projects, roles, skills } from './data'
import { vReveal } from './directives/reveal'

const { theme, toggle } = useTheme()
const { activeProject, activeInterest } = useHashRoute()

watch([activeProject, activeInterest], async ([project, interest]) => {
  await nextTick()
  if (project || interest) {
    window.scrollTo({ top: 0 })
    return
  }
  const anchor = window.location.hash.slice(1)
  const target = anchor ? document.getElementById(anchor) : null
  if (target) target.scrollIntoView()
  else window.scrollTo({ top: 0 })
})

const year = new Date().getFullYear()
</script>

<template>
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

  <main v-if="activeProject" class="page">
    <ProjectDetail :project="activeProject" />
  </main>

  <main v-else-if="activeInterest" class="page page--wide">
    <InterestGallery :interest="activeInterest" />
  </main>

  <main v-else class="page">
    <header class="hero">
      <div class="hero__text">
        <div class="hero__title">
          <h1 class="hero__name">{{ profile.name }}</h1>
          <p class="eyebrow">// {{ profile.role.toLowerCase() }} · {{ profile.location.toLowerCase() }}</p>
        </div>
        <p class="hero__summary">{{ profile.summary }}</p>
        <ContactLinks label="Kontakt" class="hero__links" />
      </div>
      <picture class="hero__picture">
        <source media="(max-width: 39.99rem)" srcset="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" />
        <img class="hero__photo" src="/portrait.jpg" :alt="profile.name" width="529" height="585" />
      </picture>
    </header>

    <section v-reveal class="section" aria-labelledby="prosjekter">
      <h2 id="prosjekter" class="section__label">Prosjekter</h2>
      <div class="project-grid">
        <ProjectCard v-for="project in projects" :key="project.slug" :project="project" />
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="erfaring">
      <h2 id="erfaring" class="section__label">Erfaring</h2>
      <div class="stack">
        <EntryItem v-for="entry in experience" :key="entry.org" :entry="entry" />
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="teknologier">
      <h2 id="teknologier" class="section__label">Teknologier</h2>
      <div class="skill-groups">
        <div>
          <h3 class="skill-groups__label">Jobber med daglig</h3>
          <ul class="tags">
            <li v-for="skill in skills.daily" :key="skill" class="tag">{{ skill }}</li>
          </ul>
        </div>
        <div>
          <h3 class="skill-groups__label">Erfaring fra tidligere prosjekter</h3>
          <ul class="tags">
            <li v-for="skill in skills.used" :key="skill" class="tag">{{ skill }}</li>
          </ul>
        </div>
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="utdanning">
      <h2 id="utdanning" class="section__label">Utdanning</h2>
      <div class="stack">
        <EntryItem v-for="entry in education" :key="entry.title" :entry="entry" />
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="verv">
      <h2 id="verv" class="section__label">Verv</h2>
      <div class="stack">
        <EntryItem v-for="entry in roles" :key="entry.title" :entry="entry" />
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="interesser">
      <h2 id="interesser" class="section__label">Interesser</h2>
      <div class="interest-grid">
        <InterestTile v-for="interest in interests" :key="interest.slug" :interest="interest" />
      </div>
    </section>

    <section v-reveal class="section" aria-labelledby="kontakt">
      <h2 id="kontakt" class="section__label">Kontakt</h2>
      <ContactLinks label="Kontakt nederst" />
    </section>

    <footer class="footer">
      <span>© {{ year }} {{ profile.name }}</span>
    </footer>
  </main>
</template>

<style scoped>
.page {
  max-width: 44rem;
  margin: 0 auto;
  padding: 6rem 1.25rem 3rem;
}

.page--wide {
  max-width: none;
  padding-inline: clamp(1rem, 3vw, 2.5rem);
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
}

.hero__picture {
  display: contents;
}

.hero__photo {
  display: none;
}

.hero__title {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: flex-start;
}

@media (min-width: 40rem) {
  .hero {
    --photo-width: clamp(11rem, 22vw, 17rem);

    display: grid;
    grid-template-columns: auto var(--photo-width);
    justify-content: space-between;
    column-gap: clamp(2rem, 5vw, 6rem);
    min-height: clamp(30rem, 28vw, 36rem);
    padding: 0 max(2rem, 4vw);
  }

  .hero__text {
    grid-area: 1 / 1;
    align-self: center;
    padding-block: 7rem 8rem;
  }

  .hero__photo {
    grid-area: 1 / 2;
    align-self: center;
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    border-radius: 50%;
    object-fit: cover;
    object-position: center 30%;
  }
}

@media (min-width: 64rem) {
  .hero {
    justify-content: center;
    padding-right: max(5rem, 5vw);
  }
}

.eyebrow {
  font-family: var(--mono);
  font-size: 0.85rem;
  color: var(--accent);
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
  margin-top: 1rem;
  max-width: 34rem;
  font-size: 1.15rem;
  color: var(--muted);
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
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--muted);
}
.section {
  margin-top: 5rem;
}

.section__label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.section__label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.stack {
  display: grid;
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 1rem;
}

.project-grid {
  display: grid;
  gap: 3rem;
}

.section__label {
  scroll-margin-top: 2rem;
}

.footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 6rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
  font-size: 0.85rem;
  color: var(--muted);
}

.theme-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10;
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
