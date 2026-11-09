<script setup lang="ts">
import { profile } from '../data'
import LinkIcon from './LinkIcon.vue'

defineProps<{ label: string }>()

const opensInNewTab = (href: string) => href.startsWith('http') || href.endsWith('.pdf')
</script>

<template>
  <div class="contact">
    <nav class="contact__links" :aria-label="label">
      <template v-for="link in profile.links" :key="link.label">
        <span v-if="link.variants" class="pill pill--split" role="group" :aria-label="link.label">
          <LinkIcon v-if="link.icon" :icon="link.icon" />
          {{ link.label }}
          <a
            v-for="variant in link.variants"
            :key="variant.href"
            :href="variant.href"
            class="pill__variant"
            :aria-label="variant.ariaLabel"
            :target="opensInNewTab(variant.href) ? '_blank' : undefined"
            rel="noopener"
          >
            {{ variant.label }}
          </a>
        </span>
        <a
          v-else
          :href="link.href"
          class="pill"
          :target="opensInNewTab(link.href) ? '_blank' : undefined"
          rel="noopener"
        >
          <LinkIcon v-if="link.icon" :icon="link.icon" />
          {{ link.label }}
        </a>
      </template>
    </nav>

    <ul class="contact__details">
      <li class="detail">
        <a :href="`mailto:${profile.email}`" class="detail__icon detail__icon--link" aria-label="Send e-post">
          <LinkIcon icon="mail" />
        </a>
        <span class="detail__value">{{ profile.email }}</span>
      </li>
      <li class="detail">
        <span class="detail__icon"><LinkIcon icon="phone" /></span>
        <span class="detail__value">{{ profile.phone }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.contact__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.95rem 0.45rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s;
}

.pill:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.pill--split {
  padding-right: 0.4rem;
}

.pill--split:hover {
  border-color: var(--line);
  color: inherit;
  background: none;
}

.pill__variant {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.pill__variant:hover,
.pill__variant:focus-visible {
  color: var(--accent);
  background: var(--accent-soft);
}

.contact__details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  margin-top: 1rem;
  padding: 0;
  list-style: none;
}

.detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--muted);
}

.detail__icon {
  display: grid;
  place-items: center;
  color: var(--accent);
}

.detail__icon--link:hover {
  opacity: 0.75;
}

.detail__value {
  color: var(--text);
}
</style>
