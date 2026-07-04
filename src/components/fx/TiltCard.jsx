import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useFinePointer, useReducedMotion } from '../../hooks/useMediaQuery'

/**
 * 3D tilt card with a moving glare highlight (react-parallax-tilt style).
 * Transform-only, rAF-driven via gsap.quickTo. The bounding rect is cached
 * on pointerenter to avoid layout reads on every move.
 * Disabled on touch devices and with prefers-reduced-motion.
 */
function TiltCard({ children, className = '', max = 8, glare = true }) {
  const cardRef = useRef(null)
  const glareRef = useRef(null)
  const finePointer = useFinePointer()
  const reduced = useReducedMotion()
  const enabled = finePointer && !reduced

  useEffect(() => {
    if (!enabled) return undefined

    const card = cardRef.current
    const shine = glareRef.current
    gsap.set(card, { transformPerspective: 900 })

    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power2.out' })
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power2.out' })
    let gx = null
    let gy = null
    if (shine) {
      gx = gsap.quickTo(shine, 'x', { duration: 0.3, ease: 'power2.out' })
      gy = gsap.quickTo(shine, 'y', { duration: 0.3, ease: 'power2.out' })
    }
    let rect = null

    const onEnter = () => {
      rect = card.getBoundingClientRect()
      if (shine) gsap.to(shine, { opacity: 1, duration: 0.3 })
    }
    const onMove = (e) => {
      if (!rect) rect = card.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      ry(px * 2 * max)
      rx(-py * 2 * max)
      if (gx && gy) {
        gx(e.clientX - rect.left)
        gy(e.clientY - rect.top)
      }
    }
    const onLeave = () => {
      rect = null
      rx(0)
      ry(0)
      if (shine) gsap.to(shine, { opacity: 0, duration: 0.4 })
    }

    card.addEventListener('pointerenter', onEnter, { passive: true })
    card.addEventListener('pointermove', onMove, { passive: true })
    card.addEventListener('pointerleave', onLeave, { passive: true })

    return () => {
      card.removeEventListener('pointerenter', onEnter)
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf([card, shine])
    }
  }, [enabled, max])

  return (
    <div ref={cardRef} className={`relative ${enabled ? 'will-change-transform [transform-style:preserve-3d]' : ''} ${className}`}>
      {children}
      {glare && enabled && (
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 -ml-32 -mt-32 h-64 w-64 rounded-full opacity-0 mix-blend-overlay"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 65%)' }}
        />
      )}
    </div>
  )
}

export default TiltCard
