import { useEffect, useRef } from 'react'
import gsap from 'gsap'

function LoadingScreen({ onComplete }) {
  const overlayRef = useRef(null)
  const topRef = useRef(null)
  const bottomRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const timeline = gsap.timeline({
      delay: 1.8,
      onComplete,
    })

    timeline
      .to(contentRef.current, { opacity: 0, scale: 0.88, duration: 0.35, ease: 'power2.inOut' })
      .to(
        topRef.current,
        {
          yPercent: -100,
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.9,
          ease: 'power4.inOut',
        },
        '<',
      )
      .to(
        bottomRef.current,
        {
          yPercent: 100,
          clipPath: 'inset(100% 0 0 0)',
          duration: 0.9,
          ease: 'power4.inOut',
        },
        '<',
      )
      .to(overlayRef.current, { autoAlpha: 0, duration: 0.01 })

    return () => {
      timeline.kill()
    }
  }, [onComplete])

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9999] overflow-hidden bg-[#030712]">
      <div ref={topRef} className="absolute inset-x-0 top-0 h-1/2 bg-[#030712]" />
      <div ref={bottomRef} className="absolute inset-x-0 bottom-0 h-1/2 bg-[#030712]" />
      <div ref={contentRef} className="absolute inset-0 grid place-items-center">
        <div className="loading-monogram">
          <span>VP</span>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
