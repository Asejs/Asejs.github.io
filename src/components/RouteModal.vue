<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

defineProps<{ wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

onMounted(() => {
  dialog.value?.showModal()
  // Focus the dialog itself, not the first focusable element inside (the scroll area)
  dialog.value?.focus()
})

// The content fills the dialog, so a click on the dialog itself is a click on the backdrop
function onClick(event: MouseEvent) {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="modal" :class="{ 'modal--wide': wide }" @click="onClick" tabindex="-1" @cancel.prevent="emit('close')">
    <div class="modal__body">
      <div :class="{ modal__column: !wide }">
        <slot />
      </div>
    </div>
    <button type="button" class="modal__close" aria-label="Lukk" @click="emit('close')">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  </dialog>
</template>

<style scoped>
.modal {
  container-type: inline-size;
  width: min(80vw, 56rem); /* the text column plus some air */
  max-width: none;
  height: 88dvh;
  max-height: none;
  margin: auto;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
}

.modal--wide {
  width: 80vw;
}

.modal:focus {
  outline: none;
}

.modal::backdrop {
  background: rgb(0 0 0 / 0.55);
  backdrop-filter: blur(4px);
}

.modal__body {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 6rem clamp(1.25rem, 4vw, 3rem) 3rem;
}

.modal__column {
  max-width: 44rem;
  margin: 0 auto;
}

.modal__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter: blur(6px);
  color: var(--muted);
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s;
}

.modal__close:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.modal__close svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

@media (max-width: 39.99rem) {
  .modal {
    width: calc(100vw - 1rem);
    height: calc(100dvh - 1rem);
  }

}

@media (max-width: 480px) {
  .modal__body {
    padding-top: 4.5rem;
  }
}
</style>
