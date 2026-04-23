import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const particleCount = 8000

function lerp(start, end, amount) {
  return start + (end - start) * amount
}

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function StarField() {
  const pointsRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const white = new THREE.Color('#ffffff')
    const violet = new THREE.Color('#a78bfa')

    for (let i = 0; i < particleCount; i += 1) {
      const radius = 80 * Math.cbrt(seededRandom(i + 1))
      const theta = seededRandom(i + 2) * Math.PI * 2
      const phi = Math.acos(2 * seededRandom(i + 3) - 1)
      const index = i * 3

      positions[index] = radius * Math.sin(phi) * Math.cos(theta)
      positions[index + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[index + 2] = radius * Math.cos(phi)

      const color = white.clone().lerp(violet, seededRandom(i + 4) * 0.7)
      colors[index] = color.r
      colors[index + 1] = color.g
      colors[index + 2] = color.b
    }

    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const starMaterial = new THREE.PointsMaterial({
      size: 0.015,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    })

    return { geometry: starGeometry, material: starMaterial }
  }, [])

  useEffect(() => {
    const handleMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (event.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    if (!pointsRef.current) return

    pointsRef.current.rotation.y += 0.00015
    pointsRef.current.rotation.x = lerp(pointsRef.current.rotation.x, mouseRef.current.y * 0.08, 0.04)
    pointsRef.current.rotation.z = lerp(pointsRef.current.rotation.z, -mouseRef.current.x * 0.08, 0.04)
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

export default StarField
