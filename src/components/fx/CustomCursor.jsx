import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useFinePointer, useReducedMotion } from '../../hooks/useMediaQuery'

/**
 * Custom cursor: accent dot + white trailing blob with mix-blend-difference.
 * gsap.quickTo renders on GSAP's ticker (rAF), so pointermove is effectively throttled.
 * Only active for fine pointers, disabled with prefers-reduced-motion.
 */
function CustomCursor() {
  const finePointer = useFinePointer()
  const reduced = useReducedMotion()
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const enabled = finePointer && !reduced

  useEffect(() => {
    if (!enabled) return undefined

    const dot = dotRef.current
    const ring = ringRef.current
    document.body.classList.add('has-custom-cursor')

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })

    let visible = false
    const onMove = (e) => {
      if (!visible) {
        visible = true
        gsap.to([dot, ring], { opacity: 1, duration: 0.25 })
      }
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }

    const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, [data-cursor]'
    const onOver = (e) => {
      if (e.target.closest(INTERACTIVE)) gsap.to(ring, { scale: 2.4, duration: 0.35, ease: 'power3.out' })
    }
    const onOut = (e) => {
      if (e.target.closest(INTERACTIVE)) gsap.to(ring, { scale: 1, duration: 0.35, ease: 'power3.out' })
    }
    const onDown = () => gsap.to(dot, { scale: 0.6, duration: 0.2 })
    const onUp = () => gsap.to(dot, { scale: 1, duration: 0.2 })
    const onLeaveDoc = () => {
      visible = false
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeaveDoc)

    return () => {
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeaveDoc)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[95] -ml-4 -mt-4 h-8 w-8 rounded-full bg-white opacity-0 mix-blend-difference will-change-transform"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[96] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-cyan-300 opacity-0 will-change-transform"
      />
    </>
  )
}

export default CustomCursor
