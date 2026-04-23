import { motion as Motion } from 'framer-motion'

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

  return (
    <section id="contact" className="bg-slate-900 px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
          className="mb-14 text-center"
        >
          <p className="text-sm font-semibold uppercase text-indigo-300">Contact</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Let&apos;s connect</h2>
        </Motion.div>

        <Motion.form
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
          onSubmit={handleSubmit}
          className="rounded-lg border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/20 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-200">
              Name
              <input
                type="text"
                name="name"
                required
                autoComplete="name"
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
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
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
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
              className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
              placeholder="Write your message..."
            />
          </label>

          <button
            type="submit"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-indigo-500 px-6 font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-1 hover:bg-indigo-400 sm:w-auto"
          >
            Send Message
          </button>
        </Motion.form>

      </div>
    </section>
  )
}

export default Contact
