<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

// Slow, thin wave lines drawn behind the hero. Only animates while on screen and the
// tab is visible; with reduced motion it draws one still frame.
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const LINES = 22

let frame = 0
let visible = true
let observer: IntersectionObserver | undefined
let width = 0
let height = 0

function resize() {
  const el = canvas.value
  if (!el) return
  const dpr = Math.min(devicePixelRatio || 1, 2)
  width = el.clientWidth
  height = el.clientHeight
  el.width = width * dpr
  el.height = height * dpr
  el.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function draw(time: number) {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')!
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = getComputedStyle(el).color
  ctx.lineWidth = 1
  for (let l = 0; l < LINES; l++) {
    ctx.globalAlpha = 0.05 + (l / LINES) * 0.1
    ctx.beginPath()
    for (let x = 0; x <= width; x += 6) {
      const k = x / width
      const y =
        height * 0.55 +
        Math.sin(k * 4 + time * 0.00018 + l * 0.07) * height * 0.13 +
        Math.sin(k * 9 - time * 0.00012 + l * 0.04) * height * 0.04 +
        l * height * 0.012
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  if (!reduceMotion && visible && !document.hidden) frame = requestAnimationFrame(draw)
  else frame = 0
}

function resume() {
  if (!frame && visible && !document.hidden && !reduceMotion) frame = requestAnimationFrame(draw)
}

onMounted(() => {
  resize()
  draw(0)
  addEventListener('resize', resize)
  document.addEventListener('visibilitychange', resume)
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    resume()
  })
  observer.observe(canvas.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', resume)
})
</script>

<template>
  <canvas ref="canvas" class="waves" aria-hidden="true" />
</template>

<style scoped>
.waves {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  color: var(--text);
  pointer-events: none;
}
</style>
