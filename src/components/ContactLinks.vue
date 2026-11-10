<script setup lang="ts">
import { onUnmounted, ref, useId, watch } from 'vue'

import { profile } from '../data'
import LinkIcon from './LinkIcon.vue'

defineProps<{ label: string }>()

const isMenuOpen = ref(false)
const menu = ref<HTMLElement>()
const menuButton = ref<HTMLButtonElement>()
const menuId = useId()

const setMenu = (el: unknown) => {
  menu.value = el instanceof HTMLElement ? el : undefined
}

const setMenuButton = (el: unknown) => {
  menuButton.value = el instanceof HTMLButtonElement ? el : undefined
}

const opensInNewTab = (href: string) => href.startsWith('http') || href.endsWith('.pdf')

const closeMenu = ({ restoreFocus = false } = {}) => {
  isMenuOpen.value = false
  if (restoreFocus) {
    menuButton.value?.focus()
  }
}

const onPointerDown = (event: PointerEvent) => {
  if (!menu.value?.contains(event.target as Node)) {
    closeMenu()
  }
}

watch(isMenuOpen, (open) => {
  if (open) {
    document.addEventListener('pointerdown', onPointerDown)
  } else {
    document.removeEventListener('pointerdown', onPointerDown)
  }
})

onUnmounted(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<template>
  <div class="contact">
    <nav class="contact__links" :aria-label="label">
      <template v-for="link in profile.links" :key="link.label">
        <div
          v-if="link.variants"
          :ref="setMenu"
          class="menu"
          @keydown.esc="closeMenu({ restoreFocus: true })"
        >
          <button
            :ref="setMenuButton"
            type="button"
            class="pill"
            :aria-expanded="isMenuOpen"
            :aria-controls="menuId"
            @click="isMenuOpen = !isMenuOpen"
          >
            <LinkIcon v-if="link.icon" :icon="link.icon" />
            {{ link.label }}
          </button>
          <div v-show="isMenuOpen" :id="menuId" class="menu__popover">
            <template v-for="(variant, index) in link.variants" :key="variant.href">
              <span v-if="index > 0" class="menu__divider" aria-hidden="true">|</span>
              <a
                :href="variant.href"
                class="menu__option"
                :aria-label="variant.ariaLabel"
                :target="opensInNewTab(variant.href) ? '_blank' : undefined"
                rel="noopener"
                @click="closeMenu()"
              >
                {{ variant.label }}
              </a>
            </template>
          </div>
        </div>
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
      <li class="detail">
        <span class="detail__icon"><LinkIcon icon="location" /></span>
        <span class="detail__value">{{ profile.location }}</span>
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

.menu {
  position: relative;
}

button.pill {
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: inherit;
  background: none;
  cursor: pointer;
}

.pill[aria-expanded='true'] {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.menu__popover {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.25rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.08);
  transform: translateX(-50%);
}

.menu__option {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.menu__option:hover,
.menu__option:focus-visible {
  color: var(--accent);
  background: var(--accent-soft);
}

.menu__divider {
  color: var(--line);
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
