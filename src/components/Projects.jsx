import { useEffect, useRef } from 'react'
import { FiExternalLink } from 'react-icons/fi'
import { FaGithub } from 'react-icons/fa'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { useIsDesktop, useReducedMotion } from '../hooks/useMediaQuery'
import TiltCard from './fx/TiltCard'
import FadeIn from './fx/FadeIn'
import SplitText from './fx/SplitText'
import { projects } from '../data/projects'

function ProjectCard({ project, className = '' }) {
  return (
    <TiltCard className={className}>
      <article className="glass group flex h-full min-h-[300px] flex-col rounded-2xl p-6 shadow-xl shadow-black/20 transition-colors duration-300 hover:border-violet-300/40">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-200 transition duration-300 group-hover:border-cyan-300/40 group-hover:text-cyan-200">
            <FaGithub size={22} />
          </div>
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${project.title} on GitHub`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-slate-300 transition duration-300 hover:rotate-45 hover:border-violet-300 hover:text-white"
          >
            <FiExternalLink />
          </a>
        </div>

        <h3 className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">{project.title}</h3>
        <p className="mt-4 flex-1 text-base leading-7 text-slate-300">{project.description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 transition-colors duration-300 group-hover:border-violet-300/20"
            >
              {tag}
            </span>
          ))}
        </div>

        <a
          href={project.github}
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-slate-950 transition duration-300 hover:bg-gradient-to-r hover:from-violet-300 hover:to-cyan-200"
        >
          <FaGithub />
          View on GitHub
        </a>
      </article>
    </TiltCard>
  )
}

function Projects() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const isDesktop = useIsDesktop()
  const reduced = useReducedMotion()
  const horizontal = isDesktop && !reduced

  // Pinned horizontal scroll section (desktop, motion-safe only)
  useEffect(() => {
    if (!horizontal) return undefined

    const section = sectionRef.current
    const track = trackRef.current

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }, section)

    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [horizontal])

  const heading = (
    <div className={horizontal ? 'px-5 sm:px-6 lg:px-16' : 'mb-14 px-5 text-center sm:px-6 lg:px-8'}>
      <FadeIn as="p" className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
        Projects · shipping
      </FadeIn>
      <SplitText as="h2" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" stagger={0.015}>
        Selected work
      </SplitText>
      {horizontal && (
        <p className="mt-4 text-sm text-slate-500">
          Keep scrolling <span aria-hidden="true">→</span>
        </p>
      )}
    </div>
  )

  if (horizontal) {
    return (
      <section id="projects" ref={sectionRef} className="relative overflow-hidden">
        <div className="flex h-screen flex-col justify-center py-10">
          {heading}
          <div ref={trackRef} className="mt-12 flex w-max items-stretch gap-8 px-16 will-change-transform">
            {projects.map((project) => (
              <ProjectCard
                key={project.title}
                project={project}
                className="flex w-[420px] max-w-[80vw] shrink-0"
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="projects" className="relative overflow-hidden px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {heading}
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project, index) => (
            <FadeIn key={project.title} delay={(index % 2) * 0.07} className="flex">
              <ProjectCard project={project} className="flex w-full" />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
