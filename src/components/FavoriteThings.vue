<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useLayoutGlide } from '../composables/useLayoutGlide'
import { favorites } from '../data'

const host = useTemplateRef<HTMLElement>('host')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const stages = useTemplateRef<HTMLElement[]>('stages')

let dispose: (() => void) | undefined

useLayoutGlide(matchMedia('(min-width: 80rem)'), () => stages.value ?? [])

const away = ref(!matchMedia('(prefers-reduced-motion: reduce)').matches)
const arrival = new IntersectionObserver(
  ([entry]) => {
    if (!entry.isIntersecting) return
    arrival.disconnect()
    away.value = false
  },
  { threshold: 0.3 },
)

const nearby = new IntersectionObserver(
  async ([entry]) => {
    if (!entry.isIntersecting) return
    nearby.disconnect()
    const [{ createFavoritesScene }] = await Promise.all([
      import('../favorites/createFavoritesScene'),
      document.fonts.load('800 40px Montserrat'),
      document.fonts.load('500 40px "JetBrains Mono"'),
    ])
    if (host.value) dispose = createFavoritesScene(host.value, canvas.value!, stages.value!, favorites).dispose
  },
  { rootMargin: '400px' },
)

onMounted(() => {
  nearby.observe(host.value!)
  arrival.observe(host.value!)
})
onBeforeUnmount(() => {
  nearby.disconnect()
  arrival.disconnect()
  dispose?.()
})
</script>

<template>
  <div ref="host" class="favorites">
    <div class="favorites__layer" aria-hidden="true">
      <canvas ref="canvas" class="favorites__canvas" />
      <div class="favorites__frame">
        <div
          v-for="(model, i) in favorites"
          :key="model"
          ref="stages"
          :class="[`favorites__stage favorites__stage--${model}`, { 'is-away': away }]"
          :style="{ '--i': i }"
        />
      </div>
    </div>
    <div class="favorites__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.favorites {
  --objects-room: clamp(26rem, 130vw, 31rem);
  --spread: min(50cqw, 15rem);
  position: relative;
  container-type: inline-size;
  padding-bottom: calc(var(--objects-room) + 4rem);
}

.favorites__content {
  position: relative;
  z-index: 1;
}

.favorites__layer {
  position: absolute;
  top: -8rem;
  bottom: -8rem;
  left: calc(50% - 50vw);
  width: 100vw;
  overflow: clip;
  pointer-events: none;
}

.favorites__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.favorites__frame {
  position: absolute;
  inset: 8rem auto;
  left: calc(50% - 50cqw);
  width: 100cqw;
}

.favorites__stage {
  position: absolute;
  --stage-w: clamp(11rem, 56vw, 18rem);
  width: var(--stage-w);
  aspect-ratio: 1;
  transition: translate 1.4s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--i) * 0.15s);
}

.favorites__stage.is-away {
  translate: -100vw 0;
}

.favorites__stage--camera.is-away,
.favorites__stage--palette.is-away {
  translate: 100vw 0;
}

.favorites__stage--laptop {
  left: calc(50% - var(--spread) - 1rem);
  bottom: calc(var(--objects-room) * 0.6);
}

.favorites__stage--camera {
  right: calc(50% - var(--spread) - 1rem);
  bottom: calc(var(--objects-room) * 0.56);
}

.favorites__stage--coffee {
  aspect-ratio: 1 / 1.9;
  left: calc(50% - var(--spread) - 2.5rem);
  bottom: calc(-1rem - var(--stage-w) * 0.45);
}

.favorites__stage--palette {
  right: calc(50% - var(--spread) - 1.5rem);
  bottom: 0;
}

.favorites__stage--polaroid {
  left: calc(50% - var(--stage-w) * 0.55);
  bottom: calc(var(--objects-room) * 0.22);
}

@media (min-width: 80rem) {
  .favorites {
    --row: min(100vw - 2.5rem, 78rem);
    width: var(--row);
    margin-inline: calc((100% - var(--row)) / 2);
    padding: 0 calc((var(--row) - 41.5rem) / 2) 14rem;
  }

  .favorites__stage {
    --stage-w: 22rem;
  }

  .favorites__stage--laptop {
    left: calc(50% - 20.75rem - 21rem);
    top: -5rem;
    bottom: auto;
  }

  .favorites__stage--coffee {
    left: calc(50% - 20.75rem - 10rem);
    bottom: calc(-6rem - var(--stage-w) * 0.45);
  }

  .favorites__stage--camera {
    right: calc(50% - 20.75rem - 19rem);
    left: auto;
    top: 1rem;
    bottom: auto;
  }

  .favorites__stage--palette {
    right: calc(50% - 20.75rem - 12rem);
    bottom: -9rem;
  }

  .favorites__stage--polaroid {
    left: calc(50% - 8rem);
    bottom: -9rem;
  }
}
</style>
