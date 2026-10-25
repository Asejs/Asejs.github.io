const CHORDS = [
  { bass: 73.42, notes: [261.63, 349.23, 440, 523.25] },
  { bass: 98, notes: [246.94, 349.23, 392, 440] },
  { bass: 65.41, notes: [246.94, 329.63, 392, 493.88] },
  { bass: 110, notes: [261.63, 329.63, 392, 440] },
]
const MELODY = [523.25, 587.33, 659.25, 783.99, 880]
const BEAT = 60 / 72
const BAR_SECONDS = BEAT * 4
const SWING = BEAT * 0.08

export function createSound() {
  let context: AudioContext | undefined
  let master: GainNode | undefined
  let music: GainNode | undefined
  let echo: DelayNode | undefined
  let motor: { gain: GainNode; hum: OscillatorNode; whine: BiquadFilterNode } | undefined
  let muted = false
  let musicTimer: number | undefined
  let musicWanted = false
  let chordIndex = 0
  let nextBar = 0
  let noiseBuffer: AudioBuffer | undefined
  let crackle: AudioBufferSourceNode | undefined

  function ensure() {
    if (!context) {
      context = new AudioContext()
      master = context.createGain()
      master.gain.value = muted ? 0 : 0.7
      master.connect(context.destination)
      music = context.createGain()
      music.gain.value = 0.09
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1400
      music.connect(filter)
      filter.connect(master)
      echo = context.createDelay()
      echo.delayTime.value = 0.42
      const feedback = context.createGain()
      feedback.gain.value = 0.38
      echo.connect(feedback)
      feedback.connect(echo)
      echo.connect(music)
    }
    if (context.state === 'suspended') context.resume()
    return context
  }

  function tone(frequency: number, delay: number, duration: number, volume: number, type: OscillatorType = 'sine') {
    const ctx = ensure()
    const start = ctx.currentTime + delay
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(master!)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.05)
  }

  function noise(ctx: AudioContext) {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    return source
  }

  function envelope(ctx: AudioContext, when: number, peak: number, decay: number) {
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(peak, when + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + decay)
    gain.connect(music!)
    return gain
  }

  function keys(ctx: AudioContext, frequencies: number[], when: number, volume: number) {
    for (const frequency of frequencies) {
      const oscillator = ctx.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      const tremolo = ctx.createOscillator()
      tremolo.frequency.value = 4.5
      const depth = ctx.createGain()
      depth.gain.value = volume * 0.25
      const gain = envelope(ctx, when, volume, BAR_SECONDS * 0.9)
      tremolo.connect(depth)
      depth.connect(gain.gain)
      oscillator.connect(gain)
      oscillator.start(when)
      tremolo.start(when)
      oscillator.stop(when + BAR_SECONDS)
      tremolo.stop(when + BAR_SECONDS)
    }
  }

  function bass(ctx: AudioContext, frequency: number, when: number) {
    const oscillator = ctx.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    oscillator.connect(envelope(ctx, when, 0.9, BEAT * 1.4))
    oscillator.start(when)
    oscillator.stop(when + BEAT * 1.5)
  }

  function kick(ctx: AudioContext, when: number) {
    const oscillator = ctx.createOscillator()
    oscillator.frequency.setValueAtTime(110, when)
    oscillator.frequency.exponentialRampToValueAtTime(42, when + 0.14)
    oscillator.connect(envelope(ctx, when, 1.1, 0.35))
    oscillator.start(when)
    oscillator.stop(when + 0.4)
  }

  function hit(ctx: AudioContext, when: number, type: BiquadFilterType, frequency: number, volume: number, decay: number) {
    const source = noise(ctx)
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    source.connect(filter)
    filter.connect(envelope(ctx, when, volume, decay))
    source.start(when, Math.random())
    source.stop(when + decay + 0.05)
  }

  function startCrackle(ctx: AudioContext) {
    if (crackle) return
    crackle = noise(ctx)
    crackle.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 3000
    const gain = ctx.createGain()
    gain.gain.value = 0.05
    crackle.connect(filter)
    filter.connect(gain)
    gain.connect(music!)
    crackle.start()
  }

  function stopCrackle() {
    crackle?.stop()
    crackle = undefined
  }

  function playChord() {
    const ctx = ensure()
    startCrackle(ctx)
    const start = Math.max(nextBar, ctx.currentTime + 0.05)
    nextBar = start + BAR_SECONDS
    const chord = CHORDS[chordIndex % CHORDS.length]
    const beat = (n: number) => start + n * BEAT
    keys(ctx, chord.notes, beat(0), 0.16)
    keys(ctx, chord.notes, beat(2.5) + SWING, 0.08)
    bass(ctx, chord.bass, beat(0))
    bass(ctx, chord.bass, beat(2.5) + SWING)
    kick(ctx, beat(0))
    kick(ctx, beat(1.5) + SWING)
    kick(ctx, beat(2.5) + SWING)
    hit(ctx, beat(1), 'bandpass', 1800, 0.5, 0.18)
    hit(ctx, beat(3), 'bandpass', 1800, 0.5, 0.18)
    for (let i = 0; i < 8; i++) hit(ctx, beat(i / 2) + (i % 2 ? SWING : 0), 'highpass', 7000, i % 2 ? 0.12 : 0.2, 0.05)
    if (Math.random() < 0.6) {
      const when = beat(Math.floor(Math.random() * 3) + 0.5) + SWING
      const oscillator = ctx.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = MELODY[Math.floor(Math.random() * MELODY.length)]
      const gain = envelope(ctx, when, 0.14, 1.4)
      gain.connect(echo!)
      oscillator.connect(gain)
      oscillator.start(when)
      oscillator.stop(when + 1.5)
    }
    chordIndex++
  }

  function createMotor(ctx: AudioContext) {
    const source = noise(ctx)
    source.loop = true
    const whine = ctx.createBiquadFilter()
    whine.type = 'lowpass'
    whine.frequency.value = 250
    whine.Q.value = 0.7
    const hum = ctx.createOscillator()
    hum.type = 'sine'
    hum.frequency.value = 55
    const humFilter = ctx.createBiquadFilter()
    humFilter.type = 'lowpass'
    humFilter.frequency.value = 200
    const humGain = ctx.createGain()
    humGain.gain.value = 0.25
    const gain = ctx.createGain()
    gain.gain.value = 0
    source.connect(whine)
    whine.connect(gain)
    hum.connect(humFilter)
    humFilter.connect(humGain)
    humGain.connect(gain)
    gain.connect(master!)
    source.start()
    hum.start()
    return { gain, hum, whine }
  }

  function startLoop() {
    if (musicTimer !== undefined) return
    playChord()
    musicTimer = window.setInterval(playChord, BAR_SECONDS * 1000)
  }

  function stopLoop() {
    window.clearInterval(musicTimer)
    musicTimer = undefined
    nextBar = 0
    stopCrackle()
  }

  return {
    get muted() {
      return muted
    },
    setMuted(value: boolean) {
      muted = value
      if (master && context) master.gain.setTargetAtTime(value ? 0 : 0.7, context.currentTime, 0.05)
    },
    score() {
      tone(1318.5, 0, 0.35, 0.18)
      tone(1975.5, 0.09, 0.5, 0.15)
    },
    thrust(level: number) {
      if (!context && level === 0) return
      const ctx = ensure()
      motor ??= createMotor(ctx)
      const now = ctx.currentTime
      motor.gain.gain.setTargetAtTime(level * 0.07, now, 0.35)
      motor.hum.frequency.setTargetAtTime(50 + level * 20, now, 0.5)
      motor.whine.frequency.setTargetAtTime(220 + level * 260, now, 0.5)
    },
    timeUp() {
      ;[392, 329.63, 261.63].forEach((frequency, index) => tone(frequency, index * 0.32, 0.7, 0.16, 'triangle'))
      tone(130.81, 0.96, 1.6, 0.18, 'triangle')
    },
    explosion() {
      const ctx = ensure()
      const now = ctx.currentTime
      const bus = ctx.createDynamicsCompressor()
      bus.threshold.value = -18
      bus.ratio.value = 6
      const drive = ctx.createWaveShaper()
      const curve = new Float32Array(256)
      for (let i = 0; i < curve.length; i++) {
        const x = (i / 128) - 1
        curve[i] = Math.tanh(x * 3)
      }
      drive.curve = curve
      const out = ctx.createGain()
      out.gain.value = 1.1
      drive.connect(bus)
      bus.connect(out)
      out.connect(master!)

      const layer = (type: BiquadFilterType, from: number, to: number, peak: number, attack: number, decay: number) => {
        const source = noise(ctx)
        source.loop = true
        const filter = ctx.createBiquadFilter()
        filter.type = type
        filter.frequency.setValueAtTime(from, now)
        filter.frequency.exponentialRampToValueAtTime(to, now + decay)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(peak, now + attack)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(drive)
        source.start(now)
        source.stop(now + decay + 0.1)
      }
      layer('highpass', 2500, 1200, 0.5, 0.002, 0.08)
      layer('lowpass', 2200, 120, 1, 0.01, 1.4)
      layer('lowpass', 260, 60, 0.9, 0.05, 3.2)

      const thump = ctx.createOscillator()
      thump.frequency.setValueAtTime(95, now)
      thump.frequency.exponentialRampToValueAtTime(30, now + 1.1)
      const thumpGain = ctx.createGain()
      thumpGain.gain.setValueAtTime(0, now)
      thumpGain.gain.linearRampToValueAtTime(1.2, now + 0.01)
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)
      thump.connect(thumpGain)
      thumpGain.connect(drive)
      thump.start(now)
      thump.stop(now + 1.6)

      for (let i = 0; i < 9; i++) {
        const when = now + 0.35 + Math.random() * 1.6
        const bubble = ctx.createOscillator()
        const base = 180 + Math.random() * 320
        bubble.frequency.setValueAtTime(base, when)
        bubble.frequency.exponentialRampToValueAtTime(base * 2.2, when + 0.09)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, when)
        gain.gain.linearRampToValueAtTime(0.08, when + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.12)
        bubble.connect(gain)
        gain.connect(master!)
        bubble.start(when)
        bubble.stop(when + 0.15)
      }
    },
    grip() {
      tone(180, 0, 0.08, 0.12, 'triangle')
    },
    finish() {
      ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(frequency, index * 0.14, 0.6, 0.16, 'triangle'))
    },
    startMusic() {
      musicWanted = true
      startLoop()
    },
    stopMusic() {
      musicWanted = false
      stopLoop()
    },
    suspend() {
      stopLoop()
      context?.suspend()
    },
    resume() {
      if (!context) return
      if (context.state === 'suspended') context.resume()
      if (musicWanted) startLoop()
    },
    dispose() {
      window.clearInterval(musicTimer)
      context?.close()
    },
  }
}
