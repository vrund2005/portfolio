import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ScrollTrigger } from '../../lib/gsap'

/**
 * Global scroll-driven 3D scene — a single "AI core": an obsidian orb that
 * organically deforms (simplex-noise displacement) with a neon fresnel rim,
 * wrapped in a wireframe cage, orbiting rings and a soft halo. It travels to
 * a new anchor point for every section, always parked in empty space so it
 * never sits under body text:
 *
 *   home     → huge dome rising below the hero (violet)   — raw data
 *   about    → left edge, glowing through the code card (cyan) — training
 *   skills   → right edge, calm and precise (emerald)     — the stack
 *   projects → small, high above the pinned cards (amber) — shipping
 *   contact  → crowning the heading, heartbeat pulse (rose) — connect
 *
 * Crossing a section boundary makes the core surge: displacement spikes,
 * rings whirl, the rim flares and the palette cross-fades. Scroll velocity
 * feeds extra energy so fast scrolling feels alive.
 *
 * Perf: ~6 draw calls, no postprocessing (halo is a canvas-gradient sprite),
 * dpr capped at 1.75, frameloop paused when the tab is hidden.
 */

const PALETTE = [
  ['#8b5cf6', '#818cf8'], // home — violet / indigo
  ['#22d3ee', '#38bdf8'], // about — cyan / sky
  ['#34d399', '#2dd4bf'], // skills — emerald / teal
  ['#fbbf24', '#fb923c'], // projects — amber / orange
  ['#fb7185', '#e879f9'], // contact — rose / fuchsia
]

// Transition i→i+1 plays while section i+1 scrolls into view
const MORPH_TRIGGERS = [
  { id: 'about', start: 'top 80%', end: 'top 25%' },
  { id: 'skills', start: 'top 80%', end: 'top 25%' },
  { id: 'projects', start: 'top 80%', end: 'top 25%' },
  { id: 'contact', start: 'top 85%', end: 'top 45%' },
]

/**
 * Per-section anchor + personality.
 * x: number (world units) or 'left'/'right' (viewport edge, resolved live)
 * amp: noise displacement (organic wobble), flicker: extra amp oscillation
 */
const SECTION_STATES = [
  { x: 0, y: -4.7, scale: 3.25, amp: 0.26, flicker: 0, ringSpeed: 0.3 },
  { x: 'left', y: -0.1, scale: 1.75, amp: 0.48, flicker: 0.14, ringSpeed: 0.9 },
  { x: 'right', y: -0.4, scale: 1.55, amp: 0.1, flicker: 0, ringSpeed: 0.5 },
  { x: 0, y: 3.4, scale: 1.0, amp: 0.32, flicker: 0, ringSpeed: 1.2 },
  { x: 0, y: 3.0, scale: 1.2, amp: 0.2, flicker: 0, ringSpeed: 0.7 },
]

// Ashima Arts 3D simplex noise (standard GLSL implementation)
const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`

const coreVertexShader = NOISE_GLSL + /* glsl */ `
  uniform float uTime;
  uniform float uAmp;

  varying vec3 vNormal;
  varying vec3 vView;
  varying float vNoise;

  void main() {
    float n = snoise(position * 1.35 + vec3(0.0, uTime * 0.32, 0.0));
    float n2 = snoise(position * 3.1 - vec3(uTime * 0.2));
    float disp = uAmp * (n + 0.35 * n2);
    vec3 p = position + normal * disp;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vNoise = n;
  }
`

const coreFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  uniform float uGlow;

  varying vec3 vNormal;
  varying vec3 vView;
  varying float vNoise;

  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
    // Dark obsidian body, faintly tinted by the noise field
    vec3 body = mix(vec3(0.015, 0.018, 0.045), uColorA * 0.22, 0.35 + 0.35 * vNoise);
    // Iridescent neon rim, flaring during transitions
    vec3 rim = mix(uColorA, uColorB, 0.5 + 0.5 * sin(uTime * 0.5 + vNoise * 3.0));
    vec3 col = body + rim * fres * (1.5 + uGlow * 2.4);
    // Faint energy bands crawling across the surface
    col += uColorB * 0.05 * sin(vNoise * 12.0 + uTime * 1.6);
    gl_FragColor = vec4(col, 0.97);
  }
`

const cageFragmentShader = /* glsl */ `
  uniform vec3 uColorB;
  uniform float uGlow;

  varying vec3 vNormal;
  varying vec3 vView;
  varying float vNoise;

  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 1.4);
    gl_FragColor = vec4(uColorB, (0.05 + 0.3 * fres) * (1.0 + uGlow * 1.6));
  }
`

// Soft radial gradient texture — fake bloom without postprocessing
function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.25)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.06)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(canvas)
}

const lerp = THREE.MathUtils.lerp

function AiCore({ store }) {
  const groupRef = useRef(null)
  const coreRef = useRef(null)
  const haloRef = useRef(null)
  const ring0Ref = useRef(null)
  const ring1Ref = useRef(null)
  const ring2Ref = useRef(null)
  const { viewport } = useThree()
  const motion = useRef({ journey: 0, spin: 0, vel: 0, lastY: window.scrollY })

  const assets = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: SECTION_STATES[0].amp },
      uGlow: { value: 0 },
      uColorA: { value: new THREE.Color(PALETTE[0][0]) },
      uColorB: { value: new THREE.Color(PALETTE[0][1]) },
    }
    const coreMaterial = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms,
      transparent: true,
    })
    const cageMaterial = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: cageFragmentShader,
      uniforms,
      wireframe: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return {
      uniforms,
      coreMaterial,
      cageMaterial,
      coreGeometry: new THREE.IcosahedronGeometry(1, 24),
      cageGeometry: new THREE.IcosahedronGeometry(1.06, 3),
      ringGeometry: new THREE.TorusGeometry(1.6, 0.012, 8, 96),
      ringMaterials: [0.5, 0.35, 0.25].map(
        (opacity) =>
          new THREE.MeshBasicMaterial({
            color: PALETTE[0][0],
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
      ),
      glowTexture: makeGlowTexture(),
      colorsA: PALETTE.map(([a]) => new THREE.Color(a)),
      colorsB: PALETTE.map(([, b]) => new THREE.Color(b)),
    }
  }, [])

  useEffect(() => {
    return () => {
      assets.coreGeometry.dispose()
      assets.cageGeometry.dispose()
      assets.ringGeometry.dispose()
      assets.coreMaterial.dispose()
      assets.cageMaterial.dispose()
      assets.ringMaterials.forEach((mat) => mat.dispose())
      assets.glowTexture.dispose()
    }
  }, [assets])

  useFrame((state, delta) => {
    const group = groupRef.current
    const core = coreRef.current
    const halo = haloRef.current
    const r0 = ring0Ref.current
    const r1 = ring1Ref.current
    const r2 = ring2Ref.current
    if (!group || !core || !halo || !r0 || !r1 || !r2) return

    const d = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const m = motion.current
    const { segs, mouse } = store.current

    // Ease the journey toward the scroll-driven target (0..4)
    const target = segs[0] + segs[1] + segs[2] + segs[3]
    m.journey += (target - m.journey) * Math.min(1, d * 4.5)

    // Scroll velocity → extra energy
    const scrollY = window.scrollY
    const v = Math.abs(scrollY - m.lastY) / Math.max(d, 0.001) / window.innerHeight
    m.lastY = scrollY
    m.vel += (Math.min(v * 0.5, 1.2) - m.vel) * Math.min(1, d * 4)

    const idx = Math.min(Math.floor(m.journey), SECTION_STATES.length - 2)
    const rawF = THREE.MathUtils.clamp(m.journey - idx, 0, 1)
    const f = rawF * rawF * (3 - 2 * rawF) // smoothstep between anchors
    const burst = Math.sin(rawF * Math.PI)

    // Resolve anchors (edge positions depend on live viewport width);
    // shrink on narrow screens but keep the core clearly present
    const shrink = Math.max(0.55, Math.min(1, viewport.width / 11))
    const halfW = viewport.width / 2
    const resolveX = (x) => {
      if (x === 'left') return -halfW + 1.5 * shrink
      if (x === 'right') return halfW - 1.5 * shrink
      return x
    }
    const a = SECTION_STATES[idx]
    const b = SECTION_STATES[idx + 1]

    // Travel between anchors with a swooping arc mid-flight
    const px = lerp(resolveX(a.x), resolveX(b.x), f)
    const py = lerp(a.y, b.y, f) + burst * 0.7
    const pz = burst * 1.2
    group.position.x += (px + mouse.x * 0.35 - group.position.x) * Math.min(1, d * 5)
    group.position.y += (py - mouse.y * 0.25 - group.position.y) * Math.min(1, d * 5)
    group.position.z += (pz - group.position.z) * Math.min(1, d * 5)

    // Heartbeat at the contact anchor — two soft thumps per cycle
    const heartness = THREE.MathUtils.clamp(m.journey - 3.2, 0, 0.8) / 0.8
    const beat = Math.pow(Math.max(Math.sin(t * 3.6), 0), 10) + 0.5 * Math.pow(Math.max(Math.sin(t * 3.6 + 0.5), 0), 10)
    const scale = lerp(a.scale, b.scale, f) * shrink * (1 + burst * 0.15 + heartness * beat * 0.09)
    group.scale.setScalar(scale)

    // Whoosh-spin during transitions, settle after; velocity keeps it alive
    m.spin += d * (0.001 + burst * 2.6)
    m.spin -= m.spin * Math.min(1, d * (1 - burst) * 0.8)
    group.rotation.y = m.spin + t * 0.14 + mouse.x * 0.25
    group.rotation.x = Math.sin(t * 0.11) * 0.1 + mouse.y * 0.18

    // Personality: displacement amplitude, flicker ("training"), rim glow.
    // Core and cage share the same uniforms object, so one write updates both.
    const flicker = lerp(a.flicker, b.flicker, f)
    const u = core.material.uniforms
    u.uTime.value = t
    u.uAmp.value = lerp(a.amp, b.amp, f) + burst * 0.4 + m.vel * 0.2 + flicker * Math.sin(t * 7.3) * Math.sin(t * 3.1)
    u.uGlow.value = burst + m.vel * 0.6 + heartness * beat * 0.8

    // Palette cross-fade
    u.uColorA.value.lerpColors(assets.colorsA[idx], assets.colorsA[idx + 1], f)
    u.uColorB.value.lerpColors(assets.colorsB[idx], assets.colorsB[idx + 1], f)

    // Orbiting rings — tilted, counter-rotating, whirling on transitions
    const ringSpeed = lerp(a.ringSpeed, b.ringSpeed, f) + burst * 4 + m.vel * 1.5
    r0.rotation.x += d * ringSpeed * 0.7
    r0.rotation.y += d * ringSpeed * 0.4
    r1.rotation.x -= d * ringSpeed * 0.5
    r1.rotation.z += d * ringSpeed * 0.6
    r2.rotation.y += d * ringSpeed * 0.8
    r2.rotation.z -= d * ringSpeed * 0.3
    ;[r0, r1, r2].forEach((ring, i) => {
      ring.material.color.copy(u.uColorA.value)
      ring.material.opacity = (0.42 - i * 0.1) * (1 + burst * 1.2)
    })

    // Halo glow
    halo.material.color.copy(u.uColorA.value)
    halo.material.opacity = 0.4 + burst * 0.3 + heartness * beat * 0.25
    const haloScale = 5.2 + burst * 1.6
    halo.scale.set(haloScale, haloScale, 1)
  })

  return (
    <group ref={groupRef} position={[0, SECTION_STATES[0].y, 0]}>
      <mesh ref={coreRef} geometry={assets.coreGeometry} material={assets.coreMaterial} />
      <mesh geometry={assets.cageGeometry} material={assets.cageMaterial} />
      <mesh ref={ring0Ref} geometry={assets.ringGeometry} material={assets.ringMaterials[0]} rotation={[1.1, 0.2, 0]} />
      <mesh ref={ring1Ref} geometry={assets.ringGeometry} material={assets.ringMaterials[1]} rotation={[-0.6, 0.9, 0.3]} scale={1.18} />
      <mesh ref={ring2Ref} geometry={assets.ringGeometry} material={assets.ringMaterials[2]} rotation={[0.3, -1.2, 0.8]} scale={1.38} />
      <sprite ref={haloRef} renderOrder={-1}>
        <spriteMaterial
          map={assets.glowTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  )
}

function ScrollScene() {
  const store = useRef({ segs: [0, 0, 0, 0], mouse: { x: 0, y: 0 } })
  const [active, setActive] = useState(() => !document.hidden)

  // Section-entry progress drives the journey (handles pinned sections too,
  // since ScrollTrigger accounts for pin spacers on refresh)
  useEffect(() => {
    const triggers = MORPH_TRIGGERS.map((config, index) =>
      ScrollTrigger.create({
        trigger: `#${config.id}`,
        start: config.start,
        end: config.end,
        onUpdate: (self) => {
          store.current.segs[index] = self.progress
        },
      }),
    )
    return () => triggers.forEach((trigger) => trigger.kill())
  }, [])

  // Mouse parallax (rAF-throttled) + pause rendering when the tab is hidden
  useEffect(() => {
    let ticking = false
    const onMove = (e) => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        store.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        store.current.mouse.y = (e.clientY / window.innerHeight) * 2 - 1
        ticking = false
      })
    }
    const onVisibility = () => setActive(!document.hidden)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 9], fov: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
      >
        <AiCore store={store} />
      </Canvas>
    </div>
  )
}

export default ScrollScene
