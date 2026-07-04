import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useFinePointer, useReducedMotion } from '../../hooks/useMediaQuery'

/**
 * Magnetic hover wrapper — the child is pulled toward the pointer and
 * springs back elastically on leave. rAF-driven via gsap.quickTo.
 * No-op on touch devices and with prefers-reduced-motion.
 */
function Magnetic({ children, strength = 0.35, className = '' }) {
  const wrapperRef = useRef(null)
  const innerRef = useRef(null)
  const finePointer = useFinePointer()
  const reduced = useReducedMotion()
  const enabled = finePointer && !reduced

  useEffect(() => {
    if (!enabled) return undefined

    const wrapper = wrapperRef.current
    const inner = innerRef.current
    const xTo = gsap.quickTo(inner, 'x', { duration: 0.4, ease: 'power3.out' })
    const yTo = gsap.quickTo(inner, 'y', { duration: 0.4, ease: 'power3.out' })
    let rect = null

    const onEnter = () => {
      rect = wrapper.getBoundingClientRect()
    }
    const onMove = (e) => {
      if (!rect) rect = wrapper.getBoundingClientRect()
      xTo((e.clientX - (rect.left + rect.width / 2)) * strength)
      yTo((e.clientY - (rect.top + rect.height / 2)) * strength)
    }
    const onLeave = () => {
      rect = null
      gsap.to(inner, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.35)' })
    }

    wrapper.addEventListener('pointerenter', onEnter, { passive: true })
    wrapper.addEventListener('pointermove', onMove, { passive: true })
    wrapper.addEventListener('pointerleave', onLeave, { passive: true })

    return () => {
      wrapper.removeEventListener('pointerenter', onEnter)
      wrapper.removeEventListener('pointermove', onMove)
      wrapper.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(inner)
    }
  }, [enabled, strength])

  return (
    <div ref={wrapperRef} className={`inline-block ${className}`}>
      <div ref={innerRef} className={enabled ? 'will-change-transform' : ''}>
        {children}
      </div>
    </div>
  )
}

export default Magnetic
