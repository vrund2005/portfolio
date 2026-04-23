import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

const shapeConfigs = [
  { position: [-6, 3, -4], target: [-8, 2, -8], speed: 0.55, offset: 0, scale: 0.7 },
  { position: [5, -2, -6], target: [7, -4, -10], speed: 0.75, offset: 1.3, scale: 0.58 },
  { position: [0, 4, -8], target: [1, 5, -12], speed: 0.45, offset: 2.4, scale: 0.62 },
  { position: [-4, -4, -5], target: [-6, -5, -9], speed: 0.65, offset: 3.2, scale: 0.54 },
  { position: [7, 2, -3], target: [9, 1, -7], speed: 0.85, offset: 4.1, scale: 0.72 },
]

function FloatingShapes() {
  const meshRefs = useRef([])
  const triggersRef = useRef([])

  const resources = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: '#6366f1',
      metalness: 0.9,
      roughness: 0.1,
    })

    return {
      material,
      geometries: [
        new THREE.IcosahedronGeometry(1.2),
        new THREE.TorusKnotGeometry(0.8, 0.25, 120, 16),
        new THREE.OctahedronGeometry(1),
        new THREE.TorusGeometry(1, 0.35, 16, 100),
        new THREE.IcosahedronGeometry(0.7),
      ],
    }
  }, [])

  useEffect(() => {
    meshRefs.current.forEach((mesh, index) => {
      if (!mesh) return

      const config = shapeConfigs[index]
      const tween = gsap.to(mesh.position, {
        x: config.target[0],
        y: config.target[1],
        z: config.target[2],
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      })

      const scaleTween = gsap.to(mesh.scale, {
        x: config.scale,
        y: config.scale,
        z: config.scale,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      })

      triggersRef.current.push(tween.scrollTrigger, scaleTween.scrollTrigger)
    })

    return () => {
      triggersRef.current.forEach((trigger) => trigger?.kill())
      triggersRef.current = []
      resources.geometries.forEach((geometry) => geometry.dispose())
      resources.material.dispose()
    }
  }, [resources])

  useFrame(({ clock }) => {
    meshRefs.current.forEach((mesh, index) => {
      if (!mesh) return

      const config = shapeConfigs[index]
      mesh.rotation.x += 0.003 + index * 0.0008
      mesh.rotation.y += 0.004 + index * 0.0007
      mesh.rotation.z += 0.0015 + index * 0.0004
      mesh.position.y += Math.sin(clock.elapsedTime * config.speed + config.offset) * 0.0025
    })
  })

  return (
    <group>
      {shapeConfigs.map((config, index) => (
        <mesh
          key={index}
          ref={(element) => {
            meshRefs.current[index] = element
          }}
          geometry={resources.geometries[index]}
          material={resources.material}
          position={config.position}
        />
      ))}
    </group>
  )
}

export default FloatingShapes
