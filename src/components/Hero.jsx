import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { FiDownload } from 'react-icons/fi'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa'
import { gsap } from '../lib/gsap'
import { scrollToId } from '../lib/scroll'
import { useIsDesktop, useReducedMotion } from '../hooks/useMediaQuery'
import SplitText from './fx/SplitText'
import Magnetic from './fx/Magnetic'
import vrundPhoto from '../assets/vrund.jpg'

// Three.js scene is lazy-loaded so it never blocks first paint
const HeroScene = lazy(() => import('./fx/HeroScene'))

const roles = [
  // 'Jr. Data Scientist',
  'AI/ML Engineer',
  'GenAI & AgenticAI',
  'Business Intelligence Explorer',
  'Power BI & n8n automation',
]

function Hero({ started = true }) {
  const [roleIndex, setRoleIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [sceneVisible, setSceneVisible] = useState(true)
  const sectionRef = useRef(null)
  const introRef = useRef(null)
  const photoRef = useRef(null)
  const contentRef = useRef(null)
  const reduced = useReducedMotion()
  const isDesktop = useIsDesktop()
  const currentRole = useMemo(() => roles[roleIndex], [roleIndex])

  const show3D = started && isDesktop && !reduced

  // Typewriter (unchanged)
  useEffect(() => {
    const typingSpeed = isDeleting ? 34 : 72
    const pause = displayText === currentRole && !isDeleting ? 1300 : typingSpeed

    const timeout = window.setTimeout(() => {
      if (!isDeleting && displayText === currentRole) {
        setIsDeleting(true)
        return
      }

      if (isDeleting && displayText === '') {
        setIsDeleting(false)
        setRoleIndex((current) => (current + 1) % roles.length)
        return
      }

      setDisplayText((text) =>
        isDeleting ? currentRole.slice(0, text.length - 1) : currentRole.slice(0, text.length + 1),
      )
    }, pause)

    return () => window.clearTimeout(timeout)
  }, [currentRole, displayText, isDeleting])

  // Pause the 3D scene when the hero is off-screen or the tab is hidden
  useEffect(() => {
    if (!show3D) return undefined

    const el = sectionRef.current
    let inView = true

    const apply = () => setSceneVisible(inView && !document.hidden)
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        apply()
      },
      { threshold: 0 },
    )
    observer.observe(el)
    document.addEventListener('visibilitychange', apply)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', apply)
    }
  }, [show3D])

  // Intro reveal after preloader + scroll parallax
  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      if (started) {
        gsap.fromTo(
          '.hero-stagger',
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.25 },
        )
        gsap.fromTo(
          photoRef.current,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.45 },
        )
      }

      // Parallax drift as the hero scrolls away (transform + opacity only)
      gsap.to(contentRef.current, {
        yPercent: -10,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
      gsap.to(photoRef.current, {
        yPercent: -18,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [started, reduced])

  const hiddenBeforeIntro = !reduced && !started

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden px-5 pt-10 sm:px-6 md:pt-24 lg:px-8"
    >
      {/* Layered background: base gradient + dot matrix + aurora blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_45%),linear-gradient(135deg,#0b0d1c_0%,#080a16_48%,#05060f_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
      <div
        aria-hidden="true"
        className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl will-change-transform"
      />
      <div
        aria-hidden="true"
        className="animate-blob-slow absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl will-change-transform"
      />

      {/* Lazy 3D particle field (desktop, motion-safe only) */}
      {show3D && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Suspense fallback={null}>
            <HeroScene active={sceneVisible} />
          </Suspense>
        </div>
      )}

      <div
        ref={introRef}
        className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div ref={contentRef} className="text-center lg:text-left">
          <p
            className={`hero-stagger glass mb-5 inline-flex rounded-full px-4 py-2 text-sm font-medium text-violet-200 ${
              hiddenBeforeIntro ? 'opacity-0' : ''
            }`}
          >
            CSE (Data Science) at VGEC
          </p>

          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-7xl">
            <SplitText as="span" play={reduced ? undefined : started} delay={0.35} className="block">
              Hi, I'm
            </SplitText>
            <SplitText
              as="span"
              play={reduced ? undefined : started}
              delay={0.5}
              className="block"
              charClassName="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent"
              charStyle={(index, total) => ({
                backgroundSize: `${total * 100}% 100%`,
                backgroundPosition: total > 1 ? `${(index / (total - 1)) * 100}% 0` : '0 0',
              })}
            >
              Vrund Patel
            </SplitText>
          </h1>

          <div className={`hero-stagger mt-6 min-h-10 text-xl font-semibold text-cyan-100 sm:text-2xl ${hiddenBeforeIntro ? 'opacity-0' : ''}`}>
            <span>{displayText}</span>
            <span className="ml-1 inline-block h-7 w-0.5 translate-y-1 animate-pulse bg-cyan-200" />
          </div>

          <div className={`hero-stagger mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start ${hiddenBeforeIntro ? 'opacity-0' : ''}`}>
            <Magnetic>
              <button
                type="button"
                onClick={() => scrollToId('projects')}
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-6 font-semibold text-white shadow-xl shadow-violet-500/30 transition duration-300 hover:shadow-2xl hover:shadow-violet-500/50 hover:brightness-110"
              >
                View My Projects
              </button>
            </Magnetic>
            <Magnetic>
              <a
                href="/resume.pdf"
                download
                className="glass inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold text-white transition duration-300 hover:border-violet-300/60 hover:bg-white/10"
              >
                <FiDownload />
                Download Resume
              </a>
            </Magnetic>
          </div>

          <div className={`hero-stagger mt-8 flex justify-center gap-4 lg:justify-start ${hiddenBeforeIntro ? 'opacity-0' : ''}`}>
            <Magnetic strength={0.45}>
              <a
                href="https://github.com/vrund2005"
                aria-label="GitHub"
                target="_blank"
                rel="noreferrer"
                className="glass grid h-12 w-12 place-items-center rounded-full text-slate-200 transition duration-300 hover:border-violet-300/60 hover:text-white"
              >
                <FaGithub size={22} />
              </a>
            </Magnetic>
            <Magnetic strength={0.45}>
              <a
                href="https://www.linkedin.com/in/patel-vrund/"
                aria-label="LinkedIn"
                target="_blank"
                rel="noreferrer"
                className="glass grid h-12 w-12 place-items-center rounded-full text-slate-200 transition duration-300 hover:border-violet-300/60 hover:text-white"
              >
                <FaLinkedinIn size={21} />
              </a>
            </Magnetic>
          </div>
        </div>

        <div ref={photoRef} className={`mx-auto flex justify-center will-change-transform lg:justify-end ${hiddenBeforeIntro ? 'opacity-0' : ''}`}>
          <div className="relative h-72 w-72 sm:h-96 sm:w-96">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,rgba(139,92,246,0.5),rgba(34,211,238,0.4),rgba(139,92,246,0.5))] opacity-60 blur-md"
            />
            <div className="absolute inset-0 rounded-full border border-violet-300/20" />
            <img
              src={vrundPhoto}
              alt="Vrund Patel"
              className="relative h-full w-full rounded-full border-4 border-white/10 object-cover shadow-2xl shadow-violet-950/60"
            />
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        aria-hidden="true"
        className={`hero-stagger absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-slate-500 md:flex ${hiddenBeforeIntro ? 'opacity-0' : ''}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Scroll</span>
        <span className="block h-8 w-px animate-pulse bg-gradient-to-b from-violet-400 to-transparent" />
      </div>
    </section>
  )
}

export default Hero
