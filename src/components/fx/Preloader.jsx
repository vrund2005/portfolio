import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useMediaQuery'

/**
 * Preloader: 0 → 100 counter, progress bar, then a clip-path curtain reveal.
 * Calls onReveal when the curtain starts lifting (page intro can begin),
 * unmounts itself when fully done. Reduced motion: near-instant skip.
 */
function Preloader({ onReveal }) {
  const [done, setDone] = useState(false)
  const overlayRef = useRef(null)
  const countRef = useRef(null)
  const barRef = useRef(null)
  const nameRef = useRef(null)
  const reduced = useReducedMotion()
  const revealRef = useRef(onReveal)

  useEffect(() => {
    revealRef.current = onReveal
  }, [onReveal])

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    if (reduced) {
      const t = window.setTimeout(() => {
        revealRef.current?.()
        setDone(true)
      }, 150)
      return () => {
        window.clearTimeout(t)
        document.body.style.overflow = ''
      }
    }

    const counter = { value: 0 }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.fromTo(
        nameRef.current,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.7, ease: 'power4.out' },
      )
        .to(
          counter,
          {
            value: 100,
            duration: 1.7,
            ease: 'power2.inOut',
            onUpdate: () => {
              if (countRef.current) countRef.current.textContent = String(Math.round(counter.value)).padStart(3, '0')
            },
          },
          0.1,
        )
        .fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0.1)
        .to([nameRef.current, countRef.current, barRef.current], {
          opacity: 0,
          y: -24,
          duration: 0.4,
          ease: 'power2.in',
        })
        .to(overlayRef.current, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 0.9,
          ease: 'power4.inOut',
          onStart: () => revealRef.current?.(),
          onComplete: () => setDone(true),
        })
    }, overlayRef)

    return () => {
      ctx.revert()
      document.body.style.overflow = ''
    }
  }, [reduced])

  useEffect(() => {
    if (done) document.body.style.overflow = ''
  }, [done])

  if (done) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05060f]"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      aria-hidden="true"
    >
      <div className="overflow-hidden">
        <p ref={nameRef} className="font-display text-2xl font-bold tracking-[0.3em] text-white sm:text-3xl">
          VRUND<span className="text-violet-400">.</span>PATEL
        </p>
      </div>

      <div className="mt-8 h-px w-56 overflow-hidden bg-white/10 sm:w-72">
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-300 will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <span
        ref={countRef}
        className="mt-6 font-display text-sm font-semibold tabular-nums tracking-[0.35em] text-slate-500"
      >
        000
      </span>
    </div>
  )
}

export default Preloader
