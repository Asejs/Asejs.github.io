import * as THREE from 'three'
import { createFireball } from './fire'
import { FLOOR_Y } from './pool'

const MINE_RADIUS = 0.22
const HIT_DISTANCE = 0.62
const SPOTS: [number, number, number][] = [
  [-1.5, 0, -1.5],
  [1.2, -0.8, -6.5],
  [-4.5, 0.8, -6.5],
  [4.5, 0.5, -4.5],
  [-2.5, -1, -10],
  [2.5, -0.3, -12],
  [-0.8, 1.5, -8.5],
  [4.2, 1.2, 1.5],
]

interface Mine {
  group: THREE.Group
  light: THREE.MeshBasicMaterial
  baseY: number
  phase: number
  alive: boolean
}

function createMine(x: number, y: number, z: number, phase: number): Mine {
  const group = new THREE.Group()
  const shell = new THREE.MeshStandardMaterial({ color: '#2b2f33', metalness: 0.6, roughness: 0.4 })
  group.add(new THREE.Mesh(new THREE.SphereGeometry(MINE_RADIUS, 20, 14), shell))
  const spike = new THREE.ConeGeometry(0.035, 0.12, 8).translate(0, MINE_RADIUS + 0.05, 0)
  const directions = [
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0.7, 0.7, 0],
    [-0.7, 0.7, 0],
    [0, 0.7, 0.7],
    [0, 0.7, -0.7],
  ]
  for (const [dx, dy, dz] of directions) {
    const mesh = new THREE.Mesh(spike, shell)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize())
    group.add(mesh)
  }
  const light = new THREE.MeshBasicMaterial({ color: '#ff2b2b' })
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), light)
  beacon.position.set(0, MINE_RADIUS * 0.75, MINE_RADIUS * 0.7)
  group.add(beacon)
  const chainLength = y - FLOOR_Y
  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, chainLength, 6).translate(0, -chainLength / 2, 0),
    new THREE.MeshStandardMaterial({ color: '#4a4f54' }),
  )
  group.add(chain)
  group.position.set(x, y, z)
  return { group, light, baseY: y, phase, alive: true }
}

export function createMines(scene: THREE.Scene) {
  const mines = SPOTS.map(([x, y, z], index) => createMine(x, y, z, index * 1.7))
  mines.forEach((mine) => scene.add(mine.group))
  const blasts: ReturnType<typeof createFireball>[] = []
  let elapsed = 0

  function explode(mine: Mine) {
    mine.alive = false
    mine.group.visible = false
    const blast = createFireball(mine.group.position)
    scene.add(blast.group)
    blasts.push(blast)
  }

  function updateBlasts(dt: number) {
    for (const blast of [...blasts]) {
      if (blast.update(dt)) continue
      scene.remove(blast.group)
      blast.dispose()
      blasts.splice(blasts.indexOf(blast), 1)
    }
  }

  return {
    update(dt: number, rovPosition: THREE.Vector3) {
      elapsed += dt
      let hit: THREE.Vector3 | undefined
      for (const mine of mines) {
        if (!mine.alive) continue
        mine.group.position.y = mine.baseY + Math.sin(elapsed * 0.8 + mine.phase) * 0.05
        mine.group.rotation.y = elapsed * 0.2 + mine.phase
        mine.light.color.set(Math.sin(elapsed * 4 + mine.phase) > 0.6 ? '#ff2b2b' : '#5a0d0d')
        if (mine.group.position.distanceTo(rovPosition) < HIT_DISTANCE) {
          explode(mine)
          hit = mine.group.position
        }
      }
      updateBlasts(dt)
      return hit
    },
  }
}
