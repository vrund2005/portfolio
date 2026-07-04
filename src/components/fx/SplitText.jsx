import { Fragment, useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useMediaQuery'

/**
 * Character-by-character text reveal (split-text stagger).
 * - `play` undefined → reveals on scroll (ScrollTrigger, once)
 * - `play` boolean  → reveals when it flips to true (e.g. after preloader)
 * Accessible: real text in aria-label, animated chars aria-hidden.
 * Reduced motion → static text, no transforms.
 * GSAP owns the hidden state (gsap.set in useLayoutEffect, before paint),
 * so there's no CSS/GSAP transform mismatch.
 */
function SplitText({
  as = 'div',
  children,
  className = '',
  charClassName = '',
  charStyle,
  play,
  delay = 0,
  stagger = 0.02,
}) {
  const Tag = as
  const rootRef = useRef(null)
  const reduced = useReducedMotion()
  const text = typeof children === 'string' ? children : ''

  const words = useMemo(() => text.split(' '), [text])
  const totalChars = useMemo(() => words.reduce((sum, word) => sum + word.length, 0), [words])
  const wordOffsets = useMemo(() => words.map((_, i) => words.slice(0, i).join('').length), [words])

  useLayoutEffect(() => {
    if (reduced) return undefined

    const el = rootRef.current
    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll('.st-char')
      gsap.set(chars, { yPercent: 110 })

      if (typeof play === 'boolean' && !play) return

      const vars = { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger, delay }
      if (typeof play === 'boolean') {
        gsap.to(chars, vars)
      } else {
        gsap.to(chars, {
          ...vars,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      }
    }, el)

    return () => ctx.revert()
  }, [play, reduced, delay, stagger, text])

  return (
    <Tag ref={rootRef} className={className} aria-label={text}>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom" aria-hidden="true">
            {Array.from(word).map((char, ci) => (
              <span
                key={ci}
                className={`st-char inline-block will-change-transform ${charClassName}`}
                style={charStyle ? charStyle(wordOffsets[wi] + ci, totalChars) : undefined}
              >
                {char}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}

export default SplitText
