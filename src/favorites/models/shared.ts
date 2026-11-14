import * as THREE from 'three'

export const physical = (color: string, params: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, ...params })

export function painted(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext('2d')!)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export const speckle = (size: number, low: number, high: number) =>
  painted(size, size, (ctx) => {
    const image = ctx.createImageData(size, size)
    for (let i = 0; i < image.data.length; i += 4) {
      const v = low + Math.random() * (high - low)
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v
      image.data[i + 3] = 255
    }
    ctx.putImageData(image, 0, 0)
  })

export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(x, y, z)
  return m
}

export function roundedBox(width: number, height: number, depth: number, radius: number, extra: THREE.ExtrudeGeometryOptions = {}) {
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

export function softBox(width: number, height: number, depth: number, radius: number, bevel = 0.008) {
  const geometry = roundedBox(width - bevel * 2, height - bevel * 2, depth - bevel * 2, Math.max(radius - bevel, 0.001), {
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  })
  return geometry
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}
