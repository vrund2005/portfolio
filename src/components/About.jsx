import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useMediaQuery'
import SplitText from './fx/SplitText'
import FadeIn from './fx/FadeIn'
import TiltCard from './fx/TiltCard'
import GhostWord from './fx/GhostWord'

const stats = [
  { value: '30+', label: 'GitHub Repos' },
  { value: '35+', label: 'Projects' },
  { value: '2', label: 'Internships' },
]

// Syntax color tokens for the code card
const KW = 'text-violet-300' // keywords
const FN = 'text-indigo-300' // function names
const STR = 'text-cyan-300' // strings
const DOC = 'text-cyan-200/70 italic' // docstrings
const CMT = 'text-slate-500 italic' // comments
const SLF = 'text-violet-200/80 italic' // self
const PLN = 'text-slate-300' // plain / punctuation

const codeLines = [
  [{ t: '# about me, as code', c: CMT }],
  [],
  [
    { t: 'class ', c: KW },
    { t: 'VrundPatel', c: 'font-semibold text-white' },
    { t: ':', c: PLN },
  ],
  [{ t: '    """AI/ML engineer @ VGEC"""', c: DOC }],
  [],
  [
    { t: '    def ', c: KW },
    { t: '__init__', c: FN },
    { t: '(', c: PLN },
    { t: 'self', c: SLF },
    { t: '):', c: PLN },
  ],
  [
    { t: '        ', c: PLN },
    { t: 'self', c: SLF },
    { t: '.interned = [', c: PLN },
    { t: '"iQudTek"', c: STR },
    { t: ',', c: PLN },
  ],
  [
    { t: '                         ', c: PLN },
    { t: '"Bacancy"', c: STR },
    { t: ']', c: PLN },
  ],
  [
    { t: '        ', c: PLN },
    { t: 'self', c: SLF },
    { t: '.builds = [', c: PLN },
    { t: '"Computer Vision"', c: STR },
    { t: ',', c: PLN },
  ],
  [
    { t: '                       ', c: PLN },
    { t: '"Agentic AI"', c: STR },
    { t: ', ', c: PLN },
    { t: '"NLP"', c: STR },
    { t: ']', c: PLN },
  ],
  [],
  [
    { t: '    def ', c: KW },
    { t: 'ship', c: FN },
    { t: '(', c: PLN },
    { t: 'self', c: SLF },
    { t: ', idea):', c: PLN },
  ],
  [
    { t: '        while not ', c: KW },
    { t: 'in_production', c: FN },
    { t: '(idea):', c: PLN },
  ],
  [
    { t: '            idea = ', c: PLN },
    { t: 'iterate', c: FN },
    { t: '(idea)', c: PLN },
  ],
  [
    { t: '        return ', c: KW },
    { t: 'deploy', c: FN },
    { t: '(idea)', c: PLN },
  ],
]

function CodeCard() {
  const cardRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.code-line',
        { opacity: 0, x: -14 },
        {
          opacity: 1,
          x: 0,
          duration: 0.45,
          ease: 'power2.out',
          stagger: 0.07,
          scrollTrigger: { trigger: cardRef.current, start: 'top 78%', once: true },
        },
      )
    }, cardRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <div ref={cardRef} className="relative">
      <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] border border-violet-400/20" />
      <TiltCard max={6} className="glass overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
        {/* Editor chrome */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-400/70" />
          <span className="h-3 w-3 rounded-full bg-amber-300/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
          <span className="ml-3 rounded-md bg-white/[0.05] px-3 py-1 font-mono text-xs text-slate-300">
            vrund_patel.py
          </span>
        </div>

        {/* Code body */}
        <div className="overflow-x-auto px-4 py-5 sm:px-5">
          <pre className="font-mono text-xs leading-6 sm:text-sm">
            {codeLines.map((tokens, lineIndex) => (
              <div key={lineIndex} className="code-line flex whitespace-pre">
                <span aria-hidden="true" className="mr-3 w-4 select-none text-right text-slate-600 sm:mr-4 sm:w-5">
                  {lineIndex + 1}
                </span>
                <span>
                  {tokens.length === 0
                    ? ' '
                    : tokens.map((token, tokenIndex) => (
                        <span key={tokenIndex} className={token.c}>
                          {token.t}
                        </span>
                      ))}
                  {lineIndex === codeLines.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-cyan-300"
                    />
                  )}
                </span>
              </div>
            ))}
          </pre>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.03] px-4 py-2 font-mono text-[11px] text-slate-500">
          <span>
            <span className="text-violet-300">⌥</span> main*&nbsp;&nbsp;Python 3
          </span>
          <span>
            Ln {codeLines.length}&nbsp;&nbsp;<span className="text-emerald-400/80">✓ 0 problems</span>
          </span>
        </div>
      </TiltCard>
    </div>
  )
}

function ContributionGrid() {
  const gridRef = useRef(null)
  const reduced = useReducedMotion()

  const cells = Array.from({ length: 84 }, (_, index) => {
    const levels = ['bg-slate-800', 'bg-indigo-900/60', 'bg-indigo-600/70', 'bg-cyan-400/80']
    const level = (index * 7 + index.toString().charCodeAt(0)) % levels.length
    return levels[level]
  })

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cg-cell',
        { opacity: 0.1, scale: 0.6 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: 'power2.out',
          stagger: { each: 0.008, from: 'start' },
          scrollTrigger: { trigger: gridRef.current, start: 'top 88%', once: true },
        },
      )
    }, gridRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <div ref={gridRef}>
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-[0.2em] text-slate-400">Commit rhythm</span>
        <span className="text-slate-500">always shipping</span>
      </div>
      <div aria-hidden="true" className="grid grid-cols-12 gap-1.5">
        {cells.map((cell, index) => (
          <span key={index} className={`cg-cell h-3 rounded-[3px] ${cell}`} />
        ))}
      </div>
    </div>
  )
}

function About() {
  const sectionRef = useRef(null)
  const statsRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      // Stat counters
      const counters = statsRef.current.querySelectorAll('.stat-value')
      counters.forEach((el) => {
        const target = parseInt(el.dataset.value, 10)
        const suffix = el.dataset.suffix || ''
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = `${Math.round(obj.v)}${suffix}`
          },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="about" ref={sectionRef} className="relative overflow-hidden px-5 py-24 sm:px-6 lg:px-8">
      <GhostWord>MODEL</GhostWord>
      <div
        aria-hidden="true"
        className="animate-blob-slow absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-cyan-500/[0.07] blur-3xl will-change-transform"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <FadeIn as="p" className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            About · training the model
          </FadeIn>
          <SplitText as="h2" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" stagger={0.015}>
            From notebooks to production
          </SplitText>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <FadeIn className="mx-auto w-full max-w-xl">
            <CodeCard />
          </FadeIn>

          <div>
            <FadeIn as="p" className="text-lg leading-8 text-slate-300" delay={0.1}>
              I'm an AI/ML engineer who likes models best when they're{' '}
              <span className="font-semibold text-white">deployed</span>. Through internships at{' '}
              <span className="font-semibold text-violet-200">iQudTek</span> and{' '}
              <span className="font-semibold text-violet-200">Bacancy</span>, I've built and shipped deep learning
              and computer-vision systems that solve real problems — not just benchmarks.
            </FadeIn>

            <FadeIn as="p" className="mt-4 text-lg leading-8 text-slate-300" delay={0.15}>
              Day to day, that means working across{' '}
              <span className="font-semibold text-cyan-200">OpenCV</span>,{' '}
              <span className="font-semibold text-cyan-200">Agentic AI</span>,{' '}
              <span className="font-semibold text-cyan-200">NLP</span>, and model optimization — with a bias for ML
              that scales beyond the demo.
            </FadeIn>

            <div ref={statsRef} className="mt-8 grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <FadeIn
                  key={stat.label}
                  delay={0.15 + index * 0.1}
                  className="glass group rounded-xl p-5 transition duration-300 hover:border-violet-300/40 hover:bg-white/[0.06]"
                >
                  <div
                    className="stat-value font-display text-3xl font-bold text-white"
                    data-value={parseInt(stat.value, 10)}
                    data-suffix={stat.value.replace(/[0-9]/g, '')}
                  >
                    {reduced ? stat.value : `0${stat.value.replace(/[0-9]/g, '')}`}
                  </div>
                  <div className="mt-1 text-sm text-slate-400 transition-colors duration-300 group-hover:text-slate-300">
                    {stat.label}
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.3} className="glass mt-8 rounded-xl p-5">
              <ContributionGrid />
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
