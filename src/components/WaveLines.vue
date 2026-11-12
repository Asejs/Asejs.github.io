<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

// Thin, gently curved lines behind the hero, like strings. They bend toward the mouse
// as it moves over the hero, and a click plucks the ones nearby so they vibrate. Only animates while on screen and the tab is visible; with reduced
// motion it draws one still frame.
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const LINES = 22

let frame = 0
let visible = true
let observer: IntersectionObserver | undefined
let width = 0
let height = 0

// The mouse, eased so the lines follow it smoothly; `pull` fades in and out
const mouse = { x: 0, y: 0, pull: 0 }
const target = { x: 0, y: 0, pull: 0 }

function onPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  const r = canvas.value!.getBoundingClientRect()
  target.x = event.clientX - r.left
  target.y = event.clientY - r.top
  target.pull = 1
}

function onPointerLeave() {
  target.pull = 0
}

// Clicks on the background (not on links or buttons) pluck the strings there
const ripples: { x: number; y: number; start: number }[] = []
function onPointerDown(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('a, button')) return
  const r = canvas.value!.getBoundingClientRect()
  ripples.push({ x: event.clientX - r.left, y: event.clientY - r.top, start: performance.now() })
  if (ripples.length > 4) ripples.shift()
  resume()
}

// How far a point on a string is displaced by the plucks right now: strings near the
// click vibrate up and down, most where it was clicked, dying away over a second or two
function rippleAt(x: number, y: number, time: number) {
  let offset = 0
  for (const pluck of ripples) {
    const age = (time - pluck.start) / 1000
    if (age < 0 || age > 2) continue
    const along = Math.exp(-((x - pluck.x) ** 2) / (2 * 160 ** 2))
    const across = Math.exp(-((y - pluck.y) ** 2) / (2 * 60 ** 2))
    offset += Math.sin(age * 28) * Math.exp(-age * 2.5) * 12 * along * across
  }
  return offset
}

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
  mouse.x += (target.x - mouse.x) * 0.08
  mouse.y += (target.y - mouse.y) * 0.08
  mouse.pull += (target.pull - mouse.pull) * 0.05
  const reach = width * 0.12
  ctx.strokeStyle = getComputedStyle(el).color
  ctx.lineWidth = 1
  for (let l = 0; l < LINES; l++) {
    ctx.globalAlpha = 0.05 + (l / LINES) * 0.1
    ctx.beginPath()
    for (let x = 0; x <= width; x += 6) {
      const k = x / width
      const y =
        height * 0.5 +
        Math.sin(k * 2.5 + time * 0.0001 + l * 0.05) * height * 0.05 +
        Math.sin(k * 5 - time * 0.00007 + l * 0.03) * height * 0.012 +
        l * height * 0.018
      // Near the mouse, each line is drawn part of the way toward it
      const bend = mouse.pull * Math.exp(-((x - mouse.x) ** 2) / (2 * reach ** 2)) * 0.35
      const yy = y + (mouse.y - y) * bend + rippleAt(x, y, time)
      if (x === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
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
  // The canvas ignores the pointer (so the hero stays clickable); listen on the hero
  canvas.value!.parentElement!.addEventListener('pointermove', onPointerMove, { passive: true })
  canvas.value!.parentElement!.addEventListener('pointerleave', onPointerLeave)
  canvas.value!.parentElement!.addEventListener('pointerdown', onPointerDown)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  canvas.value?.parentElement?.removeEventListener('pointermove', onPointerMove)
  canvas.value?.parentElement?.removeEventListener('pointerleave', onPointerLeave)
  canvas.value?.parentElement?.removeEventListener('pointerdown', onPointerDown)
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
