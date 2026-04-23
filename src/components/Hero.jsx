import { useEffect, useMemo, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Link } from 'react-scroll'
import { FiDownload } from 'react-icons/fi'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa'
import vrundPhoto from '../assets/vrund.jpg'

const roles = [
  'Jr. Data Scientist',
  'AI/ML Enthusiast',
  'Business Intelligence Explorer',
  'Power BI & n8n automation',
]

function Hero() {
  const [roleIndex, setRoleIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const currentRole = useMemo(() => roles[roleIndex], [roleIndex])

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

  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden px-5 pt-10 sm:px-6 md:pt-24 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.2),transparent_35%),linear-gradient(135deg,#0f172a_0%,#111827_48%,#020617_100%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.28)_1px,transparent_1px)] [background-size:34px_34px]" />
      <Motion.div
        className="absolute left-[8%] top-[24%] h-2 w-2 rounded-full bg-cyan-300"
        animate={{ y: [0, -22, 0], opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Motion.div
        className="absolute bottom-[18%] right-[12%] h-2 w-2 rounded-full bg-indigo-300"
        animate={{ y: [0, 28, 0], opacity: [0.25, 0.9, 0.25] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="text-center lg:text-left">
          <Motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-5 inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm font-medium text-indigo-200"
          >
            CSE (Data Science) at VGEC
          </Motion.p>

          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-7xl">
            Hi, I&apos;m <span className="text-indigo-300">Vrund Patel</span>
          </h1>

          <div className="mt-6 min-h-10 text-xl font-semibold text-cyan-100 sm:text-2xl">
            <span>{displayText}</span>
            <span className="ml-1 inline-block h-7 w-0.5 translate-y-1 bg-cyan-200" />
          </div>

          {/* <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg lg:mx-0">
            Turning raw data into decisions.
          </p> */}

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Link
              to="projects"
              smooth
              duration={650}
              offset={-78}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-indigo-500 px-6 font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:-translate-y-1 hover:bg-indigo-400"
            >
              View My Projects
            </Link>
            <a
              href="/resume.pdf"
              download
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-6 font-semibold text-white transition hover:-translate-y-1 hover:border-indigo-300 hover:bg-white/10"
            >
              <FiDownload />
              Download Resume
            </a>
          </div>

          <div className="mt-8 flex justify-center gap-4 lg:justify-start">
            <a
              href="https://github.com/vrund2005"
              aria-label="GitHub"
              target="_blank"
              rel="noreferrer"
              className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:-translate-y-1 hover:border-indigo-300 hover:text-white"
            >
              <FaGithub size={22} />
            </a>
            <a
              href="https://www.linkedin.com/in/patel-vrund/"
              aria-label="LinkedIn"
              target="_blank"
              rel="noreferrer"
              className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:-translate-y-1 hover:border-indigo-300 hover:text-white"
            >
              <FaLinkedinIn size={21} />
            </a>
          </div>
        </div>

        <Motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mx-auto flex justify-center lg:justify-end"
        >
          <div className="relative h-72 w-72 sm:h-96 sm:w-96">
            <div className="absolute inset-0 rounded-full border border-indigo-300/20" />
            <img
              src={vrundPhoto}
              alt="Vrund Patel"
              className="relative h-full w-full rounded-full border-4 border-white/10 object-cover shadow-2xl shadow-indigo-950/60"
            />
          </div>
        </Motion.div>
      </Motion.div>
    </section>
  )
}

export default Hero
