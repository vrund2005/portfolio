import { useEffect, useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import { scrollToId } from '../lib/scroll'
import Magnetic from './fx/Magnetic'

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

  const go = (id) => {
    setIsOpen(false)
    scrollToId(id)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${
        isScrolled || isOpen
          ? 'border-white/10 bg-[#05060f]/70 shadow-2xl shadow-black/30 backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6 md:h-20 lg:px-8">
        <Magnetic strength={0.25}>
          <button
            type="button"
            onClick={() => go('home')}
            className="cursor-pointer font-display text-lg font-bold text-white md:text-xl"
          >
            Vrund<span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent"> Patel</span>
          </button>
        </Magnetic>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => go(item.to)}
              className={`link-sweep cursor-pointer py-2 text-sm font-medium transition-colors duration-300 ${
                activeSection === item.to ? 'is-active text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="glass grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-300 md:hidden"
        >
          {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </nav>

      <div
        className={`md:hidden ${
          isOpen ? 'pointer-events-auto max-h-[calc(100vh-2.75rem)] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        } overflow-hidden border-t border-white/10 bg-[#05060f]/95 px-4 pb-4 pt-2 backdrop-blur-xl transition-all duration-300`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => go(item.to)}
              className={`cursor-pointer rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
                activeSection === item.to
                  ? 'bg-violet-500/20 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

export default Navbar
