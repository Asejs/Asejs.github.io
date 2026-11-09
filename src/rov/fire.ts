import * as THREE from 'three'

const NOISE = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }
`

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  ${NOISE}
  void main() {
    vec3 p = position;
    float wobble = noise(p * 3.0 + vec3(uSeed, uTime * 1.5, uSeed * 0.5));
    p += normal * (wobble - 0.5) * 0.45;
    vLocal = position * 2.5 + uSeed;
    vec4 world = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-world.xyz);
    gl_Position = projectionMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uDissolve;
  uniform float uTime;
  uniform vec3 uCore;
  uniform vec3 uMid;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  ${NOISE}
  void main() {
    float n = noise(vLocal + vec3(0.0, -uTime * 2.0, 0.0)) * 0.7 + noise(vLocal * 2.3) * 0.3;
    if (n < uDissolve) discard;
    float edge = smoothstep(uDissolve, uDissolve + 0.06, n);
    float fresnel = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
    vec3 color = fresnel < 0.45 ? uCore : fresnel < 0.75 ? uMid : uRim;
    color = mix(uRim, color, edge);
    gl_FragColor = vec4(color, 1.0);
  }
`

const FIRE = { core: '#fff25a', mid: '#ffb21f', rim: '#ff3d1a' }
const SMOKE = { core: '#6b5a70', mid: '#54455b', rim: '#3d3045' }

function flameMaterial(colors: typeof FIRE, seed: number) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seed },
      uDissolve: { value: 0 },
      uCore: { value: new THREE.Color(colors.core) },
      uMid: { value: new THREE.Color(colors.mid) },
      uRim: { value: new THREE.Color(colors.rim) },
    },
  })
}

interface Blob {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
  velocity: THREE.Vector3
  size: number
  delay: number
  life: number
}

export const BLAST_SECONDS = 1.5

const geometry = new THREE.IcosahedronGeometry(1, 4)

export function createFireball(position: THREE.Vector3) {
  const group = new THREE.Group()
  group.position.copy(position)
  const blobs: Blob[] = []
  const add = (colors: typeof FIRE, count: number, sizeRange: [number, number], spread: number, rise: number, delay: number, life: number) => {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, flameMaterial(colors, Math.random() * 100))
      mesh.position.set((Math.random() - 0.5) * spread, (Math.random() - 0.3) * spread, (Math.random() - 0.5) * spread)
      mesh.scale.setScalar(0.001)
      const velocity = mesh.position.clone().normalize().multiplyScalar(0.6 + Math.random() * 0.8)
      velocity.y += rise
      blobs.push({ mesh, velocity, size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]), delay: delay * Math.random(), life })
      group.add(mesh)
    }
  }
  add(SMOKE, 3, [0.22, 0.36], 0.5, 0.6, 0.35, 1.1)
  add(FIRE, 10, [0.3, 0.55], 0.45, 0.8, 0.1, 1.0)

  const light = new THREE.PointLight('#ff7a1a', 35, 8)
  group.add(light)

  let age = 0
  return {
    group,
    update(dt: number) {
      age += dt
      light.intensity = Math.max(0, 35 * (1 - age * 2))
      for (const blob of blobs) {
        const t = (age - blob.delay) / blob.life
        if (t < 0) continue
        const grow = Math.min(1, t / 0.15)
        const scale = blob.size * (0.4 + 0.6 * (1 - Math.pow(1 - grow, 3))) * (1 + t * 0.4)
        blob.mesh.scale.setScalar(Math.max(0.001, scale))
        blob.mesh.position.addScaledVector(blob.velocity, dt)
        blob.velocity.multiplyScalar(0.94)
        blob.mesh.material.uniforms.uTime.value = age
        blob.mesh.material.uniforms.uDissolve.value = Math.max(0, (t - 0.45) / 0.55)
      }
      return age < BLAST_SECONDS
    },
    dispose() {
      blobs.forEach((blob) => blob.mesh.material.dispose())
    },
  }
}
