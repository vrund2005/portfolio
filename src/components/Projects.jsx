import { useEffect, useRef } from 'react'
import { motion as Motion } from 'framer-motion'
import { FiExternalLink } from 'react-icons/fi'
import { FaGithub } from 'react-icons/fa'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '../data/projects'

gsap.registerPlugin(ScrollTrigger)

function Projects() {
  const projectsRef = useRef(null)
  const cardsRef = useRef(null)

  useEffect(() => {
    const context = gsap.context(() => {
      if (window.innerWidth >= 1024 && cardsRef.current) {
        const cards = gsap.utils.toArray('.project-card')

        const horizontalTween = gsap.to(cardsRef.current, {
          x: () => {
            const totalWidth = cardsRef.current.scrollWidth
            const viewportWidth = window.innerWidth
            return -(totalWidth - viewportWidth + 48)
          },
          ease: 'none',
          scrollTrigger: {
            trigger: '.projects-pin',
            start: 'top top',
            end: () => `+=${Math.max(cardsRef.current.scrollWidth - window.innerWidth, 1)}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })

        cards.forEach((card) => {
          gsap.fromTo(
            card,
            { rotateY: 35, x: 100, opacity: 0 },
            {
              rotateY: 0,
              x: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontalTween,
                start: 'left 82%',
                once: true,
              },
            },
          )
        })
      } else {
        gsap.from('.project-card', {
          rotateY: 35,
          x: 100,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: projectsRef.current,
            start: 'top 62%',
            once: true,
          },
        })
      }
    }, projectsRef)

    return () => context.revert()
  }, [])

  return (
    <section id="projects" ref={projectsRef} className="bg-slate-950 px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
          className="mb-14 text-center"
        >
          <p className="text-sm font-semibold uppercase text-indigo-300">Projects</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Selected work</h2>
        </Motion.div>

        <div className="projects-pin overflow-visible">
          <div ref={cardsRef} className="grid gap-6 lg:flex lg:w-max lg:gap-8">
          {projects.map((project, index) => (
            <Motion.article
              key={project.title}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.07, duration: 0.55 }}
              className="project-card glowing-card group flex min-h-[300px] flex-col rounded-lg border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition duration-300 hover:-translate-y-2 hover:scale-[1.015] hover:border-indigo-300/40 hover:shadow-2xl hover:shadow-indigo-950/30 lg:w-[520px]"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-indigo-300/20 bg-indigo-300/10 text-indigo-200">
                  <FaGithub size={22} />
                </div>
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${project.title} on GitHub`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-indigo-300 hover:text-white"
                >
                  <FiExternalLink />
                </a>
              </div>

              <h3 className="text-2xl font-bold text-white">{project.title}</h3>
              <p className="mt-4 flex-1 text-base leading-7 text-slate-300">{project.description}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Motion.span
                    key={tag}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200"
                  >
                    {tag}
                  </Motion.span>
                ))}
              </div>

              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                className="github-button mt-7 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-indigo-200"
              >
                <FaGithub />
                <FiExternalLink className="github-button-arrow" />
                View on GitHub
              </a>
            </Motion.article>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Projects
