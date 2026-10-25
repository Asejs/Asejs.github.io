import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { createMines } from './mines'
import { createMission, type MissionSnapshot } from './mission'
import { createBubbles, createPool, FLOOR_Y, POOL, SURFACE_Y } from './pool'

export interface RovInput {
  surge: number
  yaw: number
  heave: number
}

export interface RovTelemetry extends MissionSnapshot {
  depth: number
  heading: number
  surge: number
  heave: number
  gripClosed: boolean
}

export interface RovScene {
  input: RovInput
  toggleGrip(): void
  startMission(): void
  start(): void
  stop(): void
  dispose(): void
}

const WATER = new THREE.Color('#1d7a90')
const WALL_MARGIN = 0.55
const METERS_PER_UNIT = 0.83

function createGuide() {
  const glow = { color: '#ffd400', transparent: true, fog: false }
  const beacon = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 8, 48), new THREE.MeshBasicMaterial({ ...glow, opacity: 0.95 }))
  ring.rotation.x = Math.PI / 2
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.45, 1, 24, 1, true).translate(0, 0.5, 0),
    new THREE.MeshBasicMaterial({ ...glow, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  )
  beacon.add(ring, beam)

  return { beacon, ring, beam }
}

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

async function loadRov(url: string) {
  const materials: Record<string, THREE.Material> = {
    frame: new THREE.MeshStandardMaterial({ color: '#16181b', roughness: 0.6, flatShading: true }),
    thrusters: new THREE.MeshStandardMaterial({ color: '#4a525a', roughness: 0.45, metalness: 0.3 }),
    housing: new THREE.MeshStandardMaterial({ color: '#bfe6f0', roughness: 0.1, transparent: true, opacity: 0.35 }),
    parts: new THREE.MeshStandardMaterial({ color: '#8b959b', roughness: 0.5, metalness: 0.4, flatShading: true }),
  }
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.loadAsync(url)
  gltf.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.computeVertexNormals()
    object.material = materials[object.name] ?? materials.parts
  })
  return gltf.scene
}

export async function createRovScene(
  container: HTMLElement,
  modelUrl: string,
  onTelemetry: (telemetry: RovTelemetry) => void,
): Promise<RovScene> {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = WATER
  scene.fog = new THREE.FogExp2(WATER, 0.05)

  scene.add(new THREE.HemisphereLight('#d6f5ff', '#2b7486', 2))
  const sun = new THREE.DirectionalLight('#ffffff', 1.6)
  sun.position.set(3, 20, 4)
  scene.add(sun)

  const random = seededRandom(56)
  const pool = createPool(random)
  scene.add(pool.group)
  const bubbles = createBubbles(random)
  scene.add(bubbles)

  const rov = new THREE.Group()
  const model = await loadRov(modelUrl)
  rov.add(model)
  for (const side of [-1, 1]) {
    const lamp = new THREE.SpotLight('#fff6d8', 6, 14, Math.PI / 7, 0.5, 1.5)
    lamp.position.set(side * 0.18, 0.05, -0.45)
    lamp.target.position.set(side * 0.3, -0.6, -6)
    rov.add(lamp, lamp.target)
  }
  rov.position.set(0, 0.4, 4)
  scene.add(rov)

  const jawRight = model.getObjectByName('jawRight')
  const jawLeft = model.getObjectByName('jawLeft')
  const gripPoint = new THREE.Object3D()
  gripPoint.position.set(0, -0.153, -0.47)
  rov.add(gripPoint)

  const mission = createMission(scene, gripPoint, rov)
  let jawOpen = 1
  const guide = createGuide()
  scene.add(guide.beacon)
  const mines = createMines(scene)
  let stunTimer = 0
  let shake = 0
  const knock = new THREE.Vector3()

  const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 120)
  const cameraOffset = new THREE.Vector3(0.55, 0.45, 1.6)
  camera.position.copy(rov.position).add(cameraOffset)

  const input: RovInput = { surge: 0, yaw: 0, heave: 0 }
  const velocity = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const desiredCamera = new THREE.Vector3()
  const lookTarget = new THREE.Vector3()
  let heading = 0
  let yawRate = 0
  let pitch = 0
  let roll = 0
  let elapsed = 0
  let telemetryTimer = 0

  function resize() {
    const { clientWidth, clientHeight } = container
    renderer.setSize(clientWidth, clientHeight, false)
    camera.aspect = clientWidth / Math.max(clientHeight, 1)
    camera.updateProjectionMatrix()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  resize()

  const timer = new THREE.Timer()

  function update(dt: number) {
    elapsed += dt

    const steering = stunTimer > 0 || !mission.running ? { surge: 0, yaw: 0, heave: 0 } : input
    yawRate += (steering.yaw * 1.5 - yawRate) * Math.min(1, dt * 3)
    heading += yawRate * dt

    forward.set(-Math.sin(heading), 0, -Math.cos(heading))
    velocity.addScaledVector(forward, steering.surge * 4.6 * dt)
    velocity.y += steering.heave * 3 * dt
    velocity.multiplyScalar(Math.exp(-1.4 * dt))
    rov.position.addScaledVector(velocity, dt)

    const floor = FLOOR_Y + 0.3
    if (rov.position.y < floor) {
      rov.position.y = floor
      velocity.y = Math.max(0, velocity.y)
    }
    if (rov.position.y > SURFACE_Y - 0.3) {
      rov.position.y = SURFACE_Y - 0.3
      velocity.y = Math.min(0, velocity.y)
    }
    const clampedX = THREE.MathUtils.clamp(rov.position.x, POOL.minX + WALL_MARGIN, POOL.maxX - WALL_MARGIN)
    const clampedZ = THREE.MathUtils.clamp(rov.position.z, POOL.minZ + WALL_MARGIN, POOL.maxZ - WALL_MARGIN)
    if (clampedX !== rov.position.x) velocity.x = 0
    if (clampedZ !== rov.position.z) velocity.z = 0
    rov.position.x = clampedX
    rov.position.z = clampedZ

    const forwardSpeed = velocity.dot(forward)
    pitch += (-steering.surge * 0.12 + velocity.y * 0.05 - pitch) * Math.min(1, dt * 2)
    roll += (-yawRate * 0.12 - roll) * Math.min(1, dt * 2)
    const wobble = shake * shake
    rov.rotation.set(
      pitch + Math.sin(elapsed * 1.3) * 0.015 + Math.sin(elapsed * 37) * 0.25 * wobble,
      heading,
      roll + Math.sin(elapsed * 0.9) * 0.02 + Math.sin(elapsed * 31) * 0.3 * wobble,
      'YXZ',
    )
    model.position.y = Math.sin(elapsed * 1.1) * 0.015

    desiredCamera.copy(cameraOffset).applyAxisAngle(THREE.Object3D.DEFAULT_UP, heading).add(rov.position)
    desiredCamera.x = THREE.MathUtils.clamp(desiredCamera.x, POOL.minX + 0.15, POOL.maxX - 0.15)
    desiredCamera.z = THREE.MathUtils.clamp(desiredCamera.z, POOL.minZ + 0.15, POOL.maxZ - 0.15)
    desiredCamera.y = THREE.MathUtils.clamp(desiredCamera.y, FLOOR_Y + 0.2, SURFACE_Y - 0.1)
    camera.position.lerp(desiredCamera, Math.min(1, dt * 2.5))
    lookTarget.copy(rov.position).addScaledVector(forward, 0.6)
    camera.lookAt(lookTarget)
    if (shake > 0) {
      camera.position.x += (Math.random() - 0.5) * 0.12 * wobble
      camera.position.y += (Math.random() - 0.5) * 0.12 * wobble
    }

    const hit = mines.update(dt, rov.position)
    if (hit) {
      mission.hitMine()
      knock.subVectors(rov.position, hit).setY(0).normalize().multiplyScalar(3.2)
      velocity.copy(knock).setY(1.4)
      yawRate += (Math.random() - 0.5) * 3
      stunTimer = 0.7
      shake = 1
    }
    stunTimer = Math.max(0, stunTimer - dt)
    shake = Math.max(0, shake - dt * 1.4)

    mission.update(dt)
    const goal = mission.destination()
    guide.beacon.visible = Boolean(goal)
    if (goal) {
      guide.beacon.position.copy(goal)
      guide.beam.scale.y = Math.max(0.01, SURFACE_Y - goal.y)
      guide.ring.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.15)
    }
    jawOpen += ((mission.gripClosed ? 0 : 1) - jawOpen) * Math.min(1, dt * 6)
    if (jawRight) jawRight.rotation.y = -jawOpen * 0.45
    if (jawLeft) jawLeft.rotation.y = jawOpen * 0.45

    pool.animate(elapsed)
    bubbles.position.y = Math.sin(elapsed * 0.2) * 0.15

    telemetryTimer += dt
    if (telemetryTimer > 0.1) {
      telemetryTimer = 0
      onTelemetry({
        depth: (SURFACE_Y - rov.position.y) * METERS_PER_UNIT,
        heading: ((-heading * 180) / Math.PI + 3600) % 360,
        surge: Math.max(-1, Math.min(1, forwardSpeed / 3.3)),
        heave: Math.max(-1, Math.min(1, velocity.y / 2.1)),
        gripClosed: mission.gripClosed,
        ...mission.snapshot(),
      })
    }
  }

  function frame() {
    timer.update()
    update(Math.min(timer.getDelta(), 0.05))
    renderer.render(scene, camera)
  }

  return {
    input,
    toggleGrip: mission.toggleGrip,
    startMission: mission.start,
    start() {
      timer.reset()
      renderer.setAnimationLoop(frame)
    },
    stop() {
      renderer.setAnimationLoop(null)
    },
    dispose() {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => {
            Object.values(material).forEach((value) => value instanceof THREE.Texture && value.dispose())
            material.dispose()
          })
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
