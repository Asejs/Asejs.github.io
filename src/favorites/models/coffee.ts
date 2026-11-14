import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { physical, painted, mesh } from './shared'

export function coffee() {
  const group = new THREE.Group()
  const cup = new THREE.Group()
  const glaze = (x: number, y: number, z: number) =>
    0.5 +
    0.22 * Math.sin(x * 7.1 + y * 3.3) * Math.cos(z * 6.3 - y * 2.1) +
    0.18 * Math.sin(x * 15.7 - z * 13.1 + y * 9.4) +
    0.1 * Math.sin(y * 23 + x * 19)
  const light = new THREE.Color('#ece9e2')
  const dark = new THREE.Color('#aaa69d')
  const rimTone = new THREE.Color('#8f897f')
  const ceramic = physical('#ffffff', {
    vertexColors: true,
    roughness: 0.72,
    specularIntensity: 0.45,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
  })

  const outline: THREE.Vector2[] = [new THREE.Vector2(0, -0.6), new THREE.Vector2(0.44, -0.6)]
  for (let i = 0; i <= 16; i++) {
    const a = -Math.PI / 2 + (i / 16) * (Math.PI / 2)
    outline.push(new THREE.Vector2(0.4 + Math.cos(a) * 0.13, -0.47 + Math.sin(a) * 0.13))
  }
  for (let i = 1; i <= 36; i++) outline.push(new THREE.Vector2(0.53 + (i / 36) * 0.015, -0.47 + (i / 36) * 0.97))
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI
    outline.push(new THREE.Vector2(0.5 + Math.cos(a) * 0.045, 0.5 + Math.sin(a) * 0.045))
  }
  outline.push(new THREE.Vector2(0.455, -0.48), new THREE.Vector2(0, -0.48))
  const mugGeometry = mergeVertices(new THREE.LatheGeometry(outline, 160).deleteAttribute('uv').deleteAttribute('normal'))
  const dent = (angle: number, y: number) =>
    (0.012 * Math.sin(angle * 5 + y * 4.2) + 0.009 * Math.sin(angle * 3 - y * 6.5 + 1.3) + 0.005 * Math.sin(angle * 9 + y * 11)) *
    THREE.MathUtils.smoothstep(y, -0.55, -0.3)
  const wall = mugGeometry.attributes.position as THREE.BufferAttribute
  const colours = new Float32Array(wall.count * 3)
  const point = new THREE.Vector3()
  const tone = new THREE.Color()
  for (let i = 0; i < wall.count; i++) {
    point.fromBufferAttribute(wall, i)
    const radius = Math.hypot(point.x, point.z)
    const angle = Math.atan2(point.z, point.x)
    if (radius > 0.3) {
      const scale = (radius + dent(angle, point.y)) / radius
      wall.setXYZ(i, point.x * scale, point.y, point.z * scale)
    }
    tone.lerpColors(dark, light, THREE.MathUtils.clamp(glaze(point.x, point.y, point.z), 0, 1))
    if (point.y > 0.42 && radius > 0.47) tone.lerp(rimTone, THREE.MathUtils.smoothstep(point.y, 0.42, 0.53) * 0.7)
    tone.toArray(colours, i * 3)
  }
  mugGeometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
  mugGeometry.computeVertexNormals()
  const mug = mesh(mugGeometry, ceramic)
  ;(mug.material as THREE.MeshPhysicalMaterial).side = THREE.DoubleSide
  const print = painted(1024, 96, (ctx) => {
    ctx.font = '600 52px "Courier New", Courier, monospace'
    ctx.fillStyle = '#3b3936'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.filter = 'blur(0.6px)'
    ctx.fillText('...but first, coffee', 512, 50)
  })
  const textY = 0.06
  const textHeight = 0.09
  const textArc = 2.2
  const label = new THREE.CylinderGeometry(1, 1, textHeight, 96, 4, true, Math.PI / 2 - textArc / 2, textArc)
  const labelPoints = label.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < labelPoints.count; i++) {
    point.fromBufferAttribute(labelPoints, i)
    const y = point.y + textY
    const angle = Math.atan2(point.z, point.x)
    const radius = 0.53 + ((y + 0.47) / 0.97) * 0.015 + dent(angle, y) + 0.002
    labelPoints.setXYZ(i, point.x * radius, y, point.z * radius)
  }
  label.computeVertexNormals()
  const lettering = mesh(
    label,
    physical('#ffffff', { map: print, transparent: true, depthWrite: false, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }),
  )
  const handlePath = new THREE.CatmullRomCurve3(
    [
      [-0.48, 0.34],
      [-0.68, 0.42],
      [-0.88, 0.34],
      [-0.95, 0.12],
      [-0.88, -0.1],
      [-0.72, -0.26],
      [-0.48, -0.32],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
  )
  const handleGeometry = new THREE.TubeGeometry(handlePath, 64, 0.075, 20)
  const handlePoints = handleGeometry.attributes.position as THREE.BufferAttribute
  const handleColours = new Float32Array(handlePoints.count * 3)
  for (let i = 0; i < handlePoints.count; i++) {
    point.fromBufferAttribute(handlePoints, i)
    tone.lerpColors(dark, light, THREE.MathUtils.clamp(glaze(point.x, point.y, point.z), 0, 1)).toArray(handleColours, i * 3)
  }
  handleGeometry.setAttribute('color', new THREE.BufferAttribute(handleColours, 3))
  const handle = mesh(handleGeometry, ceramic)
  const crema = painted(128, 128, (ctx) => {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, '#1a0a03')
    gradient.addColorStop(0.75, '#261005')
    gradient.addColorStop(1, '#3d1c0b')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  })
  const surface = new THREE.RingGeometry(0, 0.46, 64, 12)
  const flat = (surface.attributes.position.array as Float32Array).slice()
  const coffeeLook = { roughness: 0.4, specularIntensity: 0.3, envMapIntensity: 0.12 }
  const drink = mesh(surface, physical('#ffffff', { map: crema, ...coffeeLook }), 0, 0.47, 0)
  drink.rotation.x = -Math.PI / 2
  cup.add(mug, lettering, handle, drink)

  const steamTexture = (() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(canvas)
  })()
  const puffs = Array.from({ length: 12 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTexture, transparent: true, depthWrite: false }))
    sprite.userData.offset = i / 12
    group.add(sprite)
    return sprite
  })

  const splashMaterial = physical('#3a2116', { roughness: 0.1, clearcoat: 1 })
  const dropGeometry = new THREE.SphereGeometry(0.035, 16, 12)
  const drops = Array.from({ length: 10 }, () => {
    const drop = new THREE.Mesh(dropGeometry, splashMaterial)
    drop.visible = false
    drop.userData = { velocity: new THREE.Vector3(), age: 0, size: 1 }
    return drop
  })
  let spill = -1
  let emitted = 0
  let lastTime = 0
  const splashDir = new THREE.Vector3(1, 0, 0.55).normalize()
  const rimCentre = new THREE.Vector3()
  const lip = new THREE.Vector3()
  const cupTurn = new THREE.Quaternion()
  const localDir = new THREE.Vector3()

  group.userData.onSpin = () => {
    let scene: THREE.Object3D = group
    while (scene.parent) scene = scene.parent
    for (const drop of drops) if (!drop.parent) scene.add(drop)
    spill = 0
    emitted = 0
    return false
  }

  group.add(cup)
  group.scale.setScalar(1.05)
  group.position.y = -0.2
  group.userData.lookIn = 0.4
  group.userData.bleed = 2.4
  group.userData.update = (time: number) => {
    const dt = Math.min(Math.max(time - lastTime, 0), 0.05)
    lastTime = time
    if (spill >= 0) spill += dt
    if (spill > 6) spill = -1

    const rock = spill < 0 ? 0 : 0.07 * Math.exp(-spill * 1.3) * Math.cos(Math.max(spill - 0.2, 0) * 7)
    const ramp = spill < 0 ? 0 : Math.min(spill / 0.15, 1)
    const swirl = spill < 0 ? 0 : Math.exp(-spill * 2) * ramp
    cup.getWorldQuaternion(cupTurn)
    localDir.copy(splashDir).applyQuaternion(cupTurn.invert())
    const side = Math.atan2(-localDir.z, localDir.x)
    const position = surface.attributes.position
    for (let i = 0; i < position.count; i++) {
      const x = flat[i * 3]
      const y = flat[i * 3 + 1]
      const r = Math.hypot(x, y) / 0.46
      const angle = Math.atan2(y, x)
      const tilt = rock * ramp * r * r * Math.cos(angle - side)
      const dish = swirl * 0.025 * (r * r - 0.5)
      const ripple = swirl * 0.008 * Math.sin(r * 10 - time * 16)
      position.setZ(i, tilt + dish + ripple)
    }
    position.needsUpdate = true
    surface.computeVertexNormals()

    if (spill >= 0 && emitted === 0) {
      cup.updateWorldMatrix(true, false)
      cup.localToWorld(rimCentre.set(0, 0.5, 0))
      drops.forEach((drop) => {
        const angle = Math.random() * Math.PI * 2
        cup.localToWorld(lip.set(Math.cos(angle) * 0.5, 0.52, Math.sin(angle) * 0.5))
        const out = lip.clone().sub(rimCentre).setY(0).normalize()
        drop.position.copy(lip)
        drop.userData.velocity
          .copy(out)
          .multiplyScalar(0.6 + Math.random() * 0.9)
          .setY(0.8 + Math.random() * 1.1)
        drop.scale.setScalar(0.6 + Math.random() * 0.9)
        drop.visible = true
      })
      emitted = drops.length
    }
    for (const drop of drops) {
      if (!drop.visible) continue
      const velocity: THREE.Vector3 = drop.userData.velocity
      velocity.y -= 5 * dt
      drop.position.addScaledVector(velocity, dt)
      if (drop.position.y < -3) drop.visible = false
    }
    for (const puff of puffs) {
      const t = (time * 0.25 + puff.userData.offset) % 1
      puff.position.set(Math.sin(t * 6 + puff.userData.offset * 9) * 0.18, 0.65 + t * 1.2, Math.cos(t * 5) * 0.08)
      puff.scale.setScalar(0.3 + t * 0.8)
      puff.material.opacity = 0.13 * THREE.MathUtils.smoothstep(t, 0.1, 0.35) * (1 - THREE.MathUtils.smoothstep(t, 0.45, 0.85))
    }
  }
  return group
}
