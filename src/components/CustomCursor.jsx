import { useEffect, useRef, useState } from 'react'

function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const rafRef = useRef(null)
  const mouseRef = useRef({ x: -100, y: -100 })
  const ringRefPosition = useRef({ x: -100, y: -100 })
  const [isInteractive, setIsInteractive] = useState(false)
  const [isDown, setIsDown] = useState(false)

  useEffect(() => {
    const handleMouseMove = (event) => {
      mouseRef.current.x = event.clientX
      mouseRef.current.y = event.clientY

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${event.clientX - 4}px, ${event.clientY - 4}px, 0) scale(${
          isDown ? 0.5 : 1
        })`
      }
    }

    const animate = () => {
      ringRefPosition.current.x += (mouseRef.current.x - ringRefPosition.current.x) * 0.16
      ringRefPosition.current.y += (mouseRef.current.y - ringRefPosition.current.y) * 0.16

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringRefPosition.current.x - 18}px, ${
          ringRefPosition.current.y - 18
        }px, 0) scale(${isInteractive ? 2.5 : 1})`
        ringRef.current.style.mixBlendMode = isInteractive ? 'difference' : 'normal'
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    const handleOver = (event) => {
      if (event.target.closest('a, button')) setIsInteractive(true)
    }

    const handleOut = (event) => {
      if (event.target.closest('a, button')) setIsInteractive(false)
    }

    const handleDown = () => setIsDown(true)
    const handleUp = () => setIsDown(false)

    rafRef.current = requestAnimationFrame(animate)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseover', handleOver)
    window.addEventListener('mouseout', handleOut)
    window.addEventListener('mousedown', handleDown)
    window.addEventListener('mouseup', handleUp)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleOver)
      window.removeEventListener('mouseout', handleOut)
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDown, isInteractive])

  return (
    <>
      <div ref={dotRef} className="custom-cursor-dot" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </>
  )
}

export default CustomCursor
