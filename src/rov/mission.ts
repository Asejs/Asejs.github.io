import * as THREE from 'three'
import { FLOOR_Y, SURFACE_Y } from './pool'

export type MissionStatus = 'ready' | 'running' | 'finished'

export interface MissionTask {
  id: string
  group: string
  label: string
  points: number
  done: boolean
}

export interface MissionSnapshot {
  status: MissionStatus
  timeLeft: number
  score: number
  bonus: number
  tasks: MissionTask[]
  prompt: string
  explosions: number
}

export const MISSION_DURATION = 15 * 60

const REACH = 0.5
const PULL_DISTANCE = 0.3
const ZONE = new THREE.Vector3(5.6, SURFACE_Y, -2)
const ZONE_RADIUS = 1.3
const LISTEN_SECONDS = 30
const GRIP_CENTER = new THREE.Vector3()

const TASKS: [string, string, string, number][] = [
  ['inspect', 'Strømkabel', 'Inspiser den skadde kabeldelen', 5],
  ['pinLeft', 'Strømkabel', 'Dra ut venstre låsepinne', 5],
  ['pinRight', 'Strømkabel', 'Dra ut høyre låsepinne', 5],
  ['cableUp', 'Strømkabel', 'Frakt den skadde kabeldelen til overflaten', 5],
  ['cableNew', 'Strømkabel', 'Monter ny kabeldel', 10],
  ['moduleTurn', 'Oppdriftsmodul', 'Vri festet 180° og løsne modulen', 5],
  ['moduleUp', 'Oppdriftsmodul', 'Frakt den skadde modulen til bassengkanten', 5],
  ['moduleNew', 'Oppdriftsmodul', 'Plasser ny oppdriftsmodul på kabelen', 5],
  ['moduleFasten', 'Oppdriftsmodul', 'Fest modulen med borrelås', 5],
  ['hydroPlace', 'Miljøovervåking', 'Plasser hydrofonen i det oransje feltet', 5],
  ['hydroUp', 'Miljøovervåking', 'Hent hydrofonen til bassengkanten', 5],
  ['netPin', 'Miljøovervåking', 'Dra ut låsepinnen på fiskegarnet', 10],
  ['netUp', 'Miljøovervåking', 'Frakt fiskegarnet til bassengkanten', 10],
  ['dock', 'Dokking', 'Kjør inn i dokkingstasjonen', 5],
]

interface Item {
  object: THREE.Object3D
  materials: THREE.MeshStandardMaterial[]
  grabbable(): boolean
  hint(): string
  holdHint: string
  anchor?: THREE.Vector3
  onGrab?(): 'hold' | 'action'
  onPulled?(): void
  onRelease?(position: THREE.Vector3): boolean
  restY: number
  sinks: boolean
  falling: boolean
  rising: boolean
}

const PVC = '#f2f1ea'
const ORANGE = '#ff6b2c'

function material(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, emissive: color, emissiveIntensity: 0 })
}

function pipeX(length: number, color = PVC, radius = 0.045) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 16), material(color))
  mesh.rotation.z = Math.PI / 2
  return mesh
}

function pipeZ(length: number, color = PVC, radius = 0.045) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 16), material(color))
  mesh.rotation.x = Math.PI / 2
  return mesh
}

function pipeY(length: number, color = PVC, radius = 0.045) {
  return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 16), material(color))
}

function collectMaterials(object: THREE.Object3D) {
  const materials: THREE.MeshStandardMaterial[] = []
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) materials.push(child.material)
  })
  return materials
}

function createPin() {
  const pin = new THREE.Group()
  const shaft = pipeY(0.32, ORANGE, 0.028)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 20), material(ORANGE))
  ring.position.y = 0.2
  pin.add(shaft, ring)
  return pin
}

function inZone(position: THREE.Vector3) {
  return Math.hypot(position.x - ZONE.x, position.z - ZONE.z) < ZONE_RADIUS && position.y > SURFACE_Y - 1.3
}

function near(position: THREE.Vector3, x: number, z: number, radius: number, maxY = FLOOR_Y + 1) {
  return Math.hypot(position.x - x, position.z - z) < radius && position.y < maxY
}

export function createMission(scene: THREE.Scene, gripPoint: THREE.Object3D, rov: THREE.Object3D) {
  const tasks: MissionTask[] = TASKS.map(([id, group, label, points]) => ({ id, group, label, points, done: false }))
  const items: Item[] = []
  let status: MissionStatus = 'ready'
  let timeLeft = MISSION_DURATION
  let bonus = 0
  let gripClosed = false
  let held: Item | undefined
  let pulling: Item | undefined
  let reachable: Item | undefined
  let actionTimer = 0
  let inspectTimer = 0
  let dockTimer = 0
  let listenTimer = 0
  let progress = ''
  let notice = ''
  let noticeTimer = 0
  let explosions = 0
  const gripWorld = new THREE.Vector3()
  const scratch = new THREE.Vector3()

  const isDone = (id: string) => tasks.find((task) => task.id === id)!.done

  function complete(id: string) {
    const task = tasks.find((candidate) => candidate.id === id)!
    if (task.done || status !== 'running') return
    task.done = true
    if (tasks.every((candidate) => candidate.done)) finish()
  }

  function finish() {
    status = 'finished'
    const seconds = Math.max(0, Math.floor(timeLeft))
    bonus = tasks.every((task) => task.done) ? Math.floor(seconds / 60) + (seconds % 60) * 0.01 : 0
  }

  function addItem(partial: Partial<Item> & Pick<Item, 'object'>) {
    const item: Item = {
      materials: collectMaterials(partial.object),
      grabbable: () => true,
      hint: () => 'Trykk G for å gripe',
      holdHint: 'Trykk G for å slippe',
      restY: partial.object.position.y,
      sinks: true,
      falling: false,
      rising: false,
      ...partial,
    }
    scene.add(item.object)
    items.push(item)
    return item
  }

  function hide(item: Item) {
    item.object.visible = false
    item.grabbable = () => false
  }

  const zoneRing = new THREE.Mesh(
    new THREE.TorusGeometry(ZONE_RADIUS, 0.04, 8, 64),
    new THREE.MeshStandardMaterial({ color: '#ffd400', emissive: '#ffd400', emissiveIntensity: 0.6 }),
  )
  zoneRing.rotation.x = Math.PI / 2
  zoneRing.position.set(ZONE.x, SURFACE_Y - 0.06, ZONE.z)
  scene.add(zoneRing)

  const toZone = 'Kjør opp til den gule ringen ved stigen og trykk G'

  const cableZ = -5
  const cableY = FLOOR_Y + 0.06
  const gapX = -3.4
  const cable = new THREE.Group()
  const leftPipe = pipeX(2.05)
  leftPipe.position.set(-4.95, cableY, cableZ)
  const rightPipe = pipeX(2.05)
  rightPipe.position.set(-1.85, cableY, cableZ)
  cable.add(leftPipe, rightPipe)
  for (const x of [-3.92, -2.88]) {
    const coupling = pipeX(0.12, PVC, 0.062)
    coupling.position.set(x, cableY, cableZ)
    cable.add(coupling)
  }
  scene.add(cable)

  let pinsOut = 0
  const pinItems: Item[] = []
  for (const [x, id] of [
    [-3.92, 'pinLeft'],
    [-2.88, 'pinRight'],
  ] as const) {
    const pin = createPin()
    pin.position.set(x, cableY + 0.12, cableZ)
    const item: Item = addItem({
      object: pin,
      anchor: pin.position.clone(),
      grabbable: () => Boolean(item.anchor),
      hint: () => 'Trykk G for å gripe låsepinnen',
      holdHint: 'Slipp pinnen hvor som helst med G',
      restY: FLOOR_Y + 0.03,
      onPulled() {
        pinsOut++
        complete(id)
      },
    })
    pinItems.push(item)
  }

  const damaged = new THREE.Group()
  const damagedPipe = pipeX(0.9)
  const damage = pipeX(0.28, '#6b3b1f', 0.05)
  damaged.add(damagedPipe, damage)
  damaged.position.set(gapX, cableY, cableZ)
  let damagedInPlace = true
  const damagedItem: Item = addItem({
    object: damaged,
    grabbable: () => pinsOut === 2 && !isDone('cableUp'),
    hint: () => 'Trykk G for å gripe den skadde kabeldelen',
    holdHint: toZone,
    restY: FLOOR_Y + 0.05,
    onGrab() {
      damagedInPlace = false
      return 'hold'
    },
    onRelease(position) {
      if (!inZone(position)) return false
      complete('cableUp')
      hide(damagedItem)
      return true
    },
  })

  const replacement = new THREE.Group()
  replacement.add(pipeX(0.9))
  for (const x of [-0.42, 0.42]) {
    const tape = pipeX(0.06, '#ffd400', 0.048)
    tape.position.x = x
    replacement.add(tape)
  }
  replacement.position.set(gapX, FLOOR_Y + 0.05, -3.6)
  const replacementItem: Item = addItem({
    object: replacement,
    grabbable: () => !isDone('cableNew'),
    hint: () => 'Trykk G for å gripe den nye kabeldelen',
    holdHint: 'Senk den nye kabeldelen ned i gapet på kabelen og trykk G',
    restY: FLOOR_Y + 0.05,
    onRelease(position) {
      if (damagedInPlace || !near(position, gapX, cableZ, 0.6)) return false
      replacement.position.set(gapX, cableY, cableZ)
      replacement.rotation.set(0, 0, 0)
      replacementItem.grabbable = () => false
      complete('cableNew')
      return true
    },
  })

  const moduleZ = -9
  const moduleX = 3.5
  const moduleCable = pipeX(5.5)
  moduleCable.position.set(3.75, cableY, moduleZ)
  scene.add(moduleCable)

  const oldModule = new THREE.Group()
  oldModule.add(pipeX(0.36, '#262a2e', 0.14))
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.16), material('#ffd400'))
  latch.position.y = 0.15
  oldModule.add(latch)
  oldModule.position.set(moduleX, cableY, moduleZ)
  let moduleOnCable = true
  let latchTurn = 0
  const oldModuleItem: Item = addItem({
    object: oldModule,
    grabbable: () => !isDone('moduleUp'),
    hint: () => (isDone('moduleTurn') ? 'Trykk G for å gripe modulen' : 'Trykk G for å vri festet og løsne modulen'),
    holdHint: toZone,
    restY: FLOOR_Y + 0.14,
    onGrab() {
      if (!isDone('moduleTurn')) {
        latchTurn = Math.PI
        complete('moduleTurn')
      }
      moduleOnCable = false
      return 'hold'
    },
    onRelease(position) {
      if (!inZone(position)) return false
      complete('moduleUp')
      hide(oldModuleItem)
      return true
    },
  })

  const newModule = new THREE.Group()
  newModule.add(pipeX(0.36, '#ffb000', 0.14))
  const strap = pipeX(0.07, '#111111', 0.146)
  strap.visible = false
  newModule.add(strap)
  newModule.position.set(5, FLOOR_Y + 0.14, -7.6)
  let newModuleMounted = false
  const newModuleItem: Item = addItem({
    object: newModule,
    grabbable: () => !isDone('moduleFasten'),
    hint: () => (newModuleMounted ? 'Trykk G for å feste borrelåsen' : 'Trykk G for å gripe den nye modulen'),
    holdHint: 'Plasser modulen på kabelen der den gamle satt, og trykk G',
    restY: FLOOR_Y + 0.14,
    onGrab() {
      if (!newModuleMounted) return 'hold'
      strap.visible = true
      complete('moduleFasten')
      return 'action'
    },
    onRelease(position) {
      if (moduleOnCable || !near(position, moduleX, moduleZ, 0.6)) return false
      newModule.position.set(moduleX, cableY, moduleZ)
      newModule.rotation.set(0, 0, 0)
      newModuleMounted = true
      newModuleItem.sinks = false
      complete('moduleNew')
      return true
    },
  })

  const squareX = -5.5
  const squareZ = -11
  for (const [dx, dz, alongX] of [
    [0, -0.25, true],
    [0, 0.25, true],
    [-0.25, 0, false],
    [0.25, 0, false],
  ] as const) {
    const side = alongX ? pipeX(0.54, ORANGE, 0.03) : pipeZ(0.54, ORANGE, 0.03)
    side.position.set(squareX + dx, FLOOR_Y + 0.03, squareZ + dz)
    scene.add(side)
  }

  const hydrophone = new THREE.Group()
  const body = pipeY(0.24, '#59636b', 0.05)
  const cap = pipeY(0.05, ORANGE, 0.055)
  cap.position.y = 0.13
  hydrophone.add(body, cap)
  hydrophone.position.set(-5, FLOOR_Y + 0.12, -8)
  let hydrophonePlaced = false
  const hydrophoneItem: Item = addItem({
    object: hydrophone,
    grabbable: () => !isDone('hydroUp') && (!hydrophonePlaced || listenTimer <= 0),
    hint: () => (hydrophonePlaced ? 'Trykk G for å hente hydrofonen' : 'Trykk G for å gripe hydrofonen'),
    holdHint: 'Sett hydrofonen ned i det oransje feltet og trykk G',
    restY: FLOOR_Y + 0.12,
    onGrab() {
      if (hydrophonePlaced) hydrophoneItem.holdHint = toZone
      return 'hold'
    },
    onRelease(position) {
      if (hydrophonePlaced) {
        if (!inZone(position)) return false
        complete('hydroUp')
        hide(hydrophoneItem)
        return true
      }
      if (Math.abs(position.x - squareX) > 0.3 || Math.abs(position.z - squareZ) > 0.3 || position.y > FLOOR_Y + 1) return false
      hydrophone.position.set(squareX, FLOOR_Y + 0.12, squareZ)
      hydrophone.rotation.set(0, 0, 0)
      hydrophonePlaced = true
      listenTimer = LISTEN_SECONDS
      complete('hydroPlace')
      return true
    },
  })

  const footX = 2.5
  const footZ = -1.5
  const foundation = new THREE.Group()
  const leg = pipeY(SURFACE_Y - FLOOR_Y + 0.4, PVC, 0.07)
  leg.position.set(footX, (SURFACE_Y + FLOOR_Y) / 2 + 0.2, footZ)
  foundation.add(leg)
  for (const angle of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
    const brace = pipeY(1.1, PVC, 0.04)
    brace.position.set(footX + Math.cos(angle) * 0.35, FLOOR_Y + 0.45, footZ + Math.sin(angle) * 0.35)
    brace.rotation.set(Math.sin(angle) * 0.6, 0, -Math.cos(angle) * 0.6)
    foundation.add(brace)
  }
  scene.add(foundation)

  const net = new THREE.Group()
  const netWidth = 0.9
  const netDepth = 0.6
  for (const dz of [-netDepth / 2, netDepth / 2]) {
    const side = pipeX(netWidth, PVC, 0.03)
    side.position.z = dz
    net.add(side)
  }
  for (const dx of [-netWidth / 2, netWidth / 2]) {
    const side = pipeZ(netDepth, PVC, 0.03)
    side.position.x = dx
    net.add(side)
  }
  const mesh = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.PlaneGeometry(netWidth, netDepth, 9, 6).rotateX(-Math.PI / 2)),
    new THREE.LineBasicMaterial({ color: '#2c4a3a' }),
  )
  net.add(mesh)
  net.position.set(footX + 0.75, FLOOR_Y + 0.4, footZ)
  const netItem: Item = addItem({
    object: net,
    grabbable: () => isDone('netPin') && !netItem.rising && !isDone('netUp'),
    hint: () => 'Trykk G for å gripe fiskegarnet',
    holdHint: toZone,
    sinks: false,
    onRelease(position) {
      if (inZone(position)) {
        complete('netUp')
        hide(netItem)
        return true
      }
      netItem.rising = true
      return true
    },
  })

  const netPin = createPin()
  netPin.position.set(footX + 0.25, FLOOR_Y + 0.5, footZ)
  const netPinItem: Item = addItem({
    object: netPin,
    anchor: netPin.position.clone(),
    grabbable: () => Boolean(netPinItem.anchor),
    hint: () => 'Trykk G for å gripe låsepinnen på garnet',
    holdHint: 'Slipp pinnen hvor som helst med G',
    restY: FLOOR_Y + 0.03,
    onPulled() {
      netItem.rising = true
      complete('netPin')
    },
  })

  const dockZ = -14.2
  const dock = new THREE.Group()
  for (const y of [0.08, 0.7]) {
    const back = pipeX(1.3)
    back.position.set(0, FLOOR_Y + y, dockZ - 0.6)
    dock.add(back)
    for (const x of [-0.65, 0.65]) {
      const side = pipeZ(1.2)
      side.position.set(x, FLOOR_Y + y, dockZ)
      dock.add(side)
    }
  }
  for (const [x, z] of [
    [-0.65, dockZ - 0.6],
    [0.65, dockZ - 0.6],
    [-0.65, dockZ + 0.6],
    [0.65, dockZ + 0.6],
  ]) {
    const post = pipeY(0.62)
    post.position.set(x, FLOOR_Y + 0.39, z)
    dock.add(post)
  }
  scene.add(dock)

  function findReachable() {
    gripPoint.getWorldPosition(gripWorld)
    let nearest: Item | undefined
    let nearestDistance = REACH
    for (const item of items) {
      if (item === held || !item.object.visible || !item.grabbable()) continue
      item.object.getWorldPosition(scratch)
      const horizontal = Math.hypot(scratch.x - gripWorld.x, scratch.z - gripWorld.z)
      const distance = horizontal + Math.max(0, Math.abs(scratch.y - gripWorld.y) - 0.35)
      if (distance < nearestDistance) {
        nearest = item
        nearestDistance = distance
      }
    }
    return nearest
  }

  function attach(item: Item) {
    held = item
    item.falling = false
    item.rising = false
    gripPoint.attach(item.object)
  }

  function release() {
    if (!held) return
    const item = held
    held = undefined
    scene.attach(item.object)
    item.object.getWorldPosition(scratch)
    const handled = item.onRelease?.(scratch) ?? false
    if (handled) return
    item.object.rotation.set(0, item.object.rotation.y, 0)
    if (item.sinks) item.falling = true
  }

  function toggleGrip() {
    if (held) {
      release()
      gripClosed = false
      return
    }
    if (pulling || gripClosed) {
      pulling = undefined
      gripClosed = false
      return
    }
    gripClosed = true
    const item = findReachable()
    if (!item) return
    const mode = item.onGrab?.() ?? 'hold'
    if (mode === 'action') {
      actionTimer = 0.5
      return
    }
    if (item.anchor) pulling = item
    else attach(item)
  }

  function hitMine() {
    pulling = undefined
    explosions++
    if (status === 'running') timeLeft = Math.max(0, timeLeft - 30)
    notice = status === 'running' ? 'Boom! Du traff en mine. −30 sekunder' : 'Boom! Du traff en mine'
    noticeTimer = 2.5
  }

  function setHighlight(next: Item | undefined) {
    if (next === reachable) return
    reachable?.materials.forEach((m) => (m.emissiveIntensity = 0))
    next?.materials.forEach((m) => (m.emissiveIntensity = 0.45))
    reachable = next
  }

  function update(dt: number) {
    if (status === 'running') {
      timeLeft = Math.max(0, timeLeft - dt)
      if (timeLeft === 0) finish()
    }

    gripPoint.getWorldPosition(gripWorld)
    if (held) held.object.position.lerp(GRIP_CENTER, Math.min(1, dt * 8))

    if (pulling?.anchor && gripWorld.distanceTo(pulling.anchor) > PULL_DISTANCE) {
      const item = pulling
      pulling = undefined
      item.anchor = undefined
      item.onPulled?.()
      attach(item)
    }

    if (noticeTimer > 0) noticeTimer -= dt

    if (actionTimer > 0) {
      actionTimer -= dt
      if (actionTimer <= 0) gripClosed = false
    }

    if (latchTurn > 0) {
      const step = Math.min(latchTurn, dt * 4)
      latch.rotation.x += step
      latchTurn -= step
    }

    for (const item of items) {
      const { position } = item.object
      if (item.falling) {
        position.y = Math.max(item.restY, position.y - dt * 0.8)
        if (position.y === item.restY) item.falling = false
      }
      if (item.rising) {
        position.y = Math.min(SURFACE_Y - 0.12, position.y + dt * 0.5)
        if (position.y === SURFACE_Y - 0.12) item.rising = false
      }
    }

    if (hydrophonePlaced && listenTimer > 0) listenTimer = Math.max(0, listenTimer - dt)

    progress = ''
    if (!isDone('inspect') && gripWorld.distanceTo(scratch.set(gapX, cableY, cableZ)) < 1) {
      inspectTimer += dt
      progress = 'Inspiserer kabelen …'
      if (inspectTimer > 1.5 && status === 'running') complete('inspect')
    } else {
      inspectTimer = 0
    }

    const speed = Math.hypot(rov.position.x - lastRov.x, rov.position.z - lastRov.z) / Math.max(dt, 0.001)
    lastRov.copy(rov.position)
    const docked =
      Math.abs(rov.position.x) < 0.45 &&
      rov.position.z < dockZ + 0.4 &&
      rov.position.y < FLOOR_Y + 0.9
    if (!isDone('dock') && docked && speed < 0.4) {
      dockTimer += dt
      progress = 'Dokker …'
      if (dockTimer > 1 && status === 'running') complete('dock')
    } else {
      dockTimer = 0
    }

    setHighlight(gripClosed || held ? undefined : findReachable())
  }
  const lastRov = rov.position.clone()

  const target = new THREE.Vector3()
  const zoneTarget = new THREE.Vector3(ZONE.x, SURFACE_Y - 0.5, ZONE.z)
  const steps: [string, () => Item | THREE.Vector3 | undefined][] = [
    ['inspect', () => target.set(gapX, cableY, cableZ)],
    ['pinLeft', () => pinItems[0]],
    ['pinRight', () => pinItems[1]],
    ['cableUp', () => damagedItem],
    ['cableNew', () => replacementItem],
    ['moduleTurn', () => oldModuleItem],
    ['moduleUp', () => oldModuleItem],
    ['moduleNew', () => newModuleItem],
    ['moduleFasten', () => newModuleItem],
    ['hydroPlace', () => hydrophoneItem],
    ['hydroUp', () => (listenTimer > 0 ? undefined : hydrophoneItem)],
    ['netPin', () => netPinItem],
    ['netUp', () => (netItem.rising ? undefined : netItem)],
    ['dock', () => target.set(0, FLOOR_Y + 0.05, dockZ)],
  ]

  function destination(): THREE.Vector3 | undefined {
    if (status !== 'running' || pulling) return undefined
    if (held) {
      if (held === replacementItem) return target.set(gapX, cableY, cableZ)
      if (held === newModuleItem) return target.set(moduleX, cableY, moduleZ)
      if (held === hydrophoneItem && !hydrophonePlaced) return target.set(squareX, FLOOR_Y + 0.03, squareZ)
      if ([damagedItem, oldModuleItem, netItem, hydrophoneItem].includes(held)) return zoneTarget
      return undefined
    }
    for (const [id, get] of steps) {
      if (isDone(id)) continue
      const result = get()
      if (result) return result instanceof THREE.Vector3 ? result : result.object.position
    }
    return undefined
  }

  function prompt() {
    if (noticeTimer > 0) return notice
    if (status === 'ready') return ''
    if (pulling) return 'Rygg bakover for å dra ut pinnen'
    if (held) return held.holdHint
    if (progress) return progress
    if (reachable) return reachable.hint()
    if (hydrophonePlaced && listenTimer > 0) return `Hydrofonen lytter … ${Math.ceil(listenTimer)} s`
    return ''
  }

  return {
    get running() {
      return status === 'running'
    },
    get gripClosed() {
      return gripClosed || Boolean(held) || Boolean(pulling)
    },
    toggleGrip,
    update,
    destination,
    hitMine,
    start() {
      status = 'running'
      timeLeft = MISSION_DURATION
    },
    snapshot(): MissionSnapshot {
      return {
        status,
        timeLeft,
        score: tasks.reduce((sum, task) => sum + (task.done ? task.points : 0), 0),
        bonus,
        tasks: tasks.map((task) => ({ ...task })),
        prompt: prompt(),
        explosions,
      }
    },
  }
}
