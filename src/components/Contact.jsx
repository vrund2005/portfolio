import { useEffect, useRef, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function Contact() {
  const [buttonState, setButtonState] = useState('Send Message')
  const contactRef = useRef(null)

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.from('.contact-heading', {
        rotateX: 360,
        opacity: 0,
        duration: 1,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: contactRef.current,
          start: 'top 70%',
          once: true,
        },
      })
    }, contactRef)

    return () => context.revert()
  }, [])

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

    setButtonState('Sending...')
    window.setTimeout(() => {
      setButtonState('Sent ✓')
      window.setTimeout(() => {
        window.location.href = mailtoUrl
      }, 500)
    }, 700)
  }

  const handleFieldMove = (event) => {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    const distanceX = event.clientX - (rect.left + rect.width / 2)
    const distanceY = event.clientY - (rect.top + rect.height / 2)

    element.style.transform = `perspective(700px) rotateX(${(-distanceY / rect.height) * 5}deg) rotateY(${
      (distanceX / rect.width) * 5
    }deg)`
  }

  const resetField = (event) => {
    event.currentTarget.style.transform = ''
  }

  return (
    <section id="contact" ref={contactRef} className="bg-slate-900 px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
          className="contact-heading mb-14 text-center"
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
            <label className="contact-field text-sm font-semibold text-slate-200">
              Name
              <input
                type="text"
                name="name"
                required
                autoComplete="name"
                onMouseMove={handleFieldMove}
                onMouseLeave={resetField}
                className="contact-input mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
                placeholder="Your name"
              />
            </label>

            <label className="contact-field text-sm font-semibold text-slate-200">
              Email
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                onMouseMove={handleFieldMove}
                onMouseLeave={resetField}
                className="contact-input mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <label className="contact-field mt-5 block text-sm font-semibold text-slate-200">
            Message
            <textarea
              name="message"
              rows="6"
              required
              onMouseMove={handleFieldMove}
              onMouseLeave={resetField}
              className="contact-input mt-2 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
              placeholder="Write your message..."
            />
          </label>

          <button
            type="submit"
            className="ripple-button mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-indigo-500 px-6 font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-1 hover:bg-indigo-400 sm:w-auto"
          >
            <Motion.span layout>{buttonState}</Motion.span>
          </button>
        </Motion.form>

      </div>
    </section>
  )
}

export default Contact
