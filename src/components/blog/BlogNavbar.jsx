import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa'

// Lightweight header for blog routes — no Lenis, no magnetic effects.
// Reading pages stay fast and quiet; the design language stays the same.
function BlogNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { pathname } = useLocation()
  const onList = pathname === '/blog'

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${
        isScrolled
          ? 'border-white/10 bg-[#05060f]/70 shadow-2xl shadow-black/30 backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 md:h-20 lg:px-8">
        <Link to="/" className="font-display text-lg font-bold text-white md:text-xl">
          Vrund<span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent"> Patel</span>
        </Link>

        <div className="flex items-center gap-5 sm:gap-7">
          <Link
            to="/"
            className="link-sweep py-2 text-sm font-medium text-slate-400 transition-colors duration-300 hover:text-white"
          >
            Portfolio
          </Link>
          <Link
            to="/blog"
            className={`link-sweep py-2 text-sm font-medium transition-colors duration-300 ${
              onList ? 'is-active text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blog
          </Link>
          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="https://github.com/vrund2005"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="glass grid h-9 w-9 place-items-center rounded-full text-slate-300 transition duration-300 hover:border-violet-300/60 hover:text-white"
            >
              <FaGithub size={17} />
            </a>
            <a
              href="https://www.linkedin.com/in/patel-vrund/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="glass grid h-9 w-9 place-items-center rounded-full text-slate-300 transition duration-300 hover:border-violet-300/60 hover:text-white"
            >
              <FaLinkedinIn size={16} />
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default BlogNavbar
