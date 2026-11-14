<script setup lang="ts">
import { skills } from '../data'
import { vScrollLight } from '../directives/scrollLight'
</script>

<template>
  <div v-scroll-light class="skill-groups">
    <div>
      <h3 class="skill-groups__label">Bruker daglig</h3>
      <ul class="tags">
        <li v-for="skill in skills.daily" :key="skill.name">
          <a v-if="skill.href" :href="skill.href" target="_blank" rel="noopener" class="tag">{{ skill.name }}</a>
          <span v-else class="tag">{{ skill.name }}</span>
        </li>
      </ul>
    </div>
    <div>
      <h3 class="skill-groups__label">Tidligere erfaring</h3>
      <ul class="tags">
        <li v-for="skill in skills.used" :key="skill.name">
          <a v-if="skill.href" :href="skill.href" target="_blank" rel="noopener" class="tag">{{ skill.name }}</a>
          <span v-else class="tag">{{ skill.name }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
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
</style>
