import { useEffect, useRef } from 'react'
import { motion as Motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const skillGroups = [
  {
    group: 'Languages',
    skills: ['Python', 'SQL'],
  },
  {
    group: 'Dirty with Data',
    skills: ['Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'Langchain'],
  },
  {
    group: 'Tools',
    skills: ['Power BI', 'Jupyter Notebook', 'Git/GitHub', 'Kaggle', 'n8n'],
  },
  {
    group: 'Other',
    skills: ['FastAPI', 'React.js'],
  },
]

function Skills() {
  const skillsRef = useRef(null)

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        '.skill-group-title',
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: skillsRef.current,
            start: 'top 68%',
            once: true,
          },
        },
      )

      gsap.from('.skill-pill', {
        x: () => gsap.utils.random(-80, 80),
        y: () => gsap.utils.random(-80, 80),
        opacity: 0,
        scale: 0.75,
        duration: 0.7,
        stagger: { each: 0.04, from: 'random' },
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: skillsRef.current,
          start: 'top 62%',
          once: true,
        },
      })
    }, skillsRef)

    return () => context.revert()
  }, [])

  const handleSkillMove = (event) => {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const rotateY = ((x - rect.width / 2) / rect.width) * 18
    const rotateX = -((y - rect.height / 2) / rect.height) * 18

    element.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`
  }

  const resetSkillTilt = (event) => {
    event.currentTarget.style.transform = ''
  }

  return (
    <section id="skills" ref={skillsRef} className="bg-slate-900 px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
          className="mb-14 text-center"
        >
          <p className="text-sm font-semibold uppercase text-indigo-300">Skills</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Practical tools for data problems</h2>
        </Motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {skillGroups.map((group, groupIndex) => (
            <Motion.div
              key={group.group}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: groupIndex * 0.08, duration: 0.55 }}
              className="rounded-lg border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/20"
            >
              <h3 className="skill-group-title text-xl font-bold text-white">{group.group}</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    onMouseMove={handleSkillMove}
                    onMouseLeave={resetSkillTilt}
                    className="skill-pill rounded-full border border-indigo-300/20 bg-indigo-300/10 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-200/60 hover:bg-indigo-400/20 hover:text-white"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills
