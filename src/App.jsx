import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { FiArrowUp } from 'react-icons/fi'
import { ScrollTrigger } from './lib/gsap'
import { scrollToTop } from './lib/scroll'
import { useLenis } from './hooks/useLenis'
import { useReducedMotion } from './hooks/useMediaQuery'
import Preloader from './components/fx/Preloader'
import CustomCursor from './components/fx/CustomCursor'
import ScrollHud from './components/ScrollHud'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'
import NotFound from './404'

// Global morphing 3D scene is lazy-loaded so it never blocks first paint
const ScrollScene = lazy(() => import('./components/fx/ScrollScene'))

const sections = ['home', 'about', 'skills', 'projects', 'contact']

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [ready, setReady] = useState(false)
  const progressRef = useRef(null)
  const reduced = useReducedMotion()
  const isUnknownPath = window.location.pathname !== '/'

  useLenis(!isUnknownPath && !reduced)

  // Scroll progress bar + navbar state — rAF-throttled, progress written
  // straight to the DOM (no re-render per scroll frame)
  useEffect(() => {
    if (isUnknownPath) return undefined

    let ticking = false
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? scrollTop / docHeight : 0

      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
      setIsScrolled(scrollTop > 20)
      setShowBackToTop(scrollTop > 400)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isUnknownPath])

  // Active nav section
  useEffect(() => {
    if (isUnknownPath) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0.01 },
    )

    sections.forEach((section) => {
      const element = document.getElementById(section)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [isUnknownPath])

  // Recalculate ScrollTrigger positions once the preloader lifts
  useEffect(() => {
    if (!ready) return undefined
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(raf)
  }, [ready])

  if (isUnknownPath) {
    return <NotFound />
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-white selection:bg-violet-500/30 selection:text-white">
      <Preloader onReveal={() => setReady(true)} />
      <CustomCursor />

      {/* Scroll-morphing 3D particle scene, fixed behind all content */}
      {ready && !reduced && (
        <Suspense fallback={null}>
          <ScrollScene />
        </Suspense>
      )}

      {/* Film grain overlay */}
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-[90] opacity-[0.05]" />

      {/* Scroll progress */}
      <div className="fixed left-0 top-0 z-[70] h-0.5 w-full bg-white/5">
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-300 will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <Navbar activeSection={activeSection} isScrolled={isScrolled} />
      <ScrollHud activeSection={activeSection} />

      <main className="relative z-10">
        <Hero started={ready} />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

      <button
        type="button"
        aria-label="Back to top"
        onClick={scrollToTop}
        className={`glass fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full text-white shadow-2xl shadow-violet-950/40 transition duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-300 ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
        }`}
      >
        <FiArrowUp size={20} />
      </button>
    </div>
  )
}

export default App
