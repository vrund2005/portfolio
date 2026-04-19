import { useEffect, useState } from 'react'
import { Link } from 'react-scroll'
import { FiMenu, FiX } from 'react-icons/fi'

const navItems = [
  { label: 'Home', to: 'home' },
  { label: 'About', to: 'about' },
  { label: 'Skills', to: 'skills' },
  { label: 'Projects', to: 'projects' },
  { label: 'Contact', to: 'contact' },
]

function Navbar({ activeSection, isScrolled }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${
        isScrolled || isOpen
          ? 'border-white/10 bg-slate-950/80 shadow-2xl shadow-slate-950/20 backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6 md:h-20 lg:px-8">
        <Link
          to="home"
          smooth
          duration={600}
          offset={-48}
          className="cursor-pointer text-lg font-bold text-white md:text-xl"
          onClick={() => setIsOpen(false)}
        >
          Vrund Patel
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              smooth
              spy={false}
              duration={650}
              offset={-78}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                activeSection === item.to
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-300 md:hidden"
        >
          {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </nav>

      <div
        className={`md:hidden ${
          isOpen ? 'pointer-events-auto max-h-[calc(100vh-2.75rem)] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        } overflow-hidden border-t border-white/10 bg-slate-950/95 px-4 pb-4 pt-2 backdrop-blur-xl transition-all duration-300`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              smooth
              duration={650}
              offset={-48}
              onClick={() => setIsOpen(false)}
              className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeSection === item.to ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}

export default Navbar
