import { motion as Motion } from 'framer-motion'

const skillGroups = [
  {
    group: 'Languages',
    skills: ['Python', 'SQL'],
  },
  {
    group: 'ML/DL',
    skills: ['Scikit-learn', 'TensorFlow/Keras', 'NLP', 'Computer Vision'],
  },
  {
    group: 'GenAI & LLMs',
    skills: ['LangChain', 'LangGraph', 'RAG', 'FAISS', 'Prompt Engineering'],
  },
  {
    group: 'Data & Visualization',
    skills: ['Pandas', 'NumPy', 'Matplotlib', 'Power BI'],
  },
  {
    group: 'Tools & Frameworks',
    skills: ['n8n', 'FastAPI', 'Git/GitHub', 'Jupyter', 'Google Colab'],
  },
  {
    group: 'Other',
    skills: ['FastAPI', 'React.js'],
  },
]

function Skills() {
  return (
    <section id="skills" className="bg-slate-900 px-5 py-24 sm:px-6 lg:px-8">
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
              <h3 className="text-xl font-bold text-white">{group.group}</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-indigo-300/20 bg-indigo-300/10 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:-translate-y-1 hover:border-indigo-200/60 hover:bg-indigo-400/20 hover:text-white"
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
