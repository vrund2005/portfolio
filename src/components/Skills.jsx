import FadeIn from './fx/FadeIn'
import SplitText from './fx/SplitText'
import Marquee from './fx/Marquee'

const skillGroups = [
  { group: 'Languages', skills: ['Python', 'SQL'] },
  { group: 'Cloud & MLOps', skills: ['AWS (SageMaker, Lambda, S3, CloudWatch, IAM, EC2)'] },
  { group: 'GenAI & LLMs', skills: ['LangChain', 'LangGraph', 'RAG', 'FAISS', 'Prompt Engineering', 'MCP'] },
  { group: 'AI/ML', skills: ['Scikit-learn', 'TensorFlow/Keras', 'OpenCV', 'NLP', 'Computer Vision'] },
  { group: 'Data & Visualization', skills: ['Pandas', 'NumPy', 'Matplotlib', 'Power BI'] },
  { group: 'Tools & Frameworks', skills: ['n8n', 'FastAPI', 'React', 'Git/GitHub', 'Jupyter', 'Google Colab'] },
]

const allSkills = skillGroups.flatMap((group) => group.skills)

function Skills() {
  return (
    <section id="skills" className="relative overflow-hidden py-24">
      <div
        aria-hidden="true"
        className="animate-blob absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/[0.07] blur-3xl will-change-transform"
      />

      <div className="relative">
        <div className="mb-14 px-5 text-center sm:px-6 lg:px-8">
          <FadeIn as="p" className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
            Skills
          </FadeIn>
          <SplitText as="h2" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" stagger={0.015}>
            Practical tools for data problems
          </SplitText>
        </div>

        {/* Infinite tech-stack marquee */}
        <FadeIn className="mb-14 border-y border-white/5 py-5">
          <Marquee items={allSkills} duration={30} />
        </FadeIn>

        <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-6 md:grid-cols-2 lg:px-8">
          {skillGroups.map((group, groupIndex) => (
            <FadeIn
              key={group.group}
              delay={groupIndex * 0.08}
              className="glass group rounded-xl p-6 shadow-xl shadow-black/20 transition duration-300 hover:border-violet-300/30 hover:shadow-2xl hover:shadow-violet-950/30"
            >
              <h3 className="font-display text-xl font-bold text-white">
                <span className="mr-3 inline-block h-2 w-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-transform duration-300 group-hover:scale-150" />
                {group.group}
              </h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-sm font-semibold text-violet-100 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-violet-400/20 hover:text-white hover:shadow-lg hover:shadow-violet-500/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills
