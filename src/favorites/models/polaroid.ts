import * as THREE from 'three'
import { physical, painted, mesh } from './shared'

export function polaroid() {
  const group = new THREE.Group()
  const photoW = 1.3
  const photoH = (photoW * 1138) / 1200
  const margin = 0.08
  const strip = 0.34
  const cardW = photoW + margin * 2
  const cardH = photoH + margin + strip

  const emboss = painted(64, 64, (ctx) => {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 64, 64)
    for (let y = 0; y < 64; y += 8) {
      for (let x = (y / 8) % 2 ? 4 : 0; x < 64 + 8; x += 8) {
        const gradient = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, 4)
        gradient.addColorStop(0, '#d0d0d0')
        gradient.addColorStop(1, '#606060')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(x, y - 3.5)
        ctx.lineTo(x + 3.5, y)
        ctx.lineTo(x, y + 3.5)
        ctx.lineTo(x - 3.5, y)
        ctx.fill()
      }
    }
  })
  emboss.colorSpace = THREE.NoColorSpace
  emboss.wrapS = emboss.wrapT = THREE.RepeatWrapping
  emboss.repeat.set(cardW * 22, cardH * 22)

  const card = mesh(
    new THREE.BoxGeometry(cardW, cardH, 0.02),
    physical('#bdb7aa', {
      roughness: 0.95,
      roughnessMap: emboss,
      bumpMap: emboss,
      bumpScale: 1.2,
      specularIntensity: 0.35,
      envMapIntensity: 0.5,
    }),
  )
  const photo = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}favorites/polaroid.webp`)
  photo.colorSpace = THREE.SRGBColorSpace
  photo.anisotropy = 8
  const picture = mesh(
    new THREE.PlaneGeometry(photoW, photoH),
    new THREE.MeshBasicMaterial({ map: photo, color: '#c8c8c8', toneMapped: false }),
    0,
    cardH / 2 - margin - photoH / 2,
    0.0105,
  )
  const filmBack = painted(512, Math.round((512 * cardH) / cardW), (ctx) => {
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    ctx.fillStyle = '#bdb7aa'
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
