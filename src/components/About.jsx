import { motion as Motion } from 'framer-motion'
import vrundPhoto from '../assets/vrund2.jpeg'

const stats = [
  { value: '20+', label: 'GitHub Repos' },
  { value: '25+', label: 'Projects' },
  // { value: 'Power BI', label: 'Certification' },
]

function ContributionGrid() {
  const cells = Array.from({ length: 84 }, (_, index) => {
    const levels = ['bg-slate-800', 'bg-indigo-900/60', 'bg-indigo-600/70', 'bg-cyan-400/80']
    const level = (index * 7 + index.toString().charCodeAt(0)) % levels.length
    return levels[level]
  })

  return (
    <div aria-hidden="true" className="grid grid-cols-12 gap-1.5">
      {cells.map((cell, index) => (
        <Motion.span
          key={index}
          className={`h-3 rounded-[3px] ${cell}`}
          initial={{ opacity: 0.15, scale: 0.75 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: index * 0.006, duration: 0.25 }}
        />
      ))}
    </div>
  )
}

function About() {
  return (
    <section id="about" className="bg-slate-950 px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
          className="mb-14 text-center"
        >
          <p className="text-sm font-semibold uppercase text-indigo-300">About</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Data, insight, and useful systems</h2>
        </Motion.div>

        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Motion.div
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] border border-indigo-400/20" />
              <img
                src={vrundPhoto}
                alt="Vrund Patel"
                className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl shadow-slate-950"
              />
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, x: 36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-lg leading-8 text-slate-300">
              AI/ML Engineer with internship experience at Bacancy, building and deploying machine learning and computer
              vision solutions. Experienced in OpenCV, NLP, and model optimization, with a strong focus on real-world problem
              solving and scalable ML systems.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <ContributionGrid />
            </div>
          </Motion.div>
        </div>
      </div>
    </section>
  )
}

export default About
