import * as THREE from 'three'
import { SURFACE_Y } from './pool'

const MAX_BUBBLES = 260

function bubbleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(32, 32, 10, 32, 32, 30)
  gradient.addColorStop(0, 'rgba(255,255,255,0.15)')
  gradient.addColorStop(0.75, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(0.9, 'rgba(255,255,255,0.95)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.beginPath()
  context.arc(32, 32, 30, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = 'rgba(255,255,255,0.9)'
  context.beginPath()
  context.arc(24, 22, 5, 0, Math.PI * 2)
  context.fill()
  return new THREE.CanvasTexture(canvas)
}

export function createBubbleTrail(scene: THREE.Scene) {
  const positions = new Float32Array(MAX_BUBBLES * 3).fill(-1000)
  const velocities = new Float32Array(MAX_BUBBLES * 3)
  const ages = new Float32Array(MAX_BUBBLES).fill(Infinity)
  const lifetimes = new Float32Array(MAX_BUBBLES)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ map: bubbleTexture(), size: 0.07, transparent: true, depthWrite: false, opacity: 0.85 }),
  )
  points.frustumCulled = false
  scene.add(points)
  let next = 0
  let carry = 0

  return {
    emit(origin: THREE.Vector3, backward: THREE.Vector3, rate: number, dt: number) {
      carry += rate * dt
      while (carry >= 1) {
        carry -= 1
        const i = next
        next = (next + 1) % MAX_BUBBLES
        positions[i * 3] = origin.x + (Math.random() - 0.5) * 0.35
        positions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.2
        positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.35
        velocities[i * 3] = backward.x * (0.6 + Math.random()) + (Math.random() - 0.5) * 0.2
        velocities[i * 3 + 1] = 0.3 + Math.random() * 0.4
        velocities[i * 3 + 2] = backward.z * (0.6 + Math.random()) + (Math.random() - 0.5) * 0.2
        ages[i] = 0
        lifetimes[i] = 1.4 + Math.random() * 1.4
      }
    },
    update(dt: number) {
      for (let i = 0; i < MAX_BUBBLES; i++) {
        if (ages[i] === Infinity) continue
        ages[i] += dt
        if (ages[i] > lifetimes[i] || positions[i * 3 + 1] > SURFACE_Y - 0.05) {
          ages[i] = Infinity
          positions[i * 3 + 1] = -1000
          continue
        }
        velocities[i * 3] *= 0.96
        velocities[i * 3 + 2] *= 0.96
        velocities[i * 3 + 1] = Math.min(0.9, velocities[i * 3 + 1] + dt * 0.4)
        positions[i * 3] += (velocities[i * 3] + Math.sin(ages[i] * 6 + i) * 0.05) * dt
        positions[i * 3 + 1] += velocities[i * 3 + 1] * dt
        positions[i * 3 + 2] += velocities[i * 3 + 2] * dt
      }
      geometry.attributes.position.needsUpdate = true
    },
  }
}

const STAR_SPOTS: [number, number, number][] = [
  [0, 0.3, 1.5],
  [-4, -1, -3],
  [3.5, -1.2, -6.8],
  [-2.5, 0.8, -12.5],
  [5, 1.5, -12],
  [-5.5, 1.6, 3],
]
const STAR_RESPAWN = 20
const PICKUP_DISTANCE = 0.6

function starGeometry() {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? 0.1 : 0.24
    const angle = (i / 10) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2 }).center()
}

export function createBoostStars(scene: THREE.Scene) {
  const geometry = starGeometry()
  const stars = STAR_SPOTS.map(([x, y, z], index) => {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: '#ffd400', emissive: '#ffb800', emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.3 }),
    )
    mesh.position.set(x, y, z)
    scene.add(mesh)
    return { mesh, baseY: y, phase: index * 1.3, cooldown: 0 }
  })
  let elapsed = 0

  return {
    update(dt: number, rovPosition: THREE.Vector3) {
      elapsed += dt
      let collected = false
      for (const star of stars) {
        if (star.cooldown > 0) {
          star.cooldown -= dt
          star.mesh.visible = star.cooldown <= 0
          continue
        }
        star.mesh.rotation.y = elapsed * 2.4 + star.phase
        star.mesh.position.y = star.baseY + Math.sin(elapsed * 2 + star.phase) * 0.08
        if (star.mesh.position.distanceTo(rovPosition) < PICKUP_DISTANCE) {
          star.cooldown = STAR_RESPAWN
          star.mesh.visible = false
          collected = true
        }
      }
      return collected
    },
  }
}
