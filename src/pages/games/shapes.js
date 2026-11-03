/**
 * Point-cloud targets the particles morph between. Each returns a
 * Float32Array of `count * 3` world positions (camera sits at z = 9).
 */

// MediaPipe's 21 hand landmarks, posed as an open right hand facing the camera.
const LANDMARKS = [
  [0, -1.6, 0],
  [0.45, -1.25, 0.1], [0.8, -0.85, 0.15], [1.05, -0.45, 0.2], [1.25, -0.1, 0.22],
  [0.42, -0.2, 0], [0.5, 0.35, 0.05], [0.55, 0.75, 0.1], [0.58, 1.1, 0.14],
  [0.05, -0.15, 0], [0.07, 0.5, 0.05], [0.08, 0.95, 0.1], [0.09, 1.35, 0.14],
  [-0.3, -0.2, 0], [-0.36, 0.35, 0.05], [-0.4, 0.75, 0.1], [-0.42, 1.1, 0.14],
  [-0.6, -0.35, 0], [-0.72, 0.05, 0.05], [-0.8, 0.38, 0.1], [-0.86, 0.65, 0.12],
]
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11],
  [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
]
const PALM = [0, 1, 5, 9, 13, 17]

// Deterministic PRNG so every visit (and every target) is stable.
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gauss = (r) => {
  const u = Math.max(1e-6, r()), v = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// Per-particle constants: stagger/heat seed and point size (few big, many small).
export function particleSeeds(count, seed = 7) {
  const r = rng(seed)
  const rand = new Float32Array(count)
  const scale = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    rand[i] = r()
    scale[i] = 0.45 + Math.pow(r(), 3) * 1.6
  }
  return { rand, scale }
}

export function scatter(count, seed = 1) {
  const r = rng(seed)
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rad = 3 + r() * 6
    const s = Math.sqrt(1 - u * u)
    out.set([s * Math.cos(th) * rad * 1.6, u * rad, s * Math.sin(th) * rad - 2], i * 3)
  }
  return out
}

export function hand(count, { scale = 1.45, seed = 2, tilt = 0.25 } = {}) {
  const r = rng(seed)
  const out = new Float32Array(count * 3)
  const ct = Math.cos(tilt), st = Math.sin(tilt)
  for (let i = 0; i < count; i++) {
    const pick = r()
    let p
    if (pick < 0.22) {
      // joints: dense knots, like landmark dots
      const L = LANDMARKS[Math.floor(r() * 21)]
      p = [L[0] + gauss(r) * 0.045, L[1] + gauss(r) * 0.045, L[2] + gauss(r) * 0.045]
    } else if (pick < 0.8) {
      // bones: thin tubes between landmarks
      const [a, b] = BONES[Math.floor(r() * BONES.length)]
      const t = r()
      const A = LANDMARKS[a], B = LANDMARKS[b]
      const th = 0.035 + r() * 0.03
      p = [A[0] + (B[0] - A[0]) * t + gauss(r) * th, A[1] + (B[1] - A[1]) * t + gauss(r) * th, A[2] + (B[2] - A[2]) * t + gauss(r) * th]
    } else {
      // palm: sparse dust inside the palm polygon (fan triangulation)
      const k = 1 + Math.floor(r() * (PALM.length - 2))
      const A = LANDMARKS[PALM[0]], B = LANDMARKS[PALM[k]], C = LANDMARKS[PALM[k + 1]]
      let u = r(), v = r()
      if (u + v > 1) { u = 1 - u; v = 1 - v }
      p = [A[0] + (B[0] - A[0]) * u + (C[0] - A[0]) * v, A[1] + (B[1] - A[1]) * u + (C[1] - A[1]) * v, gauss(r) * 0.06]
    }
    // slight tilt toward the camera so it reads as 3D
    const y = p[1] * ct - p[2] * st, z = p[1] * st + p[2] * ct
    out.set([p[0] * scale, y * scale + 0.15, z * scale], i * 3)
  }
  return out
}

// Camera lens / iris: concentric barrel rings stepping back in depth + aperture blades.
export function lens(count, seed = 3) {
  const r = rng(seed)
  const out = new Float32Array(count * 3)
  const rings = [0.55, 0.95, 1.35, 1.8, 2.25, 2.6]
  for (let i = 0; i < count; i++) {
    const pick = r()
    let p
    if (pick < 0.62) {
      const ring = rings[Math.floor(r() * rings.length)]
      const a = r() * Math.PI * 2
      const rad = ring + gauss(r) * 0.025
      p = [Math.cos(a) * rad, Math.sin(a) * rad, -ring * 0.55 + gauss(r) * 0.03]
    } else if (pick < 0.85) {
      // six aperture blades, slightly curved
      const blade = Math.floor(r() * 6)
      const t = r()
      const a0 = (blade / 6) * Math.PI * 2
      const rad = 0.32 + t * 1.25
      const a = a0 + t * 0.9
      p = [Math.cos(a) * rad + gauss(r) * 0.02, Math.sin(a) * rad + gauss(r) * 0.02, -0.15 - t * 0.5]
    } else {
      // pupil: bright dense core
      const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * 0.3
      p = [Math.cos(a) * rad, Math.sin(a) * rad, 0.1 + gauss(r) * 0.04]
    }
    out.set(p, i * 3)
  }
  return out
}

// Sample filled pixels of something drawn on a 2D canvas (used for the gamepad).
function fromCanvas(count, draw, { w = 520, h = 300, width = 6.2, seed = 4, depth = 0.22 }) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  draw(ctx, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  const filled = []
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 128) filled.push(x, y)
  const r = rng(seed)
  const out = new Float32Array(count * 3)
  const k = width / w
  const n = filled.length / 2
  for (let i = 0; i < count; i++) {
    const j = Math.floor(r() * n) * 2
    out.set([(filled[j] - w / 2 + r() * 2) * k, -(filled[j + 1] - h / 2 + r() * 2) * k, gauss(r) * depth], i * 3)
  }
  return out
}

export function gamepad(count) {
  return fromCanvas(count, (ctx, w) => {
    ctx.fillStyle = '#fff'
    // body: wide rounded bar + two grips
    ctx.beginPath()
    ctx.roundRect(70, 60, w - 140, 120, 60)
    ctx.fill()
    ctx.beginPath(); ctx.ellipse(120, 175, 78, 105, -0.35, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(w - 120, 175, 78, 105, 0.35, 0, Math.PI * 2); ctx.fill()
    // cut-outs: d-pad, face buttons, sticks, menu pills
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillRect(105, 105, 70, 22); ctx.fillRect(129, 81, 22, 70)
    for (const [x, y] of [[w - 140, 82], [w - 140, 140], [w - 168, 111], [w - 112, 111]]) {
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill()
    }
    for (const x of [w / 2 - 70, w / 2 + 70]) {
      ctx.beginPath(); ctx.arc(x, 175, 30, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
    for (const x of [w / 2 - 70, w / 2 + 70]) { ctx.beginPath(); ctx.arc(x, 175, 17, 0, Math.PI * 2); ctx.fill() }
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath(); ctx.roundRect(w / 2 - 40, 98, 26, 12, 6); ctx.fill()
    ctx.beginPath(); ctx.roundRect(w / 2 + 14, 98, 26, 12, 6); ctx.fill()
  }, { w: 520, h: 300, width: 6.4 })
}

// Perspective floor grid: the "level select" stage the cards sit on.
export function floor(count, seed = 5) {
  const r = rng(seed)
  const out = new Float32Array(count * 3)
  const step = 0.75
  for (let i = 0; i < count; i++) {
    const alongX = r() < 0.5
    const t = r()
    let x, z
    if (alongX) { x = -12 + t * 24; z = -16 + Math.round(r() * 24) * step }
    else { z = -16 + t * 19; x = -12 + Math.round(r() * 32) * step }
    out.set([x, -2.6 + gauss(r) * 0.01, Math.min(2.5, z)], i * 3)
  }
  return out
}
