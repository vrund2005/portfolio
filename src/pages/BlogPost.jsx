import { Children, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { FiArrowLeft, FiArrowRight, FiCheck, FiCopy, FiLink, FiList, FiX } from 'react-icons/fi'
import { FaGithub, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import BlogNavbar from '../components/blog/BlogNavbar'
import CoverArt from '../components/blog/CoverArt'
import Footer from '../components/Footer'
import { posts, getPost, formatDate, slugify, extractHeadings, accentFor } from '../lib/posts'
import { applySeo, articleJsonLd, breadcrumbJsonLd } from '../lib/seo'
import avatar from '../assets/vrund.jpg'

// Flattens React children to plain text — used for heading ids (which must match
// extractHeadings) and for the copy-to-clipboard payload of code blocks.
function childrenToText(children) {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child)
      if (child?.props?.children) return childrenToText(child.props.children)
      return ''
    })
    .join('')
}

function jumpTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
}

/* ------------------------------------------------------------------ *
 * Markdown renderers (module scope so React keeps them mounted)
 * ------------------------------------------------------------------ */

const LANG_LABELS = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  text: 'Snippet',
  plaintext: 'Snippet',
}

function CodeBlock({ lang, raw, children }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="code-block">
      <div className="code-head">
        {/* Unlabelled fences stay blank rather than shouting "SNIPPET" */}
        <span>{lang ? LANG_LABELS[lang] ?? lang : ''}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500 transition duration-300 hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-300"
        >
          {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  )
}

function Heading({ level, children }) {
  const text = childrenToText(children)
  const id = slugify(text)
  const Tag = `h${level}`

  return (
    <Tag id={id}>
      <a href={`#${id}`} className="heading-anchor" aria-label={`Link to section: ${text}`}>
        #
      </a>
      {children}
    </Tag>
  )
}

const markdownComponents = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  table: ({ children }) => (
    <div className="table-scroll">
      <table>{children}</table>
    </div>
  ),
  pre: ({ children }) => {
    const codeEl = Children.toArray(children)[0]
    const className = codeEl?.props?.className ?? ''
    const lang = /language-([\w-]+)/.exec(className)?.[1]
    return (
      <CodeBlock lang={lang} raw={childrenToText(codeEl?.props?.children)}>
        {children}
      </CodeBlock>
    )
  },
}

/* ------------------------------------------------------------------ *
 * Navigation & sharing
 * ------------------------------------------------------------------ */

function TocLinks({ headings, activeId, onNavigate }) {
  return (
    <ul className="border-l border-white/10">
      {headings.map((heading) => (
        <li key={heading.id}>
          <button
            type="button"
            onClick={() => onNavigate(heading.id)}
            className={`-ml-px block w-full border-l-2 py-1.5 pr-2 text-left text-[0.82rem] leading-snug transition-colors duration-300 ${
              heading.level === 3 ? 'pl-7' : 'pl-4'
            } ${
              activeId === heading.id
                ? 'border-violet-400 font-semibold text-white'
                : 'border-transparent text-slate-500 hover:border-white/30 hover:text-slate-200'
            }`}
          >
            {heading.text}
          </button>
        </li>
      ))}
    </ul>
  )
}

// Floating contents button for screens without the sidebar rail — stays
// reachable anywhere in the article, unlike an inline box at the top.
function MobileToc({ headings, activeId }) {
  const [open, setOpen] = useState(false)

  if (headings.length === 0) return null

  const navigate = (id) => {
    setOpen(false)
    jumpTo(id)
  }

  return (
    <div className="xl:hidden">
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        className={`fixed bottom-24 right-5 z-[80] w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-white/10 bg-[#0a0c1a]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-300 ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Contents
        </p>
        <div className="max-h-[50vh] overflow-y-auto">
          <TocLinks headings={headings} activeId={activeId} onNavigate={navigate} />
        </div>
      </div>

      <button
        type="button"
        aria-label={open ? 'Close contents' : 'Open contents'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="glass fixed bottom-6 right-6 z-[80] grid h-12 w-12 place-items-center rounded-full text-white shadow-2xl shadow-violet-950/40 transition duration-300 hover:border-violet-400/50 hover:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-300"
      >
        {open ? <FiX size={20} /> : <FiList size={20} />}
      </button>
    </div>
  )
}

function ShareRow({ title }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const shareClass =
    'glass grid h-10 w-10 place-items-center rounded-full text-slate-300 transition duration-300 hover:-translate-y-0.5 hover:border-violet-300/60 hover:text-white'

  return (
    <div className="flex items-center gap-2.5">
      <span className="mr-1 text-sm font-semibold text-slate-500">Share</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on LinkedIn"
        className={shareClass}
      >
        <FaLinkedinIn size={16} />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on X"
        className={shareClass}
      >
        <FaXTwitter size={15} />
      </a>
      <button type="button" onClick={copy} aria-label="Copy link" className={shareClass}>
        <FiLink size={16} />
      </button>
      <span
        aria-live="polite"
        className={`text-xs font-semibold text-cyan-300 transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'}`}
      >
        Copied!
      </span>
    </div>
  )
}

function PostNotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">404</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">Post not found</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          This article doesn&apos;t exist — it may have moved or was never written.
        </p>
        <Link
          to="/blog"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-500 px-6 font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-1 hover:bg-indigo-400"
        >
          <FiArrowLeft />
          All posts
        </Link>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */

function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)
  const progressRef = useRef(null)
  const headings = useMemo(() => (post ? extractHeadings(post.content) : []), [post])
  const [activeHeading, setActiveHeading] = useState('')

  useEffect(() => {
    if (!post) return
    applySeo({
      title: `${post.title} — Vrund Patel`,
      description:
        post.subtitle ||
        `${post.title} — a deep dive by Vrund Patel on ${post.tags.slice(0, 3).join(', ')}.`,
      path: `/blog/${post.slug}`,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          articleJsonLd(post),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ],
      },
    })
  }, [post])

  // Reading progress — rAF-throttled, written straight to the DOM
  useEffect(() => {
    if (!post) return undefined

    let ticking = false
    const update = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? window.scrollY / docHeight : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [post])

  // Track the section being read — headings are in document order, so the
  // active one is the last heading above the fold line
  useEffect(() => {
    if (headings.length === 0) return undefined

    let ticking = false
    const update = () => {
      let current = headings[0].id
      for (const heading of headings) {
        const el = document.getElementById(heading.id)
        if (el && el.getBoundingClientRect().top <= 140) current = heading.id
        else break
      }
      setActiveHeading(current)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  if (!post) {
    return (
      <div className="min-h-screen bg-ink text-white">
        <BlogNavbar />
        <PostNotFound />
      </div>
    )
  }

  const accent = accentFor(post.slug)
  const readNext = posts.filter((entry) => entry.slug !== post.slug).slice(0, 2)

  return (
    <div className="min-h-screen bg-ink text-white selection:bg-violet-500/30 selection:text-white">
      {/* Reading progress */}
      <div className="fixed left-0 top-0 z-[70] h-0.5 w-full bg-white/5">
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-300 will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <BlogNavbar />

      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-[90] opacity-[0.05]" />

      {/* ---------------- Article header ---------------- */}
      <header className="relative overflow-hidden px-5 pt-24 sm:px-6 md:pt-32 lg:pt-36">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="animate-blob-slow absolute -top-28 left-[18%] h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="animate-blob absolute -top-12 right-[15%] h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-[720px]">
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <FiArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            All posts
          </Link>

          <div className="mt-7 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-200"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mt-6 font-display text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.6rem] md:text-[3.1rem] md:leading-[1.08]">
            {post.title}
          </h1>

          {post.subtitle && (
            <p className="mt-5 font-serif text-lg leading-[1.65] text-slate-400 sm:text-xl md:mt-6 md:text-[1.35rem]">
              {post.subtitle}
            </p>
          )}

          {/* Byline */}
          <div className="mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-white/10 pt-6 md:mt-10">
            <div className="flex items-center gap-3.5">
              <img
                src={avatar}
                alt="Vrund Patel"
                className="h-11 w-11 rounded-full border border-white/10 object-cover"
              />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">Vrund Patel</p>
                <p className="mt-1 text-sm text-slate-500">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden="true" className="mx-2">
                    ·
                  </span>
                  {post.minutes} min read
                </p>
              </div>
            </div>

            {post.project && (
              <a
                href={post.project}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-sm font-semibold text-slate-300 transition duration-300 hover:-translate-y-0.5 hover:border-violet-300/60 hover:text-white"
              >
                <FaGithub size={15} />
                View project
              </a>
            )}
          </div>
        </div>

        {/* Cover — no artwork needed, the topic becomes the artwork */}
        <div className="relative z-10 mx-auto mt-10 h-36 max-w-[860px] overflow-hidden rounded-2xl border border-white/10 sm:h-44 md:mt-14 md:h-56 md:rounded-3xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${accent.bar} opacity-[0.14]`} />
          <div className={`animate-blob-slow absolute left-1/4 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full ${accent.orb} blur-3xl`} />
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]" />
          <CoverArt tags={post.tags} art={post.art} accent={accent} className="relative h-full w-full" />
        </div>
      </header>

      {/* ---------------- Article body ---------------- */}
      <main className="relative z-10 px-5 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-16">
        <div className="mx-auto flex max-w-[720px] xl:max-w-none xl:justify-center xl:gap-14">
          {/* Contents rail */}
          {headings.length > 0 && (
            <aside className="sticky top-28 hidden max-h-[calc(100vh-9rem)] w-[220px] shrink-0 self-start overflow-y-auto xl:block">
              <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Contents
              </p>
              <TocLinks headings={headings} activeId={activeHeading} onNavigate={jumpTo} />
            </aside>
          )}

          {/* min-w-0 keeps wide code blocks from stretching the flex column */}
          <div className="w-full min-w-0 max-w-[720px]">
            <article className="post-body prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {post.content}
              </ReactMarkdown>
            </article>

            {/* ---------------- Article footer ---------------- */}
            <footer className="mt-16 md:mt-20">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-5 border-t border-white/10 pt-8">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <ShareRow title={post.title} />
              </div>

              {/* Author card */}
              <div className="glass mt-10 flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center md:p-7">
                <img
                  src={avatar}
                  alt="Vrund Patel"
                  className="h-16 w-16 shrink-0 rounded-full border border-white/10 object-cover"
                />
                <div className="flex-1">
                  <p className="font-display text-lg font-bold text-white">Written by Vrund Patel</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400">
                    AI/ML Engineer building Agentic AI, GenAI, and CV projects — and writing
                    about every one of them so the learning sticks.
                  </p>
                </div>
                <a
                  href="https://www.linkedin.com/in/patel-vrund/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-slate-950 transition duration-300 hover:bg-gradient-to-r hover:from-violet-300 hover:to-cyan-200"
                >
                  <FaLinkedinIn />
                  Follow
                </a>
              </div>

              {/* Read next */}
              {readNext.length > 0 && (
                <section className="mt-16 md:mt-20">
                  <div className="flex items-center gap-4">
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                      Read next
                    </h2>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className={`mt-6 grid gap-5 ${readNext.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                    {readNext.map((entry) => (
                      <Link
                        key={entry.slug}
                        to={`/blog/${entry.slug}`}
                        className="glass group flex h-full flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:border-violet-300/40"
                      >
                        <div
                          className={`h-0.5 w-full origin-left bg-gradient-to-r ${accentFor(entry.slug).bar} scale-x-0 transition-transform duration-500 group-hover:scale-x-100`}
                        />
                        <div className="flex flex-1 flex-col p-6">
                          <p className="text-xs text-slate-500">
                            <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                            <span aria-hidden="true" className="mx-2">
                              ·
                            </span>
                            {entry.minutes} min read
                          </p>
                          <h3 className="mt-3 font-display text-lg font-bold leading-snug text-white">
                            {entry.title}
                          </h3>
                          {entry.subtitle && (
                            <p className="mt-2 flex-1 text-sm leading-6 text-slate-400 line-clamp-3">
                              {entry.subtitle}
                            </p>
                          )}
                          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
                            Read article
                            <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </footer>
          </div>

          {/* Mirrors the contents rail so the column stays optically centered */}
          {headings.length > 0 && (
            <div aria-hidden="true" className="hidden w-[220px] shrink-0 min-[1440px]:block" />
          )}
        </div>
      </main>

      <MobileToc headings={headings} activeId={activeHeading} />

      <Footer />
    </div>
  )
}

export default BlogPost
