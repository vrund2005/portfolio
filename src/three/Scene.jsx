/* eslint-disable react-hooks/immutability */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import StarField from './StarField'
import FloatingShapes from './FloatingShapes'

function lerp(start, end, amount) {
  return start + (end - start) * amount
}

function CameraParallax() {
  const { camera } = useThree()
  const targetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event) => {
      targetRef.current.x = (event.clientX / window.innerWidth - 0.5) * 0.8
      targetRef.current.y = -(event.clientY / window.innerHeight - 0.5) * 0.8
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame(() => {
    camera.position.x = lerp(camera.position.x, targetRef.current.x, 0.05)
    camera.position.y = lerp(camera.position.y, targetRef.current.y, 0.05)
    camera.lookAt(0, 0, -6)
  })

  return null
}

function Scene() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 8], fov: 65 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} color="#7c3aed" intensity={3} />
          <pointLight position={[-5, -3, 2]} color="#06b6d4" intensity={1.5} />
          <StarField />
          <FloatingShapes />
          <CameraParallax />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Scene
