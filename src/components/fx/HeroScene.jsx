import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Lazy-loaded 3D hero background: capped particle field + low-poly wireframe
 * shapes, with mouse-reactive parallax. Perf budget:
 * - 420 particles total, low-poly geometry only
 * - dpr capped at 1.5, frameloop set to 'never' when hero is off-screen/tab hidden
 * - pointer tracked on window (canvas is pointer-events: none), lerped in useFrame
 */

const PARTICLE_COUNT = 420

// Deterministic pseudo-random (mulberry32) — keeps the component render-pure
// and gives a stable particle layout across re-renders
function createRandom(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Particles({ mouse }) {
  const groupRef = useRef(null)

  const [indigoGeo, cyanGeo] = useMemo(() => {
    const make = (count, spread, seed) => {
      const random = createRandom(seed)
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (random() - 0.5) * spread[0]
        positions[i * 3 + 1] = (random() - 0.5) * spread[1]
        positions[i * 3 + 2] = (random() - 0.5) * spread[2]
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      return geo
    }
    return [
      make(Math.floor(PARTICLE_COUNT * 0.6), [16, 10, 8], 1337),
      make(Math.floor(PARTICLE_COUNT * 0.4), [14, 9, 6], 2026),
    ]
  }, [])

  useEffect(() => {
    return () => {
      indigoGeo.dispose()
      cyanGeo.dispose()
    }
  }, [indigoGeo, cyanGeo])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const d = Math.min(delta, 0.05)
    group.rotation.y += d * 0.03
    // Ease toward pointer for a fluid, reactive feel
    group.rotation.x += (mouse.current.y * 0.12 - group.rotation.x) * d * 2.2
    group.position.x += (mouse.current.x * 0.6 - group.position.x) * d * 2.2
  })

  return (
    <group ref={groupRef}>
      <points geometry={indigoGeo}>
        <pointsMaterial
          size={0.045}
          color="#818cf8"
          transparent
          opacity={0.65}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={cyanGeo}>
        <pointsMaterial
          size={0.03}
          color="#22d3ee"
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

function Shapes({ mouse }) {
  const groupRef = useRef(null)

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const d = Math.min(delta, 0.05)
    group.rotation.y += (mouse.current.x * 0.25 - group.rotation.y) * d * 1.8
    group.rotation.x += (-mouse.current.y * 0.18 - group.rotation.x) * d * 1.8
  })

  return (
    <group ref={groupRef}>
      <Float speed={1.4} rotationIntensity={0.7} floatIntensity={1.1}>
        <mesh position={[4.2, 1.6, -2]}>
          <icosahedronGeometry args={[1.3, 0]} />
          <meshBasicMaterial wireframe color="#8b5cf6" transparent opacity={0.32} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.9} floatIntensity={1.4}>
        <mesh position={[-4.6, -1.8, -3]}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial wireframe color="#22d3ee" transparent opacity={0.28} />
        </mesh>
      </Float>
      <Float speed={1.1} rotationIntensity={0.5} floatIntensity={0.9}>
        <mesh position={[-2.8, 2.4, -4]} rotation={[0.8, 0.4, 0]}>
          <torusGeometry args={[0.9, 0.015, 8, 48]} />
          <meshBasicMaterial wireframe color="#a5b4fc" transparent opacity={0.35} />
        </mesh>
      </Float>
    </group>
  )
}

function Scene() {
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    let ticking = false
    const onMove = (e) => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
        ticking = false
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <>
      <Particles mouse={mouse} />
      <Shapes mouse={mouse} />
    </>
  )
}

function HeroScene({ active = true }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Scene />
    </Canvas>
  )
}

export default HeroScene
