import * as THREE from 'three'
import { physical, painted, speckle, mesh, roundedBox, softBox } from './shared'

const ridges = (count: number) => {
  const texture = painted(256, 8, (ctx) => {
    for (let x = 0; x < 256; x++) {
      const v = 128 + Math.sin((x / 256) * Math.PI * 2 * 4) * 110
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(x, 0, 1, 8)
    }
  })
  texture.colorSpace = THREE.NoColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(count / 4, 1)
  return texture
}

function ring(radius: number, length: number, z: number, material: THREE.Material, radiusBack = radius, open = false) {
  const geometry = new THREE.CylinderGeometry(radius, radiusBack, length, 64, 1, open)
  geometry.rotateX(Math.PI / 2)
  return mesh(geometry, material, 0, 0, z + length / 2)
}

export function camera() {
  const group = new THREE.Group()
  const body = new THREE.Group()

  const grain = speckle(256, 70, 220)
  grain.colorSpace = THREE.NoColorSpace
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  grain.repeat.set(4, 4)
  const fineGrain = grain.clone()
  fineGrain.repeat.set(10, 10)
  const shell = physical('#26272a', { roughness: 1, specularIntensity: 0.25, bumpMap: fineGrain, bumpScale: 0.12, envMapIntensity: 0.3 })
  const leather = physical('#1f2022', {
    roughness: 1,
    specularIntensity: 0.2,
    roughnessMap: grain,
    bumpMap: grain,
    bumpScale: 0.7,
    envMapIntensity: 0.25,
  })
  const metal = physical('#8a8e94', { metalness: 0.8, roughness: 0.6 })
  const black = physical('#212224', { roughness: 0.95, specularIntensity: 0.3, envMapIntensity: 0.3 })

  body.add(mesh(softBox(1.5, 0.95, 0.6, 0.12, 0.03), shell, 0, 0, 0))
  body.add(mesh(softBox(1.38, 0.8, 0.02, 0.01, 0.004), leather, 0.03, -0.04, 0.3))
  body.add(mesh(softBox(0.4, 0.92, 0.82, 0.16, 0.05), leather, -0.56, -0.01, 0.08))

  const prism = new THREE.Shape()
  prism.moveTo(-0.36, 0)
  prism.lineTo(0.36, 0)
  prism.lineTo(0.22, 0.28)
  prism.quadraticCurveTo(0, 0.34, -0.22, 0.28)
  prism.closePath()
  const prismGeometry = new THREE.ExtrudeGeometry(prism, {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
  })
  prismGeometry.translate(0, 0, -0.27)
  body.add(mesh(prismGeometry, shell, 0.06, 0.45, 0))
  body.add(mesh(new THREE.BoxGeometry(0.22, 0.03, 0.2), metal, 0.06, 0.8, -0.04))

  const dial = new THREE.Group()
  dial.add(
    mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.09, 40), physical('#242528', { roughness: 0.6, bumpMap: ridges(48), bumpScale: 1.5 })),
  )
  dial.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 20), black))
  dial.position.set(0.52, 0.52, -0.02)
  body.add(dial)
  const shutter = mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.04, 24), metal, -0.6, 0.5, 0.3)
  shutter.rotation.x = 0.35
  body.add(shutter)
  const wheel = mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.12, 24),
    physical('#242528', { bumpMap: ridges(32), bumpScale: 1 }),
    -0.42,
    0.46,
    0.18,
  )
  wheel.rotation.z = Math.PI / 2
  body.add(wheel)
  const lcd = mesh(
    new THREE.PlaneGeometry(0.34, 0.2),
    physical('#3a4038', { roughness: 0.1, clearcoat: 1, emissive: '#1d221c', emissiveIntensity: 0.4 }),
    -0.32,
    0.4755,
    -0.05,
  )
  lcd.rotation.x = -Math.PI / 2
  body.add(lcd)

  body.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20).rotateX(Math.PI / 2), shell, 0.47, -0.08, 0.31))
  for (const side of [-1, 1]) body.add(mesh(new THREE.TorusGeometry(0.045, 0.015, 8, 20), metal, side * 0.77, 0.3, 0))

  const lens = new THREE.Group()
  const barrel = physical('#242528', { roughness: 1, specularIntensity: 0.25, bumpMap: fineGrain, bumpScale: 0.1, envMapIntensity: 0.3 })
  const rubber = (count: number) =>
    physical('#1c1d1f', { roughness: 0.95, specularIntensity: 0.25, bumpMap: ridges(count), bumpScale: 2, envMapIntensity: 0.3 })
  lens.add(ring(0.36, 0.03, 0.3, black))
  lens.add(ring(0.33, 0.1, 0.33, barrel))
  lens.add(ring(0.38, 0.16, 0.43, rubber(90)))
  lens.add(ring(0.38, 0.12, 0.59, barrel))
  const window_ = mesh(new THREE.PlaneGeometry(0.16, 0.06), physical('#050505', { roughness: 0.05, clearcoat: 1 }), 0, 0.381, 0.65)
  window_.rotation.x = -Math.PI / 2
  lens.add(window_)
  lens.add(ring(0.4, 0.3, 0.71, rubber(110)))
  lens.add(ring(0.405, 0.022, 1.01, physical('#b3262b', { roughness: 0.7 }), 0.405, true))
  lens.add(ring(0.41, 0.1, 1.032, barrel, 0.4, true))
  const frontRing = physical('#1a1b1d', { roughness: 0.9, specularIntensity: 0.3 })
  lens.add(ring(0.415, 0.03, 1.13, frontRing, 0.415, true))
  lens.add(mesh(new THREE.RingGeometry(0.36, 0.415, 64), frontRing, 0, 0, 1.16))
  lens.add(mesh(new THREE.BoxGeometry(0.05, 0.16, 0.14), barrel, -0.38, 0.05, 0.62))

  const inner = new THREE.CylinderGeometry(0.36, 0.33, 0.16, 48, 1, true)
  inner.rotateX(Math.PI / 2)
  lens.add(mesh(inner, physical('#050506', { roughness: 0.9, side: THREE.BackSide }), 0, 0, 1.08))
  const glassGeometry = new THREE.SphereGeometry(0.6, 48, 16, 0, Math.PI * 2, 0, 0.6)
  glassGeometry.rotateX(Math.PI / 2)
  lens.add(
    mesh(
      glassGeometry,
      new THREE.MeshPhysicalMaterial({
        color: '#1a2744',
        roughness: 0.04,
        metalness: 0.6,
        clearcoat: 1,
        iridescence: 1,
        iridescenceIOR: 1.8,
        iridescenceThicknessRange: [200, 650],
      }),
      0,
      0,
      0.52,
    ),
  )
  for (const [radius, z] of [
    [0.22, 1.05],
    [0.14, 1.03],
    [0.28, 1.07],
  ]) {
    lens.add(mesh(new THREE.TorusGeometry(radius, 0.006, 6, 48), physical('#3b4a6b', { metalness: 1, roughness: 0.2 }), 0, 0, z))
  }
  lens.position.set(0.06, -0.06, 0)
  body.add(lens)

  const back = new THREE.Group()
  const zBack = -0.302
  const onBack = (object: THREE.Object3D, x: number, y: number, z = 0) => {
    object.position.set(x, y, zBack - z)
    back.add(object)
    return object
  }
  const facingBack = (geometry: THREE.BufferGeometry) => geometry.rotateY(Math.PI)
  onBack(mesh(facingBack(new THREE.PlaneGeometry(0.34, 0.95)), leather), -0.56, 0)
  onBack(
    mesh(facingBack(roundedBox(0.8, 0.012, 0.6, 0.04).rotateX(Math.PI / 2)), physical('#1c1d1f', { roughness: 0.8 })),
    0.24,
    -0.1,
    0.004,
  )
  onBack(
    mesh(facingBack(new THREE.PlaneGeometry(0.66, 0.47)), physical('#060708', { roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 })),
    0.25,
    -0.09,
    0.012,
  )
  for (let i = 0; i < 5; i++) {
    onBack(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 20).rotateX(Math.PI / 2), black), 0.66, 0.2 - i * 0.15, 0.012)
  }
  onBack(mesh(softBox(0.38, 0.28, 0.12, 0.07, 0.025), physical('#1a1b1d', { roughness: 0.9 })), 0.06, 0.5, 0.05)
  onBack(
    mesh(
      facingBack(new THREE.PlaneGeometry(0.18, 0.12)),
      physical('#1b2448', { roughness: 0.05, metalness: 0.5, clearcoat: 1, iridescence: 0.8 }),
    ),
    0.06,
    0.5,
    0.111,
  )
  for (const x of [-0.24, -0.4, -0.56]) {
    onBack(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 20).rotateX(Math.PI / 2), black), x, 0.32, 0.014)
  }
  onBack(
    mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.04, 20).rotateX(Math.PI / 2),
      physical('#242528', { roughness: 0.7, bumpMap: ridges(24), bumpScale: 1 }),
    ),
    -0.2,
    0.1,
    0.02,
  )
  onBack(
    mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.04, 48).rotateX(Math.PI / 2),
      physical('#222326', { roughness: 0.75, bumpMap: ridges(60), bumpScale: 2 }),
    ),
    -0.32,
    -0.2,
    0.02,
  )
  onBack(
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 32).rotateX(Math.PI / 2), physical('#1d1e20', { roughness: 0.8 })),
    -0.32,
    -0.2,
    0.026,
  )
  const lever = onBack(mesh(new THREE.BoxGeometry(0.14, 0.035, 0.02), physical('#2a2b2e', { roughness: 0.8 })), -0.2, -0.41, 0.012)
  lever.rotation.z = -0.35
  body.add(back)

  group.add(body)
  group.scale.setScalar(0.72)
  group.position.z = -0.35
  group.rotation.y = -0.85
  return group
}
