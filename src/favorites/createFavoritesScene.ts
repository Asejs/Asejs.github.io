import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { FavoriteModel } from '../data'
import { models } from './models'

interface Item {
  tile: HTMLElement
  scene: THREE.Scene
  object: THREE.Object3D
  spin: number
  tilt: THREE.Vector2
  phase: number
  lean: number
  lastX?: number
  facing: boolean
  turn: number
  lookIn: number
  bleed: number
}

const LEANS = [0.18, -0.14, 0.1, -0.2, 0.12]

export function createFavoritesScene(host: HTMLElement, canvas: HTMLCanvasElement, tiles: HTMLElement[], kinds: FavoriteModel[]) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.autoClear = false
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20)
  camera.position.set(0, 0.35, 5)
  camera.lookAt(0, 0, 0)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()

  const shadowTexture = (() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(0,0,0,0.55)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  })()

  const items: Item[] = kinds.map((kind, i) => {
    const scene = new THREE.Scene()
    scene.environment = environment
    scene.environmentIntensity = 0.9
    const key = new THREE.DirectionalLight('#fff3e0', 1.6)
    key.position.set(2, 3, 4)
    const rim = new THREE.DirectionalLight('#9fd8e2', 0.9)
    rim.position.set(-3, 1, -3)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.7),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0.45 }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -0.95
    scene.add(key, rim, shadow)
    const object = new THREE.Group()
    const model = models[kind]()
    object.add(model)
    const facing = Boolean(model.userData.facing)
    if (!facing) object.rotation.y = i * 2.1
    scene.add(object)
    return {
      tile: tiles[i],
      scene,
      object,
      spin: 0,
      tilt: new THREE.Vector2(),
      phase: i * 1.3,
      lean: LEANS[i % LEANS.length],
      facing,
      turn: 0,
      lookIn: model.userData.lookIn ?? 0,
      bleed: model.userData.bleed ?? 1,
    }
  })

  let hovered: Item | undefined
  const pointer = new THREE.Vector2()

  function itemAt(event: MouseEvent) {
    return items.find((item) => {
      const r = item.tile.getBoundingClientRect()
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) return false
      pointer.set(((event.clientX - r.left) / r.width) * 2 - 1, ((event.clientY - r.top) / r.height) * 2 - 1)
      return true
    })
  }
  function onPointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') hovered = itemAt(event)
  }
  function onPointerLeave() {
    hovered = undefined
  }
  function onClick(event: MouseEvent) {
    if ((event.target as Element).closest('a, button')) return
    const item = itemAt(event)
    if (!item) return
    let handled = false
    item.object.traverse((o) => {
      if (o.userData.onSpin?.()) handled = true
    })
    if (!handled) item.spin += Math.PI * 2
  }
  host.addEventListener('pointermove', onPointerMove)
  host.addEventListener('pointerleave', onPointerLeave)
  host.addEventListener('click', onClick)

  function resize() {
    const { width, height } = canvas.getBoundingClientRect()
    renderer.setSize(width, height, false)
  }

  const clock = new THREE.Clock()
  let elapsed = 0
  let frame = 0
  function render() {
    const delta = Math.min(clock.getDelta(), 0.05)
    elapsed += delta
    const area = canvas.getBoundingClientRect()
    renderer.setScissorTest(false)
    renderer.clear()
    renderer.setScissorTest(true)
    for (const item of items) {
      const r = item.tile.getBoundingClientRect()
      const w = r.width * item.bleed
      const h = r.height * item.bleed
      const x = r.left - area.left - (w - r.width) / 2
      const y = area.bottom - r.bottom - (h - r.height) / 2
      if (r.bottom < area.top || r.top > area.bottom) continue
      renderer.setViewport(x, y, w, h)
      renderer.setScissor(x, y, w, h)
      camera.aspect = r.width / r.height
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((Math.tan(THREE.MathUtils.degToRad(16)) * item.bleed) / Math.min(camera.aspect, 1)))
      camera.updateProjectionMatrix()

      if (!reduceMotion) {
        const moved = item.lastX === undefined ? 0 : r.left - item.lastX
        item.lastX = r.left
        const t = elapsed + item.phase
        const isHovered = item === hovered
        const spinStep = item.spin * Math.min(delta * 3, 1)
        item.spin -= spinStep
        item.tilt.lerp(isHovered ? pointer : new THREE.Vector2(), 0.08)
        item.object.position.y = Math.sin(t * 1.1) * 0.08
        if (item.facing) {
          item.turn += moved * 0.008 + spinStep
          item.turn += (Math.round(item.turn / (Math.PI * 2)) * Math.PI * 2 - item.turn) * Math.min(delta * 1.5, 1)
          item.object.rotation.y = item.turn + Math.sin(t * 0.45) * 0.5 + item.tilt.x * 0.4
        } else {
          item.object.rotation.y += moved * 0.008 + delta * (isHovered ? 0.9 : 0.35) + spinStep
        }
        item.object.rotation.x = item.lookIn + Math.sin(t * 0.7) * 0.05 + item.tilt.y * 0.35
        item.object.rotation.z = item.lean + Math.cos(t * 0.9) * 0.04 - item.tilt.x * 0.15
        item.object.traverse((o) => o.userData.update?.(t))
      } else {
        item.object.rotation.x = item.lookIn
        item.object.rotation.z = item.lean
      }
      renderer.clearDepth()
      renderer.render(item.scene, camera)
    }
  }

  function loop() {
    render()
    frame = requestAnimationFrame(loop)
  }

  let onScreen = false
  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    update()
  })
  visibility.observe(host)
  function update() {
    cancelAnimationFrame(frame)
    frame = 0
    if (onScreen && !document.hidden && !reduceMotion) {
      clock.getDelta()
      loop()
    } else render()
  }
  document.addEventListener('visibilitychange', update)
  const resizer = new ResizeObserver(() => {
    resize()
    render()
  })
  resizer.observe(canvas)
  resize()
  update()

  return {
    dispose() {
      cancelAnimationFrame(frame)
      visibility.disconnect()
      resizer.disconnect()
      document.removeEventListener('visibilitychange', update)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      host.removeEventListener('click', onClick)
      environment.dispose()
      renderer.dispose()
    },
  }
}
