import { useEffect, useState } from 'react'
import { FiArrowUp } from 'react-icons/fi'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'
import NotFound from './404'

const sections = ['home', 'about', 'skills', 'projects', 'contact']

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [cursorPosition, setCursorPosition] = useState({ x: -200, y: -200 })
  const isUnknownPath = window.location.pathname !== '/'

  useEffect(() => {
    if (isUnknownPath) return undefined

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight

      setIsScrolled(scrollTop > 20)
      setShowBackToTop(scrollTop > 400)
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
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

  useEffect(() => {
    if (isUnknownPath) return undefined

    const handlePointerMove = (event) => {
      setCursorPosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [isUnknownPath])

  if (isUnknownPath) {
    return <NotFound />
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white selection:bg-indigo-500/30 selection:text-white">
      <div
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl lg:block"
        style={{ transform: `translate(${cursorPosition.x - 144}px, ${cursorPosition.y - 144}px)` }}
      />

      <div className="fixed left-0 top-0 z-[70] h-1 w-full bg-slate-900/80">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Navbar activeSection={activeSection} isScrolled={isScrolled} />

      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>

      <Footer />

      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-indigo-500 text-white shadow-2xl shadow-indigo-500/30 transition duration-300 hover:-translate-y-1 hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-6 pointer-events-none opacity-0'
        }`}
      >
        <FiArrowUp size={22} />
      </button>
    </div>
  )
}

export default App
