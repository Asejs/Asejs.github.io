import * as THREE from 'three'

export const SURFACE_Y = 2.5
export const FLOOR_Y = -2
export const POOL = { minX: -7, maxX: 7, minZ: -15, maxZ: 7 }

function createTileTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  context.fillStyle = '#7fd0e3'
  context.fillRect(0, 0, 256, 256)
  context.strokeStyle = '#d9f3f8'
  context.lineWidth = 3
  for (let i = 0; i <= 8; i++) {
    context.beginPath()
    context.moveTo(i * 32, 0)
    context.lineTo(i * 32, 256)
    context.moveTo(0, i * 32)
    context.lineTo(256, i * 32)
    context.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function createCausticsTexture(random: () => number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  context.lineCap = 'round'
  for (let i = 0; i < 70; i++) {
    const x = random() * 256
    const y = random() * 256
    const radius = 10 + random() * 26
    context.lineWidth = 0.8 + random() * 1.4
    context.beginPath()
    context.ellipse(x, y, radius, radius * (0.5 + random() * 0.5), random() * Math.PI, 0, Math.PI * (0.6 + random()))
    context.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

function tiledMaterial(tiles: THREE.Texture, width: number, height: number) {
  const map = tiles.clone()
  map.repeat.set(width / 2, height / 2)
  map.needsUpdate = true
  return new THREE.MeshStandardMaterial({ map, roughness: 0.35 })
}

export function createPool(random: () => number) {
  const group = new THREE.Group()
  const tiles = createTileTexture()
  const width = POOL.maxX - POOL.minX
  const length = POOL.maxZ - POOL.minZ
  const depth = SURFACE_Y - FLOOR_Y + 0.6
  const centerX = (POOL.minX + POOL.maxX) / 2
  const centerZ = (POOL.minZ + POOL.maxZ) / 2

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, length), tiledMaterial(tiles, width, length))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(centerX, FLOOR_Y, centerZ)
  group.add(floor)

  const walls: [number, number, number, number, number][] = [
    [width, centerX, POOL.minZ, 0, 0],
    [width, centerX, POOL.maxZ, Math.PI, 0],
    [length, POOL.minX, centerZ, Math.PI / 2, 0],
    [length, POOL.maxX, centerZ, -Math.PI / 2, 0],
  ]
  for (const [span, x, z, rotation] of walls) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(span, depth), tiledMaterial(tiles, span, depth))
    wall.position.set(x, FLOOR_Y + depth / 2, z)
    wall.rotation.y = rotation
    group.add(wall)
  }

  const laneMaterial = new THREE.MeshStandardMaterial({ color: '#1c3f8c', roughness: 0.5 })
  for (const x of [-4.5, -1.5, 1.5, 4.5]) {
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.25, length - 3), laneMaterial)
    lane.rotation.x = -Math.PI / 2
    lane.position.set(x, FLOOR_Y + 0.004, centerZ)
    group.add(lane)
    for (const end of [POOL.minZ + 1.5, POOL.maxZ - 1.5]) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.25), laneMaterial)
      bar.rotation.x = -Math.PI / 2
      bar.position.set(x, FLOOR_Y + 0.004, end)
      group.add(bar)
    }
  }

  const chrome = new THREE.MeshStandardMaterial({ color: '#d7dde0', metalness: 0.9, roughness: 0.25 })
  const ladderX = POOL.maxX - 0.12
  for (const offset of [-0.3, 0.3]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 12), chrome)
    rail.position.set(ladderX, SURFACE_Y - 0.6, -2 + offset)
    group.add(rail)
  }
  for (let i = 0; i < 4; i++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 12), chrome)
    rung.rotation.x = Math.PI / 2
    rung.position.set(ladderX, SURFACE_Y - 1.7 + i * 0.4, -2)
    group.add(rung)
  }

  const caustics = createCausticsTexture(random)
  caustics.repeat.set(width / 3, length / 3)
  const causticsMaterial = new THREE.MeshBasicMaterial({
    map: caustics,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const causticsLayer = new THREE.Mesh(new THREE.PlaneGeometry(width, length), causticsMaterial)
  causticsLayer.rotation.x = -Math.PI / 2
  causticsLayer.position.set(centerX, FLOOR_Y + 0.01, centerZ)
  group.add(causticsLayer)

  const surfaceTexture = caustics.clone()
  surfaceTexture.repeat.set(width / 5, length / 5)
  surfaceTexture.needsUpdate = true
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshBasicMaterial({
      color: '#bdf0f7',
      alphaMap: surfaceTexture,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  surface.rotation.x = Math.PI / 2
  surface.position.set(centerX, SURFACE_Y, centerZ)
  const surfaceTint = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshBasicMaterial({ color: '#4fb9cf', transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
  )
  surfaceTint.rotation.x = Math.PI / 2
  surfaceTint.position.set(centerX, SURFACE_Y + 0.01, centerZ)
  group.add(surfaceTint, surface)

  return {
    group,
    animate(elapsed: number) {
      caustics.offset.set(elapsed * 0.02, elapsed * 0.035)
      surfaceTexture.offset.set(-elapsed * 0.015, elapsed * 0.02)
      causticsMaterial.opacity = 0.12 + Math.sin(elapsed * 1.7) * 0.03
    },
  }
}

export function createBubbles(random: () => number) {
  const count = 300
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = POOL.minX + random() * (POOL.maxX - POOL.minX)
    positions[i * 3 + 1] = FLOOR_Y + random() * (SURFACE_Y - FLOOR_Y)
    positions[i * 3 + 2] = POOL.minZ + random() * (POOL.maxZ - POOL.minZ)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: '#ffffff', size: 0.035, transparent: true, opacity: 0.6, depthWrite: false }),
  )
}
