import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useMediaQuery'

/**
 * Scroll-triggered fade/slide reveal (transform + opacity only, fires once).
 * Reduced motion → content simply renders, no animation.
 */
function FadeIn({ children, as = 'div', className = '', delay = 0, y = 36, x = 0 }) {
  const Tag = as
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return undefined

    const el = ref.current
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y, x },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.9,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [reduced, delay, y, x])

  return (
    <Tag ref={ref} className={className} style={reduced ? undefined : { opacity: 0 }}>
      {children}
    </Tag>
  )
}

export default FadeIn
