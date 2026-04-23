import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { AnimatePresence, motion as Motion, useScroll } from 'framer-motion'
import { FiArrowUp } from 'react-icons/fi'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'
import NotFound from './404'
import CustomCursor from './components/CustomCursor'
import LoadingScreen from './components/LoadingScreen'

const Scene = lazy(() => import('./three/Scene'))

const sections = ['home', 'about', 'skills', 'projects', 'contact']

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const lenisRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const isUnknownPath = window.location.pathname !== '/'

  useEffect(() => {
    if (isUnknownPath) return undefined

    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    })

    lenisRef.current = lenis

    const updateLenis = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(updateLenis)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(updateLenis)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [isUnknownPath])

  useEffect(() => {
    if (isUnknownPath) return undefined

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isUnknownPath])

  useEffect(() => {
    if (isUnknownPath) return undefined

    const handleScroll = () => {
      const scrollTop = window.scrollY

      setIsScrolled(scrollTop > 20)
      setShowBackToTop(scrollTop > 500)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [isUnknownPath])

  useEffect(() => {
    if (isUnknownPath) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
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

  const handleLoaderComplete = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleBackToTop = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 2 })
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isUnknownPath) {
    return <NotFound />
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white selection:bg-indigo-500/30 selection:text-white">
      {!isMobile && (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      )}

      {!isMobile && <CustomCursor />}

      <AnimatePresence>{!isLoaded && <LoadingScreen onComplete={handleLoaderComplete} />}</AnimatePresence>

      <Motion.div
        className="fixed left-0 top-0 z-[9998] h-0.5 w-full origin-left bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-400"
        style={{ scaleX: scrollYProgress }}
      />

      <Navbar activeSection={activeSection} isScrolled={isScrolled} />

      <main className={`page-content ${isLoaded ? 'is-loaded' : ''}`}>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>

      <Footer />

      <AnimatePresence>
        {showBackToTop && (
          <Motion.button
            type="button"
            aria-label="Back to top"
            onClick={handleBackToTop}
            initial={{ opacity: 0, y: 24, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.86 }}
            whileHover={{ y: -4, boxShadow: '0 0 28px rgba(99, 102, 241, 0.75)' }}
            className="back-to-top fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-indigo-500 text-white shadow-2xl shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <FiArrowUp size={22} />
          </Motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
