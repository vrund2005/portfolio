import FadeIn from './fx/FadeIn'
import SplitText from './fx/SplitText'
import Magnetic from './fx/Magnetic'
import GhostWord from './fx/GhostWord'

function Contact() {
  const handleSubmit = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim()
    const message = formData.get('message')?.toString().trim()
    const subject = `Portfolio message from ${name || 'website visitor'}${email ? ` (${email})` : ''}`
    const mailtoUrl = `mailto:vrund765patel@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      message || '',
    )}`

    window.location.href = mailtoUrl
  }

  const inputClasses =
    'mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none transition duration-300 placeholder:text-slate-500 focus:border-violet-300 focus:bg-white/[0.07] focus:ring-2 focus:ring-violet-300/20'

  return (
    <section id="contact" className="relative overflow-hidden px-5 py-24 sm:px-6 lg:px-8">
      <GhostWord>HELLO</GhostWord>
      <div
        aria-hidden="true"
        className="animate-blob absolute -right-32 top-10 h-80 w-80 rounded-full bg-rose-500/[0.08] blur-3xl will-change-transform"
      />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-14 text-center">
          <FadeIn as="p" className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">
            Contact · connection open
          </FadeIn>
          <SplitText as="h2" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" stagger={0.02}>
            Let's connect
          </SplitText>
        </div>

        <FadeIn>
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-200">
                Name
                <input
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  className={`h-12 ${inputClasses}`}
                  placeholder="Your name"
                />
              </label>

              <label className="text-sm font-semibold text-slate-200">
                Email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className={`h-12 ${inputClasses}`}
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <label className="mt-5 block text-sm font-semibold text-slate-200">
              Message
              <textarea
                name="message"
                rows="6"
                required
                className={`resize-y py-3 ${inputClasses}`}
                placeholder="Write your message..."
              />
            </label>

            <Magnetic className="mt-6 w-full sm:w-auto">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-8 font-bold text-white shadow-xl shadow-rose-500/25 transition duration-300 hover:shadow-2xl hover:shadow-rose-500/40 hover:brightness-110 sm:w-auto"
              >
                Send Message
              </button>
            </Magnetic>
          </form>
        </FadeIn>
      </div>
    </section>
  )
}

export default Contact
