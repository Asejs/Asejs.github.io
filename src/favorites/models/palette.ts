import * as THREE from 'three'
import { physical, painted, mesh } from './shared'

export function palette() {
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
    { x: -0.3, y: 0.42, rx: 0.3, ry: 0.25, colours: ['#8a6418', '#9c7420', '#6e4e12', '#a9832c', '#5c4a1a'] },
    { x: 0.08, y: 0.5, rx: 0.25, ry: 0.22, colours: ['#7a2d12', '#8e3a18', '#5e220e', '#9a4a24'] },
    { x: 0.52, y: 0.34, rx: 0.35, ry: 0.32, colours: ['#7a1018', '#5e0b12', '#8f1820', '#4a080e', '#a0222a'] },
    { x: 0.78, y: 0.06, rx: 0.18, ry: 0.2, colours: ['#0e4a4f', '#14606a', '#0a3a3e', '#1f7a84'] },
    { x: -0.08, y: 0.06, rx: 0.32, ry: 0.22, colours: ['#d8d2c4', '#c9c2b2', '#e4dfd3', '#b8b0a0', '#cfc8b8'] },
    { x: -0.55, y: -0.32, rx: 0.42, ry: 0.32, colours: ['#14234a', '#1b2f60', '#0d1836', '#24407a', '#0a1228', '#2f4d86'] },
    { x: 0.22, y: -0.42, rx: 0.3, ry: 0.22, colours: ['#3e2550', '#4e3064', '#2e1b3c', '#5e3c74', '#5a2a3a'] },
    { x: 0.66, y: -0.34, rx: 0.2, ry: 0.2, colours: ['#121214', '#1e1e22', '#2c2c32', '#0a0a0c'] },
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
        path.quadraticCurveTo(
          px + (Math.random() - 0.5) * 30,
          py + (Math.random() - 0.5) * 30,
          px + Math.cos(turn) * length,
          py + Math.sin(turn) * length,
        )
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
    b.add(
      mesh(
        new THREE.CylinderGeometry(thickness * 0.55, thickness, length, 20),
        physical(handleColour, { roughness: 0.35, clearcoat: 0.8 }),
        0,
        -length / 2,
        0,
      ),
    )
    b.add(
      mesh(
        new THREE.CylinderGeometry(thickness * 1.05, thickness, 0.2, 20),
        physical('#c9ccd0', { roughness: 0.25, metalness: 1 }),
        0,
        0.1,
        0,
      ),
    )
    const tuft = new THREE.LatheGeometry(
      [0, 0.3, 0.6, 0.85, 1].map(
        (t) => new THREE.Vector2(thickness * 1.15 * Math.sin(Math.PI * (0.15 + t * 0.85)) * (1 - t * 0.6), t * 0.26),
      ),
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
