<script setup lang="ts">
import { profile } from '../data'
import LinkIcon from './LinkIcon.vue'

defineProps<{ label: string }>()

const opensInNewTab = (href: string) => href.startsWith('http') || href.endsWith('.pdf')
</script>

<template>
  <div class="contact">
    <nav class="contact__links" :aria-label="label">
      <a
        v-for="link in profile.links"
        :key="link.label"
        :href="link.href"
        class="pill"
        :target="opensInNewTab(link.href) ? '_blank' : undefined"
        rel="noopener"
      >
        <LinkIcon v-if="link.icon" :icon="link.icon" />
        {{ link.label }}
      </a>
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
