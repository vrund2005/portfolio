import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { setLenis } from '../lib/scroll'

/**
 * Buttery smooth scrolling via Lenis, synced with GSAP ScrollTrigger.
 * - Runs on GSAP's ticker (single rAF loop, no duplicate loops)
 * - Native touch scrolling stays untouched (smoothTouch off)
 * - Fully disabled when `enabled` is false (e.g. prefers-reduced-motion)
 */
export function useLenis(enabled) {
  useEffect(() => {
    if (!enabled) return undefined

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    })

    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      setLenis(null)
    }
  }, [enabled])
}
