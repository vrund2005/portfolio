import { FaGithub, FaLinkedinIn } from 'react-icons/fa'

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-5 py-8 text-slate-400 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row">
        <p>Designed &amp; built by Vrund Patel</p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/vrund2005"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-indigo-300 hover:text-white"
          >
            <FaGithub size={20} />
          </a>
          <a
            href="https://www.linkedin.com/in/patel-vrund/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-indigo-300 hover:text-white"
          >
            <FaLinkedinIn size={19} />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
