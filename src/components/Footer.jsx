import { FaGithub, FaLinkedinIn } from 'react-icons/fa'
import Magnetic from './fx/Magnetic'

function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-8 text-slate-400 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row">
        <p>
          Designed &amp; built by{' '}
          <span className="link-sweep font-semibold text-slate-200">Vrund Patel</span>
        </p>
        <div className="flex items-center gap-3">
          <Magnetic strength={0.45}>
            <a
              href="https://github.com/vrund2005"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="glass grid h-10 w-10 place-items-center rounded-full text-slate-300 transition duration-300 hover:border-violet-300/60 hover:text-white"
            >
              <FaGithub size={20} />
            </a>
          </Magnetic>
          <Magnetic strength={0.45}>
            <a
              href="https://www.linkedin.com/in/patel-vrund/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="glass grid h-10 w-10 place-items-center rounded-full text-slate-300 transition duration-300 hover:border-violet-300/60 hover:text-white"
            >
              <FaLinkedinIn size={19} />
            </a>
          </Magnetic>
        </div>
      </div>
    </footer>
  )
}

export default Footer
