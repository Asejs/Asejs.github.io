import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const physical = (color: string, params: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, ...params })

function painted(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext('2d')!)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const speckle = (size: number, low: number, high: number) =>
  painted(size, size, (ctx) => {
    const image = ctx.createImageData(size, size)
    for (let i = 0; i < image.data.length; i += 4) {
      const v = low + Math.random() * (high - low)
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v
      image.data[i + 3] = 255
    }
    ctx.putImageData(image, 0, 0)
  })

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(x, y, z)
  return m
}

function roundedBox(width: number, height: number, depth: number, radius: number, extra: THREE.ExtrudeGeometryOptions = {}) {
  const shape = new THREE.Shape()
  const w = width / 2 - radius
  const d = depth / 2 - radius
  shape.moveTo(-w, -d - radius)
  shape.lineTo(w, -d - radius)
  shape.quadraticCurveTo(w + radius, -d - radius, w + radius, -d)
  shape.lineTo(w + radius, d)
  shape.quadraticCurveTo(w + radius, d + radius, w, d + radius)
  shape.lineTo(-w, d + radius)
  shape.quadraticCurveTo(-w - radius, d + radius, -w - radius, d)
  shape.lineTo(-w - radius, -d)
  shape.quadraticCurveTo(-w - radius, -d - radius, -w, -d - radius)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 8, ...extra })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -height / 2, 0)
  return geometry
}

function softBox(width: number, height: number, depth: number, radius: number, bevel = 0.008) {
  const geometry = roundedBox(width - bevel * 2, height - bevel * 2, depth - bevel * 2, Math.max(radius - bevel, 0.001), {
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  })
  return geometry
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function sticker(
  width: number,
  height: number,
  x: number,
  y: number,
  angle: number,
  lidThickness: number,
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const w = 512
  const h = Math.round((512 * height) / width)
  const texture = painted(w, h, (ctx) => {
    ctx.fillStyle = '#f4f4f2'
    if (Math.abs(width - height) < 0.01) {
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2)
    } else roundRect(ctx, 0, 0, w, h, 36)
    ctx.fill()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    paint(ctx, w, h)
  })
  const decal = mesh(
    new THREE.PlaneGeometry(width, height),
    physical('#ffffff', { map: texture, transparent: true, alphaTest: 0.5, roughness: 0.45, clearcoat: 0.6 }),
    x,
    y,
    -lidThickness - 0.0015,
  )
  decal.rotation.set(0, Math.PI, angle)
  return decal
}

const grille = () =>
  painted(64, 192, (ctx) => {
    ctx.fillStyle = '#17181a'
    ctx.fillRect(0, 0, 64, 192)
    ctx.fillStyle = '#0a0a0b'
    for (let y = 2; y < 192; y += 4) {
      for (let x = (y / 4) % 2 ? 2 : 4; x < 64; x += 4) ctx.fillRect(x, y, 1.6, 1.6)
    }
  })

function laptop() {
  const group = new THREE.Group()
  const anodised = physical('#1d1e21', { metalness: 0.6, roughness: 0.48, clearcoat: 0.15, clearcoatRoughness: 0.5 })

  const W = 1.7
  const D = 1.19
  const px = W / 926
  const T = 0.065

  const base = mesh(softBox(W, T, D, 0.05), anodised, 0, -T / 2, 0)

  const top = 0.0006
  const wellZ = (621 - 732) * px
  const well = mesh(new THREE.PlaneGeometry(728 * px, 298 * px), physical('#0c0c0d', { roughness: 0.7 }), 0, top, wellZ)
  well.rotation.x = -Math.PI / 2
  const grilleTexture = grille()
  for (const side of [-1, 1]) {
    const speaker = mesh(new THREE.PlaneGeometry(90 * px, 275 * px), physical('#ffffff', { map: grilleTexture, roughness: 0.7 }), side * 415 * px, top, wellZ)
    speaker.rotation.x = -Math.PI / 2
    group.add(speaker)
  }
  const trackpad = mesh(
    roundedBox(416 * px, 0.002, 258 * px, 0.015),
    physical('#1a1b1e', { metalness: 0.4, roughness: 0.3, clearcoat: 0.7 }),
    0,
    top,
    (909 - 732) * px,
  )
  const scoop = mesh(new THREE.BoxGeometry(135 * px, T * 0.45, 0.012), physical('#1c1d1f', { metalness: 0.6, roughness: 0.4 }), 0, -T * 0.3, D / 2 - 0.004)

  const rows: [number, number[]][] = [
    [0.75, [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
    [1, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.6]],
    [1, [1.6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
    [1, [1.85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75]],
    [1, [2.35, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25]],
    [1, [1, 1, 1, 1.3, 4.9, 1.3, 1, 3.1]],
  ]
  const labels = [
    ['esc', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['§', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '´', '⌫'],
    ['⇥', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å', '¨', ''],
    ['⇪', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ø', 'Æ', '↩'],
    ['⇧', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '-', '⇧'],
    ['fn', '⌃', '⌥', '⌘', '', '⌘', '⌥', '◂ ▾ ▸'],
  ]
  const wellW = 728 * px - 0.03
  const wellD = 298 * px - 0.03
  const unit = wellW / 14.6
  const gap = unit * 0.1
  const rowUnits = rows.reduce((sum, [h]) => sum + h, 0)
  const rowPitch = wellD / rowUnits
  const keyMaterial = physical('#0a0a0b', { roughness: 0.55, clearcoat: 0.1 })
  const keyGeometry = new THREE.BoxGeometry(1, 0.012, 1)
  const keyCount = rows.reduce((sum, [, keys]) => sum + keys.length, 0)
  const keys = new THREE.InstancedMesh(keyGeometry, keyMaterial, keyCount)
  const legend = document.createElement('canvas')
  legend.width = 1024
  legend.height = Math.round((1024 * wellD) / wellW)
  const ctx = legend.getContext('2d')!
  ctx.fillStyle = '#d8d8d8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const toCanvas = legend.width / wellW
  const matrix = new THREE.Matrix4()
  let n = 0
  let z = -wellD / 2
  rows.forEach(([height, widths], r) => {
    const depth = height * rowPitch
    let x = -wellW / 2
    widths.forEach((width, k) => {
      const w = width * unit
      matrix.compose(
        new THREE.Vector3(x + w / 2, top + 0.006, wellZ + z + depth / 2),
        new THREE.Quaternion(),
        new THREE.Vector3(w - gap, 1, depth - gap),
      )
      keys.setMatrixAt(n++, matrix)
      const label = labels[r][k]
      if (label) {
        ctx.font = `${label.length > 1 ? 13 : 17}px Inter, sans-serif`
        ctx.fillText(label, (x + w / 2 + wellW / 2) * toCanvas, (z + depth / 2 + wellD / 2) * toCanvas)
      }
      x += w
    })
    z += depth
  })
  const legendTexture = new THREE.CanvasTexture(legend)
  legendTexture.colorSpace = THREE.SRGBColorSpace
  legendTexture.anisotropy = 8
  const legends = mesh(
    new THREE.PlaneGeometry(wellW, wellD),
    new THREE.MeshBasicMaterial({ map: legendTexture, transparent: true, opacity: 0.85, depthWrite: false }),
    0,
    top + 0.0125,
    wellZ,
  )
  legends.rotation.x = -Math.PI / 2

  for (const [fx, fz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    group.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 20), physical('#111112', { roughness: 0.9 }), fx * (W / 2 - 0.12), -T - 0.004, fz * (D / 2 - 0.12)))
  }

  const lid = new THREE.Group()
  lid.position.set(0, 0.004, -D / 2 + 0.02)
  lid.rotation.x = -0.28
  const LT = 0.03
  const shell = mesh(softBox(W, LT, D, 0.05, 0.006), anodised, 0, D / 2, -LT / 2)
  shell.rotation.x = Math.PI / 2
  const glassFront = mesh(
    roundedBox(W - 0.012, 0.002, D - 0.012, 0.045),
    physical('#050506', { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
    0,
    D / 2,
    0.001,
  )
  glassFront.rotation.x = Math.PI / 2
  const bezel = 0.032
  const chin = 0.05
  const screenW = W - bezel * 2
  const screenH = D - bezel - chin

  const editor = painted(1024, Math.round((1024 * screenH) / screenW), (ctx) => {
    const h = ctx.canvas.height
    ctx.fillStyle = '#1b1f24'
    ctx.fillRect(0, 0, 1024, h)
    ctx.fillStyle = '#15181c'
    ctx.fillRect(0, 0, 180, h)
    ctx.fillStyle = '#101215'
    ctx.fillRect(0, 0, 1024, 30)
    ctx.fillStyle = '#23282e'
    ctx.fillRect(180, 30, 844, 34)
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = i === 4 ? '#86d2dc' : '#3a414a'
      ctx.fillRect(24 + (i % 4 === 0 ? 0 : 16), 84 + i * 28, 70 + ((i * 37) % 60), 9)
    }
    const syntax = ['#86d2dc', '#c792ea', '#f0b37e', '#a5d6a7', '#e6e6e6', '#82aaff', '#f07178']
    for (let line = 0; line < 22; line++) {
      ctx.fillStyle = '#4a525c'
      ctx.fillRect(196, 86 + line * 28, 16, 9)
      let x = 236 + ((line * 7) % 4) * 28
      const words = 2 + ((line * 5) % 5)
      for (let w = 0; w < words; w++) {
        const width = 28 + ((line * 13 + w * 29) % 90)
        ctx.fillStyle = syntax[(line + w * 2) % syntax.length]
        ctx.fillRect(x, 86 + line * 28, width, 10)
        x += width + 14
      }
    }
  })
  const screen = mesh(
    new THREE.PlaneGeometry(screenW, screenH),
    new THREE.MeshPhysicalMaterial({ map: editor, emissiveMap: editor, emissive: '#ffffff', emissiveIntensity: 0.85, roughness: 0.05, clearcoat: 1 }),
    0,
    chin + screenH / 2,
    0.0025,
  )
  const notch = mesh(roundedBox(0.17, 0.001, 0.05, 0.012), physical('#050506', { roughness: 0.1 }), 0, D - bezel, 0.003)
  notch.rotation.x = Math.PI / 2
  lid.add(shell, glassFront, screen, notch)

  lid.add(
    sticker(0.36, 0.36, -0.32, 0.78, 0.18, LT, (ctx, w, h) => {
      ctx.fillStyle = '#86d2dc'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w / 2 - 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0d1418'
      ctx.font = `800 ${w * 0.3}px Montserrat, sans-serif`
      ctx.fillText('ÅJS', w / 2, h / 2 + w * 0.02)
    }),
    sticker(0.42, 0.24, 0.3, 0.42, -0.12, LT, (ctx, w, h) => {
      ctx.fillStyle = '#16191d'
      roundRect(ctx, 10, 10, w - 20, h - 20, 26)
      ctx.fill()
      ctx.fillStyle = '#f0b37e'
      ctx.font = `500 ${h * 0.46}px "JetBrains Mono", ui-monospace, monospace`
      ctx.fillText('</>', w / 2, h / 2 + h * 0.03)
    }),
  )

  const hinge = mesh(new THREE.CylinderGeometry(0.022, 0.022, W - 0.5, 20), physical('#1a1b1d', { metalness: 0.7, roughness: 0.4 }), 0, 0.0, -D / 2 + 0.02)
  hinge.rotation.z = Math.PI / 2

  group.add(base, well, trackpad, scoop, keys, legends, hinge, lid)
  group.position.y = -0.35
  group.rotation.x = 0.35
  return group
}

function coffee() {
  const group = new THREE.Group()
  const cup = new THREE.Group()
  const ceramic = physical('#f3f1ec', { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 })

  const outline: THREE.Vector2[] = [new THREE.Vector2(0, -0.6), new THREE.Vector2(0.46, -0.6)]
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2)
    outline.push(new THREE.Vector2(0.48 + Math.cos(a) * 0.05, -0.55 + Math.sin(a) * 0.05))
  }
  outline.push(new THREE.Vector2(0.55, 0.5))
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI
    outline.push(new THREE.Vector2(0.505 + Math.cos(a) * 0.045, 0.5 + Math.sin(a) * 0.045))
  }
  outline.push(new THREE.Vector2(0.46, -0.48), new THREE.Vector2(0, -0.48))
  const mugGeometry = mergeVertices(new THREE.LatheGeometry(outline, 64).deleteAttribute('uv').deleteAttribute('normal'))
  mugGeometry.computeVertexNormals()
  const mug = mesh(mugGeometry, ceramic)
  ;(mug.material as THREE.MeshPhysicalMaterial).side = THREE.DoubleSide
  const handle = mesh(new THREE.TorusGeometry(0.27, 0.07, 20, 40, Math.PI * 1.15), ceramic, -0.52, -0.02, 0)
  handle.rotation.z = Math.PI * 0.425
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
  cup.add(mug, handle, drink)

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
        drop.userData.velocity.copy(out).multiplyScalar(0.6 + Math.random() * 0.9).setY(0.8 + Math.random() * 1.1)
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

function camera() {
  const group = new THREE.Group()
  const body = new THREE.Group()

  const grain = speckle(256, 70, 220)
  grain.colorSpace = THREE.NoColorSpace
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  grain.repeat.set(4, 4)
  const shell = physical('#111214', { roughness: 0.88, envMapIntensity: 0.6 })
  const leather = physical('#0e0f10', { roughness: 0.95, roughnessMap: grain, bumpMap: grain, bumpScale: 0.35, envMapIntensity: 0.5 })
  const metal = physical('#8a8e94', { metalness: 0.8, roughness: 0.6 })
  const black = physical('#0f1011', { roughness: 0.8 })

  body.add(mesh(softBox(1.5, 0.95, 0.6, 0.12, 0.03), shell, 0, 0, 0))
  body.add(mesh(softBox(1.38, 0.8, 0.02, 0.01, 0.004), leather, 0.03, -0.04, 0.3))
  body.add(mesh(softBox(0.4, 0.92, 0.82, 0.16, 0.05), leather, -0.56, -0.01, 0.08))

  const prism = new THREE.Shape()
  prism.moveTo(-0.36, 0)
  prism.lineTo(0.36, 0)
  prism.lineTo(0.22, 0.28)
  prism.quadraticCurveTo(0, 0.34, -0.22, 0.28)
  prism.closePath()
  const prismGeometry = new THREE.ExtrudeGeometry(prism, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 })
  prismGeometry.translate(0, 0, -0.27)
  body.add(mesh(prismGeometry, shell, 0.06, 0.45, 0))
  body.add(mesh(new THREE.BoxGeometry(0.22, 0.03, 0.2), metal, 0.06, 0.8, -0.04))

  const dial = new THREE.Group()
  dial.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.09, 40), physical('#141516', { roughness: 0.6, bumpMap: ridges(48), bumpScale: 1.5 })))
  dial.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 20), black))
  dial.position.set(0.52, 0.52, -0.02)
  body.add(dial)
  const shutter = mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.04, 24), metal, -0.6, 0.5, 0.3)
  shutter.rotation.x = 0.35
  body.add(shutter)
  const wheel = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 24), physical('#141516', { bumpMap: ridges(32), bumpScale: 1 }), -0.42, 0.46, 0.18)
  wheel.rotation.z = Math.PI / 2
  body.add(wheel)
  const lcd = mesh(new THREE.PlaneGeometry(0.34, 0.2), physical('#3a4038', { roughness: 0.1, clearcoat: 1, emissive: '#1d221c', emissiveIntensity: 0.4 }), -0.32, 0.4755, -0.05)
  lcd.rotation.x = -Math.PI / 2
  body.add(lcd)

  body.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20).rotateX(Math.PI / 2), shell, 0.47, -0.08, 0.31))
  for (const side of [-1, 1]) body.add(mesh(new THREE.TorusGeometry(0.045, 0.015, 8, 20), metal, side * 0.77, 0.3, 0))

  const lens = new THREE.Group()
  const barrel = physical('#141516', { roughness: 0.85, envMapIntensity: 0.6 })
  const rubber = (count: number) => physical('#0e0f10', { roughness: 0.85, bumpMap: ridges(count), bumpScale: 2 })
  lens.add(ring(0.36, 0.03, 0.3, metal))
  lens.add(ring(0.33, 0.1, 0.33, barrel))
  lens.add(ring(0.38, 0.16, 0.43, rubber(90)))
  lens.add(ring(0.38, 0.12, 0.59, barrel))
  const window_ = mesh(new THREE.PlaneGeometry(0.16, 0.06), physical('#050505', { roughness: 0.05, clearcoat: 1 }), 0, 0.381, 0.65)
  window_.rotation.x = -Math.PI / 2
  lens.add(window_)
  lens.add(ring(0.4, 0.3, 0.71, rubber(110)))
  lens.add(ring(0.405, 0.022, 1.01, physical('#b3262b', { roughness: 0.7 }), 0.405, true))
  lens.add(ring(0.41, 0.1, 1.032, barrel, 0.4, true))
  const frontRing = physical('#0b0b0c', { roughness: 0.75 })
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
  for (const [radius, z] of [[0.22, 1.05], [0.14, 1.03], [0.28, 1.07]]) {
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
  onBack(mesh(facingBack(roundedBox(0.8, 0.012, 0.6, 0.04).rotateX(Math.PI / 2)), physical('#0c0c0d', { roughness: 0.8 })), 0.24, -0.1, 0.004)
  onBack(mesh(facingBack(new THREE.PlaneGeometry(0.66, 0.47)), physical('#060708', { roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 })), 0.25, -0.09, 0.012)
  for (let i = 0; i < 5; i++) {
    onBack(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 20).rotateX(Math.PI / 2), black), 0.66, 0.2 - i * 0.15, 0.012)
  }
  onBack(mesh(softBox(0.38, 0.28, 0.12, 0.07, 0.025), physical('#0b0b0c', { roughness: 0.9 })), 0.06, 0.5, 0.05)
  onBack(mesh(facingBack(new THREE.PlaneGeometry(0.18, 0.12)), physical('#1b2448', { roughness: 0.05, metalness: 0.5, clearcoat: 1, iridescence: 0.8 })), 0.06, 0.5, 0.111)
  for (const x of [-0.24, -0.4, -0.56]) {
    onBack(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 20).rotateX(Math.PI / 2), black), x, 0.32, 0.014)
  }
  onBack(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.04, 20).rotateX(Math.PI / 2), physical('#141516', { roughness: 0.7, bumpMap: ridges(24), bumpScale: 1 })), -0.2, 0.1, 0.02)
  onBack(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 48).rotateX(Math.PI / 2), physical('#121314', { roughness: 0.75, bumpMap: ridges(60), bumpScale: 2 })), -0.32, -0.2, 0.02)
  onBack(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 32).rotateX(Math.PI / 2), physical('#1d1e20', { roughness: 0.8 })), -0.32, -0.2, 0.026)
  const lever = onBack(mesh(new THREE.BoxGeometry(0.14, 0.035, 0.02), physical('#2a2b2e', { roughness: 0.8 })), -0.2, -0.41, 0.012)
  lever.rotation.z = -0.35
  body.add(back)

  group.add(body)
  group.scale.setScalar(0.72)
  group.position.z = -0.35
  group.rotation.y = -0.85
  return group
}

function palette() {
  const group = new THREE.Group()

  const points: THREE.Vector2[] = []
  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2
    const dent = 0.32 * Math.exp(-(((angle - 3.75) / 0.28) ** 2))
    points.push(new THREE.Vector2(Math.cos(angle) * 1.05 * (1 - dent), Math.sin(angle) * 0.78 * (1 - dent)))
  }
  const outline = new THREE.Shape(new THREE.SplineCurve([...points, points[0]]).getPoints(96))
  outline.holes.push(new THREE.Path().absarc(-0.5, -0.05, 0.12, 0, Math.PI * 2, true))
  const boardGeometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  })
  boardGeometry.rotateX(-Math.PI / 2)
  const wood = painted(512, 512, (ctx) => {
    ctx.fillStyle = '#a8784a'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * 512
      ctx.strokeStyle = `rgba(110, 70, 35, ${0.08 + Math.random() * 0.14})`
      ctx.lineWidth = 1 + Math.random() * 3
      ctx.beginPath()
      for (let x = 0; x <= 512; x += 16) ctx.lineTo(x, y + Math.sin(x / 60 + i) * 6)
      ctx.stroke()
    }
  })
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping
  wood.repeat.set(0.5, 0.5)
  group.add(mesh(boardGeometry, physical('#ffffff', { map: wood, roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.4 })))

  const W = 1024
  const H = Math.round((1024 * 1.56) / 2.1)
  const toPx = (x: number, y: number): [number, number] => [((x + 1.05) / 2.1) * W, (1 - (y + 0.78) / 1.56) * H]
  const colour = document.createElement('canvas')
  const height = document.createElement('canvas')
  colour.width = height.width = W
  colour.height = height.height = H
  const c = colour.getContext('2d')!
  const hgt = height.getContext('2d')!
  hgt.fillStyle = '#000'
  hgt.fillRect(0, 0, W, H)
  const zones: { x: number; y: number; rx: number; ry: number; colours: string[] }[] = [
    { x: -0.3, y: 0.42, rx: 0.3, ry: 0.25, colours: ['#f2c230', '#e8b21e', '#f6d75a', '#d9a514', '#a8b83a'] },
    { x: 0.08, y: 0.5, rx: 0.25, ry: 0.22, colours: ['#ee6a1f', '#f27f2e', '#e45812', '#f39a4a'] },
    { x: 0.52, y: 0.34, rx: 0.35, ry: 0.32, colours: ['#c8312b', '#b3261f', '#d4442f', '#9e2a22', '#c9573a'] },
    { x: 0.78, y: 0.06, rx: 0.18, ry: 0.2, colours: ['#2f8a3e', '#3a9a46', '#24702f', '#4aa652'] },
    { x: -0.08, y: 0.06, rx: 0.32, ry: 0.22, colours: ['#f5f3ee', '#e8eef5', '#dfe7ef', '#ffffff', '#cfdcea'] },
    { x: -0.55, y: -0.32, rx: 0.42, ry: 0.32, colours: ['#1f5fd6', '#2b6ff0', '#173f9e', '#4a86e8', '#0f2f7a', '#6ea0f0'] },
    { x: 0.22, y: -0.42, rx: 0.3, ry: 0.22, colours: ['#a493de', '#b5a6e8', '#8c7ccf', '#c9bdf0', '#e0a0a0'] },
    { x: 0.66, y: -0.34, rx: 0.2, ry: 0.2, colours: ['#2a2a2e', '#4a4a50', '#6e6e76', '#1a1a1d'] },
  ]
  for (const zone of zones) {
    const patch = new Path2D()
    for (let i = 0; i <= 24; i++) {
      const angle = (i / 24) * Math.PI * 2
      const r = 1.2 + Math.sin(angle * 3 + zone.x * 7) * 0.12 + Math.cos(angle * 5 + zone.y * 5) * 0.08
      const [px, py] = toPx(zone.x + Math.cos(angle) * zone.rx * r, zone.y + Math.sin(angle) * zone.ry * r)
      if (i) patch.lineTo(px, py)
      else patch.moveTo(px, py)
    }
    c.fillStyle = zone.colours[0]
    c.fill(patch)
    hgt.fillStyle = '#5a5a5a'
    hgt.fill(patch)
  }
  c.globalAlpha = 0.85
  for (let pass = 0; pass < 2; pass++) {
    for (const zone of zones) {
      for (let i = 0; i < 70; i++) {
        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * 1.15
        const [px, py] = toPx(zone.x + Math.cos(angle) * zone.rx * r, zone.y + Math.sin(angle) * zone.ry * r)
        const length = 15 + Math.random() * 40
        const turn = Math.random() * Math.PI
        const width = 20 + Math.random() * 34
        const path = new Path2D()
        path.moveTo(px - Math.cos(turn) * length, py - Math.sin(turn) * length)
        path.quadraticCurveTo(px + (Math.random() - 0.5) * 30, py + (Math.random() - 0.5) * 30, px + Math.cos(turn) * length, py + Math.sin(turn) * length)
        c.lineCap = hgt.lineCap = 'round'
        c.lineWidth = hgt.lineWidth = width
        c.strokeStyle = zone.colours[Math.floor(Math.random() * zone.colours.length)]
        c.stroke(path)
        const v = 110 + Math.floor(Math.random() * 120)
        hgt.strokeStyle = `rgb(${v},${v},${v})`
        hgt.stroke(path)
        hgt.lineWidth = width * 0.35
        hgt.strokeStyle = `rgb(${v + 30},${v + 30},${v + 30})`
        hgt.stroke(path)
      }
    }
  }
  c.globalAlpha = 1
  hgt.filter = 'blur(2px)'
  hgt.drawImage(height, 0, 0)
  hgt.filter = 'none'
  const [hx, hy] = toPx(-0.5, -0.05)
  const holeR = (0.15 / 2.1) * W
  for (const ctx of [c, hgt]) {
    ctx.save()
    ctx.globalCompositeOperation = ctx === c ? 'destination-out' : 'source-over'
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(hx, hy, holeR, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  const paintMap = new THREE.CanvasTexture(colour)
  paintMap.colorSpace = THREE.SRGBColorSpace
  const bumpMap = new THREE.CanvasTexture(height)
  for (const texture of [paintMap, bumpMap]) {
    texture.repeat.set(1 / 2.1, 1 / 1.56)
    texture.offset.set(0.5, 0.5)
    texture.anisotropy = 8
  }
  const paintGeometry = new THREE.ShapeGeometry(outline, 48)
  paintGeometry.rotateX(-Math.PI / 2)
  group.add(
    mesh(
      paintGeometry,
      physical('#ffffff', {
        map: paintMap,
        bumpMap,
        bumpScale: 5,
        roughness: 0.42,
        clearcoat: 0.45,
        clearcoatRoughness: 0.3,
        transparent: true,
        alphaTest: 0.4,
      }),
      0,
      0.056,
      0,
    ),
  )

  const globs: [number, number, number, string][] = [
    [0.1, 0.52, 0.12, '#ee6a1f'],
    [0.62, 0.28, 0.13, '#c8312b'],
    [0.8, 0.02, 0.11, '#2f8a3e'],
    [-0.62, -0.42, 0.13, '#1f5fd6'],
    [-0.1, 0.08, 0.1, '#f7f6f2'],
  ]
  for (const [x, y, radius, colour] of globs) {
    const geometry = new THREE.SphereGeometry(radius, 28, 16)
    const position = geometry.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i)
      const lump = 1 + 0.18 * Math.sin(v.x * 40 + x * 9) * Math.cos(v.z * 35 + y * 7) + 0.08 * Math.sin(v.y * 60)
      v.multiplyScalar(lump)
      position.setXYZ(i, v.x, v.y, v.z)
    }
    geometry.computeVertexNormals()
    const glob = mesh(geometry, physical(colour, { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 }), x, 0.07, -y)
    glob.scale.set(1, 0.32, 0.9)
    group.add(glob)
  }

  const brush = (handleColour: string, tipColour: string, thickness: number, length: number) => {
    const b = new THREE.Group()
    b.add(mesh(new THREE.CylinderGeometry(thickness * 0.55, thickness, length, 20), physical(handleColour, { roughness: 0.35, clearcoat: 0.8 }), 0, -length / 2, 0))
    b.add(mesh(new THREE.CylinderGeometry(thickness * 1.05, thickness, 0.2, 20), physical('#c9ccd0', { roughness: 0.25, metalness: 1 }), 0, 0.1, 0))
    const tuft = new THREE.LatheGeometry(
      [0, 0.3, 0.6, 0.85, 1].map((t) => new THREE.Vector2(thickness * 1.15 * Math.sin(Math.PI * (0.15 + t * 0.85)) * (1 - t * 0.6), t * 0.26)),
      20,
    )
    b.add(mesh(tuft, physical(tipColour, { roughness: 0.6, clearcoat: 0.4 }), 0, 0.2, 0))
    return b
  }
  const fat = brush('#d9c39a', '#d4442f', 0.045, 1.2)
  fat.position.set(0.25, 0.14, 0.12)
  fat.rotation.set(Math.PI / 2, 0, -2.25)
  const slim = brush('#7a1f1a', '#3a2a25', 0.028, 1.3)
  slim.position.set(0.42, 0.12, -0.02)
  slim.rotation.set(Math.PI / 2, 0, -1.95)
  group.add(fat, slim)

  const brushes = [fat, slim].map((brush) => ({ brush, velocity: new THREE.Vector3(), spin: new THREE.Vector3(), falling: false }))
  const clicks: number[] = []
  let now = 0
  let lastTime = 0
  group.userData.onSpin = () => {
    clicks.push(now)
    while (clicks.length && now - clicks[0] > 1.2) clicks.shift()
    if (clicks.length < 3) return false
    clicks.length = 0
    let scene: THREE.Object3D = group
    while (scene.parent) scene = scene.parent
    brushes.forEach((b, i) => {
      if (b.falling) return
      scene.attach(b.brush)
      b.falling = true
      const side = i === 0 ? -1 : 1
      b.velocity.set(side * (0.6 + Math.random() * 0.6), 0.8 + Math.random() * 0.6, 0.3)
      b.spin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, side * (4 + Math.random() * 4))
    })
    return false
  }
  group.userData.update = (time: number) => {
    now = time
    const dt = Math.min(Math.max(time - lastTime, 0), 0.05)
    lastTime = time
    for (const b of brushes) {
      if (!b.falling || !b.brush.visible) continue
      b.velocity.y -= 6 * dt
      b.brush.position.addScaledVector(b.velocity, dt)
      b.brush.rotation.x += b.spin.x * dt
      b.brush.rotation.y += b.spin.y * dt
      b.brush.rotation.z += b.spin.z * dt
      if (b.brush.position.y < -4) b.brush.visible = false
    }
  }

  group.rotation.x = 0.85
  group.userData.facing = true
  group.userData.bleed = 2
  return group
}

function polaroid() {
  const group = new THREE.Group()
  const photoW = 1.3
  const photoH = (photoW * 1138) / 1200
  const margin = 0.08
  const strip = 0.34
  const cardW = photoW + margin * 2
  const cardH = photoH + margin + strip

  const card = mesh(new THREE.BoxGeometry(cardW, cardH, 0.02), physical('#f3f1ea', { roughness: 0.85 }))
  const photo = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}favorites/polaroid.jpg`)
  photo.colorSpace = THREE.SRGBColorSpace
  photo.anisotropy = 8
  const picture = mesh(
    new THREE.PlaneGeometry(photoW, photoH),
    new THREE.MeshBasicMaterial({ map: photo, toneMapped: false }),
    0,
    cardH / 2 - margin - photoH / 2,
    0.0105,
  )
  const filmBack = painted(512, Math.round((512 * cardH) / cardW), (ctx) => {
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    ctx.fillStyle = '#e9e7e1'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#9ea0a3'
    ctx.fillRect(10, 10, w - 20, h * 0.07)
    ctx.fillRect(10, h * 0.8, w - 20, h * 0.2 - 10)
    const dark = ctx.createLinearGradient(0, 0, w, h)
    dark.addColorStop(0, '#2a2026')
    dark.addColorStop(1, '#120d10')
    ctx.fillStyle = dark
    ctx.fillRect(10, h * 0.07 + 10, w - 20, h * 0.73 - 20)
  })
  const back = mesh(
    new THREE.PlaneGeometry(cardW, cardH),
    physical('#ffffff', { map: filmBack, roughness: 0.25, clearcoat: 0.8 }),
    0,
    0,
    -0.0105,
  )
  back.rotation.y = Math.PI
  group.add(card, picture, back)
  group.scale.setScalar(1.15)
  group.userData.facing = true
  return group
}

export const models = { laptop, coffee, camera, palette, polaroid }
