import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiClock, FiEdit3 } from 'react-icons/fi'
import { FaLinkedinIn } from 'react-icons/fa'
import BlogNavbar from '../components/blog/BlogNavbar'
import CoverArt from '../components/blog/CoverArt'
import Footer from '../components/Footer'
import FadeIn from '../components/fx/FadeIn'
import SplitText from '../components/fx/SplitText'
import { posts, formatDate, accentFor } from '../lib/posts'
import { applySeo, breadcrumbJsonLd, SITE_URL, PERSON_ID } from '../lib/seo'

function Meta({ post, className = '' }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 ${className}`}>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-600" />
      <span className="inline-flex items-center gap-1.5">
        <FiClock size={13} />
        {post.minutes} min read
      </span>
    </p>
  )
}

function Tags({ tags, limit = 4, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.slice(0, limit).map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300"
        >
          {tag}
        </span>
      ))}
      {tags.length > limit && (
        <span className="px-1 py-1 text-xs font-semibold text-slate-500">+{tags.length - limit}</span>
      )}
    </div>
  )
}

// One card shape for every post so the latest and the rest line up exactly;
// `featured` only changes emphasis, never width.
function PostCard({ post, featured = false }) {
  const accent = accentFor(post.slug)

  return (
    <article className="glass group relative overflow-hidden rounded-3xl shadow-xl shadow-black/20 transition-colors duration-500 hover:border-violet-300/40">
      <div
        className={`h-1 w-full origin-left bg-gradient-to-r ${accent.bar} ${
          featured ? '' : 'scale-x-0 transition-transform duration-700 group-hover:scale-x-100'
        }`}
      />

      <Link
        to={`/blog/${post.slug}`}
        className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-9"
      >
        <div className="order-2 lg:order-1">
          <div className="flex flex-wrap items-center gap-3">
            {featured && (
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-200" />
                </span>
                Latest
              </span>
            )}
            <Meta post={post} />
          </div>

          <h2
            className={`mt-4 bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text font-display font-bold leading-tight text-white transition-colors duration-300 group-hover:text-transparent ${
              featured ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'
            }`}
          >
            {post.title}
          </h2>

          {post.subtitle && (
            <p
              className={`mt-3 max-w-xl leading-7 text-slate-400 ${
                featured ? 'text-base' : 'text-sm leading-6'
              }`}
            >
              {post.subtitle}
            </p>
          )}

          <Tags tags={post.tags} className="mt-5" />

          {featured ? (
            <span className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-slate-950 transition duration-300 group-hover:bg-gradient-to-r group-hover:from-violet-300 group-hover:to-cyan-200">
              Read article
              <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          ) : (
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
              Read article
              <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          )}
        </div>

        {/* Animated topic art — a banner on small screens, a side panel on desktop */}
        <div
          className={`relative order-1 h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] sm:h-40 lg:order-2 ${
            featured ? 'lg:h-[260px]' : 'lg:h-[200px]'
          }`}
        >
          <div className={`animate-blob-slow absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full ${accent.orb} blur-3xl`} />
          <CoverArt tags={post.tags} art={post.art} accent={accent} className="relative h-full w-full" />
        </div>
      </Link>
    </article>
  )
}

function Blog() {
  useEffect(() => {
    applySeo({
      title: 'Blog — Vrund Patel | Agentic AI, RAG & Computer Vision Deep Dives',
      description:
        'Plain-English deep dives by Vrund Patel on the projects he ships: Agentic AI and LangGraph, RAG pipelines, MCP, computer vision and automation — what was built, the tech behind it, and why.',
      path: '/blog',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Blog',
            '@id': `${SITE_URL}/blog#blog`,
            name: 'Vrund Patel — Blog',
            url: `${SITE_URL}/blog`,
            author: { '@id': PERSON_ID },
            blogPost: posts.map((post) => ({
              '@type': 'BlogPosting',
              headline: post.title,
              url: `${SITE_URL}/blog/${post.slug}`,
              datePublished: post.date,
              keywords: post.tags.join(', '),
            })),
          },
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
        ],
      },
    })
  }, [])

  const totalMinutes = useMemo(() => posts.reduce((sum, post) => sum + post.minutes, 0), [])
  const [latest, ...rest] = posts

  return (
    <div className="min-h-screen bg-ink text-white selection:bg-violet-500/30 selection:text-white">
      <BlogNavbar />

      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-[90] opacity-[0.05]" />

      {/* ---------- Hero ---------- */}
      <header className="relative overflow-hidden px-5 pb-14 pt-32 sm:px-6 md:pt-44">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="animate-blob-slow absolute -top-24 left-[15%] h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="animate-blob absolute -top-10 right-[12%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <FadeIn as="p" y={16}>
            <span className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-violet-200">
              <FiEdit3 size={14} />
              The Journal
            </span>
          </FadeIn>

          <h1 className="mt-7 font-display text-4xl font-bold leading-[1.1] sm:text-6xl lg:text-7xl">
            <SplitText as="span" className="block" play stagger={0.014}>
              Built it.
            </SplitText>
            <SplitText
              as="span"
              className="block"
              play
              delay={0.12}
              stagger={0.014}
              charClassName="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent"
              charStyle={(index, total) => ({
                backgroundSize: `${total * 100}% 100%`,
                backgroundPosition: total > 1 ? `${(index / (total - 1)) * 100}% 0` : '0 0',
              })}
            >
              Now let me explain it.
            </SplitText>
          </h1>

          <FadeIn delay={0.15} y={20}>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
              Hi, I&apos;m Vrund. I build Agentic AI and GenAI projects — and each one gets a proper
              write-up here: what it does, the tech behind it, and why I chose it over the
              alternatives. Plain English, no jargon walls.
            </p>
          </FadeIn>

          <FadeIn delay={0.25} y={16}>
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-300">
                {posts.length} {posts.length === 1 ? 'article' : 'articles'}
              </span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-600" />
              <span>~{totalMinutes} min of reading</span>
              {posts.length > 0 && (
                <>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>Updated {formatDate(posts[0].date)}</span>
                </>
              )}
            </div>
          </FadeIn>
        </div>
      </header>

      {/* ---------- Posts ---------- */}
      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 sm:px-6">
        {posts.length === 0 ? (
          <p className="border-t border-white/10 py-20 text-center text-slate-500">
            First post coming soon.
          </p>
        ) : (
          <>
            <FadeIn y={28} className="block">
              <PostCard post={latest} featured />
            </FadeIn>

            {rest.length > 0 && (
              <>
                <FadeIn
                  as="p"
                  y={16}
                  className="mt-16 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500"
                >
                  More writing
                </FadeIn>

                <div className="mt-6 space-y-6">
                  {rest.map((post, index) => (
                    <FadeIn key={post.slug} delay={index * 0.06} className="block">
                      <PostCard post={post} />
                    </FadeIn>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ---------- Follow CTA ---------- */}
        <FadeIn y={24} className="block">
          <section className="glass mt-20 flex flex-col items-start gap-5 rounded-2xl p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold text-white">
                New posts land on LinkedIn first
              </p>
              <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-400">
                I share every project there the day it ships — the deep dive follows here a few days
                later.
              </p>
            </div>
            <a
              href="https://www.linkedin.com/in/patel-vrund/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-slate-950 transition duration-300 hover:bg-gradient-to-r hover:from-violet-300 hover:to-cyan-200"
            >
              <FaLinkedinIn />
              Follow along
            </a>
          </section>
        </FadeIn>
      </main>

      <Footer />
    </div>
  )
}

export default Blog
