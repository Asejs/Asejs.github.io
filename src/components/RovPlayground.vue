<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { RovInput, RovScene, RovTelemetry } from '../rov/createRovScene'
import { createSound } from '../rov/sound'

const props = defineProps<{ model: string }>()

const stage = ref<HTMLElement>()
const viewport = ref<HTMLElement>()
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const active = ref(false)
const touched = ref(false)
const telemetry = reactive<RovTelemetry>({
  depth: 0,
  heading: 0,
  surge: 0,
  heave: 0,
  gripClosed: false,
  status: 'ready',
  timeLeft: 15 * 60,
  score: 0,
  bonus: 0,
  tasks: [],
  prompt: '',
  explosions: 0,
})

const groups = computed(() => {
  const result: { name: string; tasks: RovTelemetry['tasks'] }[] = []
  for (const task of telemetry.tasks) {
    const group = result.find((candidate) => candidate.name === task.group)
    if (group) group.tasks.push(task)
    else result.push({ name: task.group, tasks: [task] })
  }
  return result
})
const showTasks = ref(false)
const HEAVE_KEYS = ['KeyE', 'KeyQ', 'Space', 'ShiftLeft', 'ShiftRight']
const usedHeave = ref(false)
const heaveTip = ref(false)
let heaveTimer: number | undefined
const doneCount = computed(() => telemetry.tasks.filter((task) => task.done).length)
const nextTask = computed(() => telemetry.tasks.find((task) => !task.done))
const maxScore = computed(() => telemetry.tasks.reduce((sum, task) => sum + task.points, 0))
const allDone = computed(() => telemetry.tasks.length > 0 && telemetry.tasks.every((task) => task.done))

const MUTE_KEY = 'rov-muted'
const sound = createSound()
const muted = ref(readMuted())
sound.setMuted(muted.value)

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function toggleMute() {
  muted.value = !muted.value
  sound.setMuted(muted.value)
  try {
    localStorage.setItem(MUTE_KEY, muted.value ? '1' : '0')
  } catch {}
}

watch(
  () => telemetry.score,
  (score, previous) => {
    if (score > previous) sound.score()
  },
)

watch(
  () => telemetry.explosions,
  (count, previous) => {
    if (count > previous) sound.explosion()
  },
)

watch(
  () => telemetry.status,
  (next) => {
    if (next !== 'finished') return
    sound.stopMusic()
    sound.thrust(0)
    if (allDone.value) sound.finish()
    else sound.timeUp()
  },
)

const prompt = computed(() => telemetry.prompt)

function formatTime(seconds: number) {
  const whole = Math.ceil(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(2).replace('.', ',')
}

let rov: RovScene | undefined
let disposed = false
let startWhenReady = false
let visible = false
let intersection: IntersectionObserver | undefined

const KEYS: Record<string, [keyof RovInput, number]> = {
  KeyW: ['surge', 1],
  ArrowUp: ['surge', 1],
  KeyS: ['surge', -1],
  ArrowDown: ['surge', -1],
  KeyA: ['yaw', 1],
  ArrowLeft: ['yaw', 1],
  KeyD: ['yaw', -1],
  ArrowRight: ['yaw', -1],
  KeyE: ['heave', 1],
  Space: ['heave', 1],
  KeyQ: ['heave', -1],
  ShiftLeft: ['heave', -1],
  ShiftRight: ['heave', -1],
}
const pressed = new Set<string>()

function applyKeys() {
  if (!rov) return
  rov.input.surge = 0
  rov.input.yaw = 0
  rov.input.heave = 0
  pressed.forEach((code) => {
    const [axis, value] = KEYS[code]
    rov!.input[axis] = Math.max(-1, Math.min(1, rov!.input[axis] + value))
  })
  const { surge, yaw, heave } = rov.input
  if (telemetry.status !== 'running') return sound.thrust(0)
  sound.thrust(Math.min(1, Math.hypot(surge, heave) + Math.abs(yaw) * 0.6))
}

function onKeydown(event: KeyboardEvent) {
  if (event.code === 'KeyG' || event.code === 'Enter') {
    event.preventDefault()
    if (!event.repeat) grip()
    return
  }
  if (!(event.code in KEYS)) return
  event.preventDefault()
  pressed.add(event.code)
  if (HEAVE_KEYS.includes(event.code)) usedHeave.value = true
  applyKeys()
}

function onKeyup(event: KeyboardEvent) {
  if (!(event.code in KEYS)) return
  pressed.delete(event.code)
  applyKeys()
}

function release() {
  active.value = false
  pressed.clear()
  applyKeys()
}

function grip() {
  if (!rov || telemetry.status !== 'running') return
  rov.toggleGrip()
  sound.grip()
}

function touchGrip() {
  touched.value = true
  grip()
}

function hold(code: string) {
  if (HEAVE_KEYS.includes(code)) usedHeave.value = true
  touched.value = true
  pressed.add(code)
  applyKeys()
}

function letGo(code: string) {
  pressed.delete(code)
  applyKeys()
}

function syncLoop() {
  if (!rov) return
  if (visible && document.visibilityState === 'visible') {
    rov.start()
    sound.resume()
  } else {
    rov.stop()
    sound.suspend()
  }
}

async function load() {
  if (status.value !== 'idle' || !viewport.value) return
  status.value = 'loading'
  try {
    const { createRovScene } = await import('../rov/createRovScene')
    const scene = await createRovScene(viewport.value, props.model, (next) => Object.assign(telemetry, next))
    if (disposed) {
      scene.dispose()
      return
    }
    rov = scene
    status.value = 'ready'
    syncLoop()
    if (startWhenReady) {
      startWhenReady = false
      start()
    }
  } catch {
    status.value = 'error'
  }
}

onMounted(() => {
  intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (visible) load()
      syncLoop()
    },
    { rootMargin: '200px' },
  )
  if (stage.value) intersection.observe(stage.value)
  document.addEventListener('visibilitychange', syncLoop)
})

onBeforeUnmount(() => {
  disposed = true
  intersection?.disconnect()
  document.removeEventListener('visibilitychange', syncLoop)
  rov?.dispose()
  sound.dispose()
  window.clearTimeout(heaveTimer)
})

function start() {
  usedHeave.value = false
  heaveTip.value = false
  window.clearTimeout(heaveTimer)
  heaveTimer = window.setTimeout(() => (heaveTip.value = true), 8000)
  rov?.startMission()
  sound.startMusic()
  stage.value?.focus()
}

function restart() {
  rov?.dispose()
  rov = undefined
  Object.assign(telemetry, { status: 'ready', score: 0, bonus: 0, tasks: [], prompt: '', timeLeft: 15 * 60, explosions: 0 })
  status.value = 'idle'
  startWhenReady = true
  load()
}

function barStyle(level: number) {
  const height = `${Math.abs(level) * 50}%`
  return level >= 0 ? { bottom: '50%', height } : { top: '50%', height }
}

const TOUCH_BUTTONS = [
  { code: 'KeyW', label: '↑', name: 'Framover', area: 'up' },
  { code: 'KeyA', label: '←', name: 'Sving venstre', area: 'left' },
  { code: 'KeyD', label: '→', name: 'Sving høyre', area: 'right' },
  { code: 'KeyS', label: '↓', name: 'Bakover', area: 'down' },
  { code: 'KeyE', label: 'Opp', name: 'Opp', area: 'rise' },
  { code: 'KeyQ', label: 'Ned', name: 'Ned', area: 'dive' },
]
</script>

<template>
  <section class="rov">
    <h2 class="rov__title">Prøv selv</h2>
    <p class="rov__intro">
      Kjør <a href="https://www.uissubsea.no/past-drones/fenris" target="_blank" rel="noopener">Fenris</a>, ROV-en fra bacheloroppgaven, gjennom Oppgave 1 – Maritim fornybar energi fra MATE ROV World Championship 2022. Du har 15 minutter, som i konkurransen.
    </p>

    <div
      ref="stage"
      class="rov__stage"
      :class="{ 'rov__stage--active': active }"
      tabindex="0"
      role="application"
      aria-label="Styr ROV-en med W, A, S, D, Q og E"
      @focus="active = true"
      @blur="release"
      @keydown="onKeydown"
      @keyup="onKeyup"
    >
      <div ref="viewport" class="rov__viewport" />

      <p v-if="status === 'loading' || status === 'idle'" class="rov__message">Laster modell …</p>
      <p v-else-if="status === 'error'" class="rov__message">Kunne ikke laste 3D-modellen.</p>

      <template v-else>
        <dl class="rov__hud">
          <div>
            <dt>Dybde</dt>
            <dd>{{ telemetry.depth.toFixed(1) }} m</dd>
          </div>
          <div class="rov__hud-extra">
            <dt>Kurs</dt>
            <dd>{{ Math.round(telemetry.heading) }}°</dd>
          </div>
          <div class="rov__hud-extra">
            <dt>Griper</dt>
            <dd>{{ telemetry.gripClosed ? 'Lukket' : 'Åpen' }}</dd>
          </div>
          <div>
            <dt>Tid</dt>
            <dd :class="{ 'rov__warn': telemetry.timeLeft < 60 }">{{ formatTime(telemetry.timeLeft) }}</dd>
          </div>
          <div>
            <dt>Poeng</dt>
            <dd>{{ telemetry.score }}/{{ maxScore }}</dd>
          </div>
          <div class="rov__hud-extra">
            <dt>Pådrag</dt>
            <dd class="rov__bars">
              <span><i :style="barStyle(telemetry.surge)" /></span>
              <span><i :style="barStyle(telemetry.heave)" /></span>
            </dd>
          </div>
        </dl>

        <button
          type="button"
          class="rov__mute"
          :aria-label="muted ? 'Slå på lyd' : 'Slå av lyd'"
          :aria-pressed="muted"
          @mousedown.prevent
          @click="toggleMute"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9h4l5-4v14l-5-4H4z" />
            <path v-if="muted" d="M16 9l5 6M21 9l-5 6" />
            <path v-else d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
          </svg>
        </button>

        <button
          v-if="telemetry.tasks.length"
          type="button"
          class="rov__tasks-toggle"
          :aria-expanded="showTasks"
          @mousedown.prevent
          @click="showTasks = !showTasks"
        >
          <span class="rov__tasks-word">Oppgaver </span>{{ doneCount }}/{{ telemetry.tasks.length }}
        </button>

        <p v-if="telemetry.status === 'running' && nextTask && !showTasks" class="rov__next">
          Neste: {{ nextTask.label }}
        </p>

        <div v-if="showTasks" class="rov__tasks">
          <div v-for="group in groups" :key="group.name" class="rov__group">
            <h3 class="rov__group-title">{{ group.name }}</h3>
            <ul>
              <li v-for="task in group.tasks" :key="task.id" :class="{ 'rov__task--done': task.done }">
                <span class="rov__check" aria-hidden="true">{{ task.done ? '✓' : '' }}</span>
                <span class="rov__task-label">{{ task.label }}</span>
                <span class="rov__task-points">{{ task.points }}</span>
              </li>
            </ul>
          </div>
          <p class="rov__note">
            Poeng fra MATE 2022. Bonus: 1 poeng per hele minutt og 0,01 per sekund som er igjen når alt er gjort.
          </p>
        </div>

        <p
          v-if="!prompt && heaveTip && !usedHeave && telemetry.status === 'running'"
          class="rov__prompt rov__prompt--tip"
        >
          <span class="rov__hint-desktop">Tips: Q dykker ned og E går opp</span>
          <span class="rov__hint-touch">Tips: Bruk Ned og Opp for å endre dybde</span>
        </p>

        <p v-if="prompt" class="rov__prompt" :class="{ 'rov__prompt--quiet': !prompt.startsWith('Trykk') && !prompt.startsWith('Boom'), 'rov__prompt--alert': prompt.startsWith('Boom') }">
          {{ prompt }}
        </p>

        <p v-if="telemetry.status === 'running' && !active && !touched && !showTasks" class="rov__hint">
          <span class="rov__hint-desktop">Klikk for å styre · W A S D kjører · E/Q opp og ned · G griper</span>
          <span class="rov__hint-touch">Bruk knappene for å styre</span>
        </p>

        <div v-if="telemetry.status !== 'running'" class="rov__overlay">
          <template v-if="telemetry.status === 'ready'">
            <p class="rov__overlay-title">Oppgave 1 – Maritim fornybar energi</p>
            <p class="rov__overlay-text">
              Vedlikehold en havvindpark: bytt en skadet strømkabel og oppdriftsmodul, overvåk miljøet og dokk ROV-en.
              Unngå minene, hvert treff koster 30 sekunder.
              <span class="rov__hint-desktop">W A S D kjører, E og Q går opp og ned, G griper.</span>
            </p>
            <button type="button" class="rov__start" @click="start">Start oppdraget</button>
          </template>
          <template v-else>
            <p class="rov__overlay-title">{{ allDone ? 'Oppdraget er fullført!' : 'Tiden er ute' }}</p>
            <p class="rov__overlay-score">
              {{ formatPoints(telemetry.score + telemetry.bonus) }} poeng
            </p>
            <p class="rov__overlay-text">
              {{ telemetry.score }} av {{ maxScore }} oppgavepoeng<template v-if="telemetry.bonus">
                + {{ formatPoints(telemetry.bonus) }} i tidsbonus</template>
            </p>
            <button type="button" class="rov__start" @click="restart">Prøv igjen</button>
          </template>
        </div>

        <div class="rov__touch">
          <button
            v-for="button in TOUCH_BUTTONS"
            :key="button.code"
            type="button"
            class="rov__button"
            :style="{ gridArea: button.area }"
            :aria-label="button.name"
            tabindex="-1"
            @pointerdown.prevent="hold(button.code)"
            @pointerup="letGo(button.code)"
            @pointerleave="letGo(button.code)"
            @pointercancel="letGo(button.code)"
            @contextmenu.prevent
          >
            {{ button.label }}
          </button>
          <button
            type="button"
            class="rov__button rov__button--grip"
            :class="{ 'rov__button--on': telemetry.gripClosed }"
            aria-label="Grip"
            tabindex="-1"
            @pointerdown.prevent="touchGrip"
            @contextmenu.prevent
          >
            G
          </button>
        </div>
      </template>
    </div>

  </section>
</template>

<style scoped>
.rov {
  margin-top: 3rem;
}

.rov__title {
  margin-bottom: 0.6rem;
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.rov__intro {
  margin-bottom: 1rem;
  color: var(--muted);
}

.rov__intro a {
  color: var(--accent);
  border-bottom: 1px solid currentColor;
}

.rov__stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #0a3442;
  outline: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

@media (max-width: 40rem) {
  .rov__stage {
    aspect-ratio: 1 / 1.05;
  }

  .rov__hud-extra,
  .rov__overlay-text,
  .rov__tasks-word,
  .rov__next {
    display: none;
  }

  .rov__hud {
    gap: 0.75rem;
  }

  .rov__prompt {
    white-space: normal;
    width: max-content;
    max-width: calc(100% - 2rem);
    text-align: center;
  }
}

.rov__stage--active {
  border-color: var(--accent);
}

.rov__stage:focus-visible {
  box-shadow: 0 0 0 2px var(--accent);
}

.rov__viewport,
.rov__viewport :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.rov__message,
.rov__hint {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: rgb(6 12 14 / 0.6);
  color: #e6f4f6;
  font-size: 0.85rem;
  white-space: nowrap;
  pointer-events: none;
}

.rov__prompt {
  position: absolute;
  top: 7rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: #ff6b35;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
}

.rov__prompt--tip {
  background: #86d2dc;
  color: #06222a;
}

.rov__prompt--alert {
  background: #d7263d;
}

.rov__prompt--quiet {
  background: rgb(6 12 14 / 0.6);
  color: #e6f4f6;
  font-weight: 400;
}

.rov__message {
  top: 50%;
  transform: translate(-50%, -50%);
}

.rov__hint {
  bottom: 1rem;
}

.rov__hint-touch {
  display: none;
}

.rov__hud {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: rgb(6 12 14 / 0.55);
  color: #e6f4f6;
  font-family: var(--mono);
  font-size: 0.75rem;
  pointer-events: none;
}

.rov__hud dt {
  color: #86d2dc;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.rov__hud dd {
  font-variant-numeric: tabular-nums;
}

.rov__bars {
  display: flex;
  gap: 0.3rem;
  height: 1.1rem;
  align-items: stretch;
}

.rov__bars span {
  position: relative;
  width: 0.4rem;
  border-radius: 2px;
  background: rgb(255 255 255 / 0.15);
}

.rov__bars i {
  position: absolute;
  left: 0;
  right: 0;
  border-radius: 2px;
  background: #86d2dc;
}

.rov__touch {
  display: none;
}

@media (pointer: coarse) {
  .rov__hint-desktop {
    display: none;
  }

  .rov__hint-touch {
    display: inline;
  }

  .rov__touch {
    position: absolute;
    inset: auto 0.75rem 0.75rem;
    display: grid;
    grid-template-columns: repeat(3, 2.75rem) 1fr 3.5rem 3.5rem;
    grid-template-rows: repeat(2, 2.75rem);
    grid-template-areas:
      '. up . . grip rise'
      'left down right . grip dive';
    gap: 0.4rem;
  }

  .rov__hint {
    bottom: auto;
    top: 4rem;
  }
}

.rov__button {
  border: 1px solid rgb(255 255 255 / 0.25);
  border-radius: 10px;
  background: rgb(6 12 14 / 0.55);
  color: #e6f4f6;
  font: inherit;
  font-size: 0.85rem;
  touch-action: none;
}

.rov__button--grip {
  grid-area: grip;
}

.rov__button--on {
  border-color: #86d2dc;
  color: #86d2dc;
}

.rov__mute {
  position: absolute;
  z-index: 3;
  top: 0.75rem;
  right: 0.75rem;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgb(255 255 255 / 0.25);
  border-radius: 50%;
  background: rgb(6 12 14 / 0.55);
  color: #e6f4f6;
  cursor: pointer;
}

.rov__mute svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rov__warn {
  color: #ff9a6b;
}

.rov__overlay {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.5rem;
  background: rgb(6 12 14 / 0.72);
  color: #e6f4f6;
  text-align: center;
}

.rov__overlay-title {
  font-size: 1.15rem;
  font-weight: 700;
}

.rov__overlay-text {
  max-width: 28rem;
  font-size: 0.9rem;
  color: #b9d3d8;
}

.rov__overlay-score {
  font-family: var(--mono);
  font-size: 2rem;
  font-weight: 700;
  color: #86d2dc;
}

.rov__start {
  margin-top: 0.4rem;
  padding: 0.6rem 1.2rem;
  border: 0;
  border-radius: 999px;
  background: #86d2dc;
  color: #06222a;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.rov__start:hover {
  background: #a9e2ea;
}

.rov__tasks-toggle {
  position: absolute;
  z-index: 3;
  top: 0.75rem;
  right: 3.5rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid rgb(255 255 255 / 0.25);
  border-radius: 999px;
  background: rgb(6 12 14 / 0.55);
  color: #e6f4f6;
  font-family: var(--mono);
  font-size: 0.75rem;
  cursor: pointer;
}

.rov__next {
  position: absolute;
  top: 4.3rem;
  left: 0.75rem;
  max-width: 60%;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: rgb(6 12 14 / 0.45);
  color: #e6f4f6;
  font-size: 0.75rem;
  pointer-events: none;
}

.rov__tasks {
  position: absolute;
  z-index: 3;
  top: 3.5rem;
  right: 0.75rem;
  bottom: 0.75rem;
  width: min(20rem, calc(100% - 1.5rem));
  overflow-y: auto;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background: rgb(6 12 14 / 0.82);
  color: #e6f4f6;
}

.rov__group + .rov__group {
  margin-top: 0.6rem;
}

.rov__group-title {
  margin-bottom: 0.2rem;
  font-family: var(--mono);
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #86d2dc;
}

.rov__group ul {
  list-style: none;
  padding: 0;
}

.rov__group li {
  display: grid;
  grid-template-columns: 0.9rem 1fr auto;
  gap: 0.4rem;
  align-items: baseline;
  padding: 0.1rem 0;
  font-size: 0.78rem;
}

.rov__check {
  color: #86d2dc;
  font-weight: 700;
}

.rov__task-points {
  font-family: var(--mono);
  font-size: 0.7rem;
  color: #9fb8bd;
}

.rov__task--done .rov__task-label {
  color: #9fb8bd;
  text-decoration: line-through;
}

.rov__note {
  margin-top: 0.6rem;
  font-size: 0.7rem;
  color: #9fb8bd;
}

.rov__button:active {
  background: rgb(134 210 220 / 0.35);
}
</style>
