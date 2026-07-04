import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useMediaQuery'
import SplitText from './fx/SplitText'
import FadeIn from './fx/FadeIn'
import vrundPhoto from '../assets/vrund2.jpeg'

const stats = [
  { value: '20+', label: 'GitHub Repos' },
  { value: '25+', label: 'Projects' },
  // { value: 'Power BI', label: 'Certification' },
]

function ContributionGrid() {
  const gridRef = useRef(null)
  const reduced = useReducedMotion()

  const cells = Array.from({ length: 84 }, (_, index) => {
    const levels = ['bg-slate-800', 'bg-indigo-900/60', 'bg-indigo-600/70', 'bg-cyan-400/80']
    const level = (index * 7 + index.toString().charCodeAt(0)) % levels.length
    return levels[level]
  })

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cg-cell',
        { opacity: 0.1, scale: 0.6 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: 'power2.out',
          stagger: { each: 0.008, from: 'start' },
          scrollTrigger: { trigger: gridRef.current, start: 'top 88%', once: true },
        },
      )
    }, gridRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <div ref={gridRef} aria-hidden="true" className="grid grid-cols-12 gap-1.5">
      {cells.map((cell, index) => (
        <span key={index} className={`cg-cell h-3 rounded-[3px] ${cell}`} />
      ))}
    </div>
  )
}

function About() {
  const sectionRef = useRef(null)
  const imageWrapRef = useRef(null)
  const imageRef = useRef(null)
  const statsRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      // Clip-path mask reveal for the portrait
      gsap.fromTo(
        imageWrapRef.current,
        { clipPath: 'inset(12% 8% 12% 8% round 2rem)', opacity: 0.4 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 2rem)',
          opacity: 1,
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: imageWrapRef.current, start: 'top 80%', once: true },
        },
      )

      // Subtle parallax on the portrait while scrolling through the section
      gsap.fromTo(
        imageRef.current,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )

      // Stat counters
      const counters = statsRef.current.querySelectorAll('.stat-value')
      counters.forEach((el) => {
        const target = parseInt(el.dataset.value, 10)
        const suffix = el.dataset.suffix || ''
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = `${Math.round(obj.v)}${suffix}`
          },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="about" ref={sectionRef} className="relative overflow-hidden px-5 py-24 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="animate-blob-slow absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl will-change-transform"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <FadeIn as="p" className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
            About
          </FadeIn>
          <SplitText as="h2" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" stagger={0.015}>
            Data, insight, and useful systems
          </SplitText>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="mx-auto w-full max-w-md">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] border border-violet-400/20" />
              <div ref={imageWrapRef} className="relative overflow-hidden rounded-[2rem] will-change-[clip-path]">
                <img
                  ref={imageRef}
                  src={vrundPhoto}
                  alt="Vrund Patel"
                  className="aspect-[4/5] w-full scale-[1.12] rounded-[2rem] object-cover shadow-2xl shadow-black will-change-transform"
                />
              </div>
            </div>
          </div>

          <div>
            <FadeIn as="p" className="text-lg leading-8 text-slate-300" delay={0.1}>
              AI/ML Engineer with internship experience at Bacancy, building and deploying machine learning and computer
              vision solutions. Experienced in OpenCV, NLP, and model optimization, with a strong focus on real-world problem
              solving and scalable ML systems.
            </FadeIn>

            <div ref={statsRef} className="mt-8 grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <FadeIn
                  key={stat.label}
                  delay={0.15 + index * 0.1}
                  className="glass group rounded-xl p-5 transition duration-300 hover:border-violet-300/40 hover:bg-white/[0.06]"
                >
                  <div
                    className="stat-value font-display text-3xl font-bold text-white"
                    data-value={parseInt(stat.value, 10)}
                    data-suffix={stat.value.replace(/[0-9]/g, '')}
                  >
                    {reduced ? stat.value : `0${stat.value.replace(/[0-9]/g, '')}`}
                  </div>
                  <div className="mt-1 text-sm text-slate-400 transition-colors duration-300 group-hover:text-slate-300">
                    {stat.label}
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.3} className="glass mt-8 rounded-xl p-5">
              <ContributionGrid />
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
