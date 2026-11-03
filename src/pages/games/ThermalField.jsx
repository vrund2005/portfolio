import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { stage } from './store'
import { scatter, hand, lens, gamepad, floor, particleSeeds } from './shapes'

/**
 * The /games background: one point cloud that morphs between six shapes as
 * the page scrolls (scatter → hand → lens → tracked hand → gamepad → floor).
 *
 * Everything per-particle happens in the vertex shader — all six targets are
 * uploaded once as attributes and blended on the GPU — so a scroll frame costs
 * one uniform write. Particles are coloured with a thermal-camera ramp and run
 * "white hot" while they are mid-morph. On the light half of the page they
 * cool to ink.
 *
 * Perf: a single draw call, no postprocessing, dpr capped, paused when hidden.
 */

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  attribute vec3 aT0; attribute vec3 aT1; attribute vec3 aT2;
  attribute vec3 aT3; attribute vec3 aT4; attribute vec3 aT5;
  attribute float aRand;
  attribute float aScale;
  varying float vHeat;
  varying float vRand;
  varying float vDepth;

  vec3 pick(float i) {
    if (i < 0.5) return aT0;
    if (i < 1.5) return aT1;
    if (i < 2.5) return aT2;
    if (i < 3.5) return aT3;
    if (i < 4.5) return aT4;
    return aT5;
  }

  void main() {
    float m = clamp(uMorph, 0.0, 5.0);
    float i0 = min(floor(m), 4.0);
    float f = m - i0;
    // stagger: every particle leaves at a slightly different moment
    float t = smoothstep(0.0, 1.0, clamp((f - aRand * 0.35) / 0.65, 0.0, 1.0));
    vec3 a = pick(i0);
    vec3 b = pick(i0 + 1.0);
    // arc through space instead of a straight line
    vec3 mid = (a + b) * 0.5 + vec3(sin(aRand * 40.0), cos(aRand * 23.0), sin(aRand * 11.0)) * 1.4;
    vec3 p = mix(mix(a, mid, t), mix(mid, b, t), t);
    float transit = sin(t * 3.14159);

    // idle shimmer
    p += vec3(
      sin(uTime * 0.9 + aRand * 31.0),
      cos(uTime * 0.7 + aRand * 17.0),
      sin(uTime * 0.6 + aRand * 7.0)
    ) * (0.012 + transit * 0.05);

    vec4 world = modelMatrix * vec4(p, 1.0);
    // pointer pushes particles away, like a hand through smoke
    vec2 d = world.xy - uPointer;
    float push = exp(-dot(d, d) * 1.6) * 0.55 * uPointerOn;
    world.xy += normalize(d + 1e-4) * push;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (9.0 / -mv.z) * (1.0 + transit * 0.6);

    vHeat = clamp(0.25 + aRand * 0.45 + transit * 0.9 + push * 1.2 + (world.z + 1.0) * 0.12, 0.0, 1.0);
    vRand = aRand;
    vDepth = clamp((-mv.z - 4.0) / 18.0, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform float uLight;
  uniform float uTime;
  varying float vHeat;
  varying float vRand;
  varying float vDepth;

  // ironbow-style thermal ramp: ember → infrared → signal orange → hot yellow → white hot
  vec3 thermal(float t) {
    vec3 c0 = vec3(0.35, 0.04, 0.05);
    vec3 c1 = vec3(0.91, 0.09, 0.23);
    vec3 c2 = vec3(1.00, 0.37, 0.08);
    vec3 c3 = vec3(1.00, 0.79, 0.24);
    vec3 c4 = vec3(1.00, 0.96, 0.84);
    if (t < 0.25) return mix(c0, c1, t / 0.25);
    if (t < 0.5) return mix(c1, c2, (t - 0.25) / 0.25);
    if (t < 0.75) return mix(c2, c3, (t - 0.5) / 0.25);
    return mix(c3, c4, (t - 0.75) / 0.25);
  }

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float core = smoothstep(0.5, 0.0, r);
    vec3 hot = thermal(vHeat);
    // light page: particles cool to ink, a few stay signal-orange as accents
    vec3 ink = mix(vec3(0.08, 0.07, 0.06), vec3(1.0, 0.37, 0.08), step(0.93, vRand));
    vec3 col = mix(hot, ink, uLight);
    float alpha = core * mix(0.95, 0.75, uLight) * (1.0 - vDepth * 0.65);
    gl_FragColor = vec4(col, alpha);
  }
`

function Particles({ count, mobile }) {
  const points = useRef()
  const { size, camera, gl } = useThree()

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const targets = [
      scatter(count),
      hand(count),
      lens(count),
      hand(count, { scale: 1.75, seed: 9, tilt: -0.15 }),
      gamepad(count),
      floor(count),
    ]
    g.setAttribute('position', new THREE.BufferAttribute(targets[1].slice(), 3))
    targets.forEach((t, i) => g.setAttribute(`aT${i}`, new THREE.BufferAttribute(t, 3)))
    const { rand, scale } = particleSeeds(count)
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    // shapes move on the GPU, so CPU-side bounds would be wrong: never cull
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
    return g
  }, [count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uLight: { value: 0 },
          uSize: { value: mobile ? 2.6 : 2.2 },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.75) },
          uPointer: { value: new THREE.Vector2(99, 99) },
          uPointerOn: { value: 0 },
        },
      }),
    [gl, mobile],
  )

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  // Where each shape sits on screen. Desktop: hand right of the title, tracked hand
  // left of the "TRACK" copy. Phones: everything centred, a little smaller.
  const OFFSET_X = mobile ? [0, 0, 0, 0, 0, 0] : [0, 2.5, 0, -2.6, 1.5, 0]
  const OFFSET_Y = mobile ? [0, 0.9, 0.4, 0.6, 0.6, 0] : [0, 0, 0, 0, 0.55, 0]
  const SCALE = mobile ? [1, 0.82, 0.78, 0.72, 0.52, 1] : [1, 1, 1, 1, 1, 1]
  const lerpStage = (arr, m) => {
    const i = Math.min(Math.floor(m), arr.length - 2)
    const f = m - i
    return arr[i] + (arr[i + 1] - arr[i]) * f
  }

  const smooth = useRef({ morph: 0, light: 0, px: 0, py: 0, on: 0 })

  useFrame((state, dt) => {
    const s = smooth.current
    const k = 1 - Math.pow(0.0015, dt) // frame-rate independent easing
    s.morph += (stage.morph - s.morph) * k
    s.light += (stage.light - s.light) * k
    s.px += (stage.pointer.x - s.px) * k
    s.py += (stage.pointer.y - s.py) * k
    s.on += ((stage.pointer.active ? 1 : 0) - s.on) * k

    const g = points.current
    if (!g) return
    const u = g.material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uMorph.value = s.morph
    u.uLight.value = s.light

    // pointer (NDC) → world position on the z = 0 plane
    const dist = camera.position.z
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist
    const halfW = halfH * (size.width / size.height)
    u.uPointer.value.set(s.px * halfW, s.py * halfH)
    u.uPointerOn.value = s.on

    // shapes sway and follow the pointer; the floor stays level
    const sway = 1 - THREE.MathUtils.smoothstep(s.morph, 4, 5)
    const vel = THREE.MathUtils.clamp(stage.velocity * 0.0004, -0.6, 0.6)
    g.rotation.y = (Math.sin(state.clock.elapsedTime * 0.25) * 0.35 + s.px * 0.4) * sway + vel * sway
    g.rotation.x = (-s.py * 0.18) * sway
    g.position.x = lerpStage(OFFSET_X, s.morph)
    g.position.y = lerpStage(OFFSET_Y, s.morph)
    g.scale.setScalar(lerpStage(SCALE, s.morph))
  })

  return <points ref={points} geometry={geometry} material={material} />
}

export default function ThermalField({ mobile }) {
  const count = mobile ? 5200 : 11000
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden)

  // stop rendering entirely while the tab is in the background
  useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <Canvas
      className="vrc-canvas"
      dpr={[1, mobile ? 1.5 : 1.75]}
      camera={{ position: [0, 0, 9], fov: 40, near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      frameloop={hidden ? 'never' : 'always'}
    >
      <Particles count={count} mobile={mobile} />
    </Canvas>
  )
}
