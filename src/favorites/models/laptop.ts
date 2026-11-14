import * as THREE from 'three'
import { physical, painted, mesh, roundedBox, softBox, roundRect } from './shared'

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

export function laptop() {
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
    const speaker = mesh(
      new THREE.PlaneGeometry(90 * px, 275 * px),
      physical('#ffffff', { map: grilleTexture, roughness: 0.7 }),
      side * 415 * px,
      top,
      wellZ,
    )
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
  const scoop = mesh(
    new THREE.BoxGeometry(135 * px, T * 0.45, 0.012),
    physical('#1c1d1f', { metalness: 0.6, roughness: 0.4 }),
    0,
    -T * 0.3,
    D / 2 - 0.004,
  )

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

  for (const [fx, fz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    group.add(
      mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.01, 20),
        physical('#111112', { roughness: 0.9 }),
        fx * (W / 2 - 0.12),
        -T - 0.004,
        fz * (D / 2 - 0.12),
      ),
    )
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
    const w = 1024
    const h = ctx.canvas.height
    const mono = (size: number, weight = 400) => `${weight} ${size}px "JetBrains Mono", ui-monospace, monospace`
    const C = {
      bg: '#0f1417',
      side: '#0b1013',
      bar: '#080b0d',
      line: '#1c2429',
      dim: '#4a5a62',
      text: '#c9d4d8',
      accent: '#86d2dc',
      key: '#c792ea',
      str: '#a5d6a7',
      fn: '#82aaff',
      num: '#f0b37e',
      tag: '#f07178',
      live: '#3fb56b',
    }

    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = C.bar
    ctx.fillRect(0, 0, w, 30)
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((colour, i) => {
      ctx.fillStyle = colour
      ctx.beginPath()
      ctx.arc(18 + i * 18, 15, 5, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.font = mono(12)
    ctx.fillStyle = C.dim
    ctx.textAlign = 'center'
    ctx.fillText('asejs.github.io — App.vue', w / 2, 19)
    ctx.textAlign = 'left'

    const sideW = 190
    ctx.fillStyle = C.side
    ctx.fillRect(0, 30, sideW, h - 30)
    ctx.font = mono(11, 500)
    ctx.fillStyle = C.dim
    ctx.fillText('EXPLORER', 16, 54)
    const tree: [number, string, boolean?][] = [
      [0, '▾ src'],
      [1, '▾ components'],
      [2, 'ProjectCard.vue'],
      [2, 'SiteNav.vue'],
      [2, 'TypedText.vue'],
      [1, '▾ favorites'],
      [2, 'models.ts'],
      [1, 'App.vue', true],
      [1, 'data.ts'],
      [1, 'main.ts'],
      [0, '▸ public'],
      [0, 'package.json'],
      [0, 'vite.config.ts'],
    ]
    ctx.font = mono(12)
    tree.forEach(([depth, name, active], i) => {
      const y = 80 + i * 22
      if (active) {
        ctx.fillStyle = '#16232a'
        ctx.fillRect(0, y - 15, sideW, 22)
        ctx.fillStyle = C.accent
        ctx.fillRect(0, y - 15, 2, 22)
      }
      ctx.fillStyle = active ? C.text : name.startsWith('▾') || name.startsWith('▸') ? C.text : '#7d8c93'
      ctx.fillText(name, 16 + depth * 14, y)
    })

    ctx.fillStyle = C.bar
    ctx.fillRect(sideW, 30, w - sideW, 32)
    ;['App.vue', 'data.ts', 'SiteNav.vue'].forEach((tab, i) => {
      const x = sideW + i * 120
      ctx.fillStyle = i === 0 ? C.bg : C.bar
      ctx.fillRect(x, 30, 120, 32)
      if (i === 0) {
        ctx.fillStyle = C.accent
        ctx.fillRect(x, 30, 120, 2)
      }
      ctx.fillStyle = i === 0 ? C.text : C.dim
      ctx.font = mono(12)
      ctx.fillText(tab, x + 16, 51)
    })

    const code: [string, string][][] = [
      [
        [C.dim, '<'],
        [C.tag, 'script'],
        [C.key, ' setup lang'],
        [C.dim, '='],
        [C.str, '"ts"'],
        [C.dim, '>'],
      ],
      [
        [C.key, 'import'],
        [C.text, ' { computed } '],
        [C.key, 'from'],
        [C.str, " 'vue'"],
      ],
      [
        [C.key, 'import'],
        [C.text, ' { profile, projects } '],
        [C.key, 'from'],
        [C.str, " './data'"],
      ],
      [],
      [
        [C.key, 'const'],
        [C.text, ' current '],
        [C.dim, '= '],
        [C.fn, 'computed'],
        [C.text, '(() '],
        [C.key, '=>'],
      ],
      [
        [C.text, '  projects.'],
        [C.fn, 'find'],
        [C.text, '((p) '],
        [C.key, '=>'],
        [C.text, ' p.period.'],
        [C.fn, 'endsWith'],
        [C.text, '('],
        [C.str, "'nå'"],
        [C.text, '))'],
      ],
      [[C.text, ')']],
      [
        [C.dim, '</'],
        [C.tag, 'script'],
        [C.dim, '>'],
      ],
      [],
      [
        [C.dim, '<'],
        [C.tag, 'template'],
        [C.dim, '>'],
      ],
      [
        [C.dim, '  <'],
        [C.tag, 'header'],
        [C.key, ' class'],
        [C.dim, '='],
        [C.str, '"hero"'],
        [C.dim, '>'],
      ],
      [
        [C.dim, '    <'],
        [C.tag, 'h1'],
        [C.dim, '>'],
        [C.text, '{{ profile.name }}'],
        [C.dim, '</'],
        [C.tag, 'h1'],
        [C.dim, '>'],
      ],
      [
        [C.dim, '    <'],
        [C.tag, 'p'],
        [C.key, ' class'],
        [C.dim, '='],
        [C.str, '"eyebrow"'],
        [C.dim, '>'],
        [C.accent, '// FRONTEND-UTVIKLER'],
        [C.dim, '</'],
        [C.tag, 'p'],
        [C.dim, '>'],
      ],
      [
        [C.dim, '    <'],
        [C.tag, 'NowCard'],
        [C.key, ' v-if'],
        [C.dim, '='],
        [C.str, '"current"'],
        [C.key, ' :job'],
        [C.dim, '='],
        [C.str, '"current"'],
        [C.dim, ' />'],
      ],
      [
        [C.dim, '  </'],
        [C.tag, 'header'],
        [C.dim, '>'],
      ],
      [
        [C.dim, '</'],
        [C.tag, 'template'],
        [C.dim, '>'],
      ],
    ]
    const codeX = sideW + 56
    const lineH = 22
    ctx.font = mono(14)
    code.forEach((runs, i) => {
      const y = 92 + i * lineH
      if (i === 12) {
        ctx.fillStyle = '#131c20'
        ctx.fillRect(sideW, y - 16, w - sideW, lineH)
      }
      ctx.fillStyle = i === 12 ? C.text : '#33414a'
      ctx.textAlign = 'right'
      ctx.fillText(String(i + 1), codeX - 18, y)
      ctx.textAlign = 'left'
      let x = codeX
      for (const [colour, text] of runs) {
        ctx.fillStyle = colour
        ctx.fillText(text, x, y)
        x += ctx.measureText(text).width
      }
      if (i === 12) {
        ctx.fillStyle = C.accent
        ctx.fillRect(x + 2, y - 14, 2, 18)
      }
    })

    const termY = h - 150
    ctx.fillStyle = C.bar
    ctx.fillRect(sideW, termY, w - sideW, 128)
    ctx.fillStyle = C.line
    ctx.fillRect(sideW, termY, w - sideW, 1)
    ctx.font = mono(11, 500)
    ctx.fillStyle = C.text
    ctx.fillText('TERMINAL', sideW + 16, termY + 22)
    ctx.fillStyle = C.dim
    ctx.fillText('PROBLEMS    OUTPUT', sideW + 100, termY + 22)
    ctx.font = mono(13)
    const term: [string, string][][] = [
      [
        [C.live, '➜ '],
        [C.accent, 'asejs.github.io '],
        [C.key, 'git:('],
        [C.tag, 'main'],
        [C.key, ') '],
        [C.text, 'npm run build'],
      ],
      [[C.dim, 'vite v6 building for production...']],
      [
        [C.live, '✓ '],
        [C.text, '412 modules transformed. '],
        [C.dim, 'built in '],
        [C.num, '1.84s'],
      ],
    ]
    term.forEach((runs, i) => {
      let x = sideW + 16
      for (const [colour, text] of runs) {
        ctx.fillStyle = colour
        ctx.fillText(text, x, termY + 52 + i * 22)
        x += ctx.measureText(text).width
      }
    })

    ctx.fillStyle = '#0e4a4f'
    ctx.fillRect(0, h - 22, w, 22)
    ctx.font = mono(11)
    ctx.fillStyle = '#d8f3f6'
    ctx.fillText('⎇ main   ✓ 0  ⚠ 0', 12, h - 7)
    ctx.textAlign = 'right'
    ctx.fillText('Ln 13, Col 58   UTF-8   Vue   TypeScript 5.6', w - 12, h - 7)
    ctx.textAlign = 'left'
  })
  const screen = mesh(
    new THREE.PlaneGeometry(screenW, screenH),
    new THREE.MeshPhysicalMaterial({
      map: editor,
      emissiveMap: editor,
      emissive: '#ffffff',
      emissiveIntensity: 0.85,
      roughness: 0.05,
      clearcoat: 1,
    }),
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

  const hinge = mesh(
    new THREE.CylinderGeometry(0.022, 0.022, W - 0.5, 20),
    physical('#1a1b1d', { metalness: 0.7, roughness: 0.4 }),
    0,
    0.0,
    -D / 2 + 0.02,
  )
  hinge.rotation.z = Math.PI / 2

  group.add(base, well, trackpad, scoop, keys, legends, hinge, lid)
  group.position.y = -0.35
  group.rotation.x = 0.35
  return group
}
