import { useEffect, useRef } from 'react'
import { useFinePointer, useReducedMotion } from '../../hooks/useMediaQuery'

/**
 * Pointer-following spotlight: a soft wash inside the element plus a brighter
 * 1px rim that lights up the stretch of border nearest the cursor.
 * The position is written as CSS custom properties on one overlay node
 * (rAF-batched), so nothing re-renders. The rect is re-read each frame, so it
 * stays pinned under the cursor while Lenis scrolls the page.
 * Fine pointers only; skipped with prefers-reduced-motion.
 */
function Spotlight({ as = 'div', children, className = '', ...props }) {
  const Tag = as
  const ref = useRef(null)
  const glowRef = useRef(null)
  const finePointer = useFinePointer()
  const reduced = useReducedMotion()
  const enabled = finePointer && !reduced

  useEffect(() => {
    if (!enabled) return undefined

    const el = ref.current
    const glow = glowRef.current
    let frame = 0
    let pointerX = 0
    let pointerY = 0

    const paint = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      glow.style.setProperty('--spot-x', `${pointerX - rect.left}px`)
      glow.style.setProperty('--spot-y', `${pointerY - rect.top}px`)
    }
    const onMove = (e) => {
      pointerX = e.clientX
      pointerY = e.clientY
      if (!frame) frame = requestAnimationFrame(paint)
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [enabled])

  return (
    <Tag ref={ref} className={`group/spot relative ${className}`} {...props}>
      {enabled && (
        <span
          ref={glowRef}
          aria-hidden="true"
          className="spotlight pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        />
      )}
      {children}
    </Tag>
  )
}

export default Spotlight
