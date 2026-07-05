import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useMediaQuery'

/**
 * Huge outlined word floating behind a section, drifting horizontally as the
 * section scrolls through the viewport. Pure transform scrub — cheap.
 */
function GhostWord({ children, direction = 1, className = '' }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return undefined

    const el = ref.current
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { xPercent: 10 * direction },
        {
          xPercent: -10 * direction,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [reduced, direction])

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`ghost-word pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none whitespace-nowrap font-display text-[20vw] font-bold leading-none ${className}`}
    >
      {children}
    </span>
  )
}

export default GhostWord
