import { useState } from 'react'
import { FiArrowDown, FiCheck, FiCopy, FiDownload, FiMail } from 'react-icons/fi'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa'
import FadeIn from './fx/FadeIn'
import SplitText from './fx/SplitText'
import GhostWord from './fx/GhostWord'
import Magnetic from './fx/Magnetic'
import { scrollToId } from '../lib/scroll'

const EMAIL = 'vrund765patel@gmail.com'

const offers = [
  {
    tag: 'Full-time',
    title: 'Deploy me on your team',
    description:
      'Looking for an AI/ML engineer who ships? I build agentic systems, computer-vision pipelines, and GenAI products end to end — and write docs people actually read.',
    points: ['Agentic AI & LLM pipelines', 'Computer vision systems', 'RAG & GenAI products'],
    subject: 'Full-time opportunity — [company / role]',
    body: "Hi Vrund,\n\nWe're hiring for [role] at [company].\n\nLocation / remote: \nTech stack: \nA bit about the team: \n\nLet's talk!",
    cta: 'Discuss a role',
  },
  {
    tag: 'Freelance',
    title: 'Build your idea with me',
    description:
      'Have a product idea or a workflow that needs automating? I scope it, build it, and hand it over production-ready — with clear communication throughout.',
    points: ['AI chatbots & RAG over your data', 'n8n automations & integrations', 'Custom agents & MCP tools'],
    subject: 'Project inquiry — [your project]',
    body: "Hi Vrund,\n\nI'd like to build [short description].\n\nWhat it should do: \nTimeline: \nBudget range: \n\nLooking forward!",
    cta: 'Start a project',
  },
]

const mailto = (offer) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(offer.subject)}&body=${encodeURIComponent(offer.body)}`

function CopyEmail() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="glass inline-flex h-11 items-center gap-2.5 rounded-full px-5 text-sm font-semibold text-slate-200 transition duration-300 hover:border-fuchsia-300/50 hover:text-white"
    >
      {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy className="text-fuchsia-300" />}
      {copied ? 'Copied!' : EMAIL}
    </button>
  )
}

function Hire() {
  return (
    <section id="hire" className="relative overflow-hidden px-5 py-24 sm:px-6 lg:px-8">
      <GhostWord>DEPLOY</GhostWord>
      <div
        aria-hidden="true"
        className="animate-blob absolute -right-36 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/[0.07] blur-3xl will-change-transform"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <FadeIn as="p" className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-300">
            Hire me · ready to deploy
          </FadeIn>
          <SplitText as="h2" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" stagger={0.015}>
            Two ways to work with me
          </SplitText>
          <FadeIn delay={0.1} className="mt-5 flex justify-center">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Currently available
            </span>
          </FadeIn>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {offers.map((offer, index) => (
            <FadeIn key={offer.tag} delay={index * 0.1} className="flex">
              <article className="glass group flex w-full flex-col rounded-2xl p-7 shadow-xl shadow-black/20 transition-colors duration-300 hover:border-fuchsia-300/40 sm:p-8">
                <span className="w-fit rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-200">
                  {offer.tag}
                </span>

                <h3 className="mt-5 font-display text-2xl font-bold text-white">{offer.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-400">{offer.description}</p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {offer.points.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-300" />
                      {point}
                    </li>
                  ))}
                </ul>

                <Magnetic className="mt-8 w-full sm:w-fit">
                  <a
                    href={mailto(offer)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-7 text-sm font-bold text-white shadow-xl shadow-fuchsia-500/25 transition duration-300 hover:shadow-2xl hover:shadow-fuchsia-500/40 hover:brightness-110 sm:w-auto"
                  >
                    <FiMail />
                    {offer.cta}
                  </a>
                </Magnetic>
              </article>
            </FadeIn>
          ))}
        </div>

        {/* Quick contact strip */}
        <FadeIn delay={0.2}>
          <div className="mt-10 flex flex-col items-center gap-5">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <CopyEmail />
              {/* <a
                href="/resume.pdf"
                download
                className="glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-slate-200 transition duration-300 hover:border-fuchsia-300/50 hover:text-white"
              >
                <FiDownload className="text-fuchsia-300" />
                Resume
              </a> */}
              {/* <a
                href="https://www.linkedin.com/in/patel-vrund/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="glass grid h-11 w-11 place-items-center rounded-full text-slate-300 transition duration-300 hover:border-fuchsia-300/50 hover:text-white"
              >
                <FaLinkedinIn size={17} />
              </a>
              <a
                href="https://github.com/vrund2005"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="glass grid h-11 w-11 place-items-center rounded-full text-slate-300 transition duration-300 hover:border-fuchsia-300/50 hover:text-white"
              >
                <FaGithub size={18} />
              </a> */}
            </div>

            <button
              type="button"
              onClick={() => scrollToId('contact')}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-300"
            >
              Prefer writing a quick message? Use the form below
              <FiArrowDown className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export default Hire
