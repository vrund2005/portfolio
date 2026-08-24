import { Link } from 'react-router-dom'
import { FiArrowRight, FiClock } from 'react-icons/fi'
import FadeIn from './fx/FadeIn'
import SplitText from './fx/SplitText'
import GhostWord from './fx/GhostWord'
import CoverArt from './blog/CoverArt'
import { posts, formatDate, accentFor } from '../lib/posts'

function WritingCard({ post }) {
  const accent = accentFor(post.slug, post.accentName)

  return (
    <article className="glass group flex h-full flex-col overflow-hidden rounded-2xl shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-sky-300/40">
      <div
        className={`h-0.5 w-full origin-left bg-gradient-to-r ${accent.bar} scale-x-0 transition-transform duration-700 group-hover:scale-x-100`}
      />

      <Link to={`/blog/${post.slug}`} className="flex flex-1 flex-col">
        {/* Animated topic banner */}
        <div className="relative h-32 overflow-hidden border-b border-white/5 bg-white/[0.02] sm:h-36">
          <div
            className={`animate-blob-slow absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full ${accent.orb} blur-3xl`}
          />
          <CoverArt tags={post.tags} art={post.art} accent={accent} className="relative h-full w-full" />
        </div>

        <div className="flex flex-1 flex-col p-6">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="inline-flex items-center gap-1.5">
              <FiClock size={12} />
              {post.minutes} min read
            </span>
          </p>

          <h3 className="mt-3 bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text font-display text-xl font-bold leading-snug text-white transition-colors duration-300 group-hover:text-transparent">
            {post.title}
          </h3>

          {post.subtitle && (
            <p className="mt-2.5 flex-1 text-sm leading-6 text-slate-400 line-clamp-2">{post.subtitle}</p>
          )}

          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
            Read article
            <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </article>
  )
}

function Writing() {
  const featured = posts.slice(0, 2)
  if (featured.length === 0) return null

  return (
    <section id="blog" className="relative overflow-hidden px-5 py-24 sm:px-6 lg:px-8">
      <GhostWord direction={-1}>JOURNAL</GhostWord>
      <div
        aria-hidden="true"
        className="animate-blob-slow absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-sky-500/[0.07] blur-3xl will-change-transform"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <FadeIn as="p" className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Blog · publishing the docs
          </FadeIn>
          <SplitText as="h2" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" stagger={0.015}>
            Built. Shipped. Explained.
          </SplitText>
          <FadeIn as="p" delay={0.1} className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Every project ends with a deep dive — what I built, the tech behind it, and why I chose
            it over the alternatives. Plain English, no jargon walls.
          </FadeIn>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {featured.map((post, index) => (
            <FadeIn key={post.slug} delay={index * 0.08} className="flex">
              <WritingCard post={post} />
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.15} className="mt-10 text-center">
          <Link
            to="/blog"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-slate-950 transition duration-300 hover:bg-gradient-to-r hover:from-violet-300 hover:to-cyan-200"
          >
            Read all {posts.length > 2 ? `${posts.length} ` : ''}posts
            <FiArrowRight />
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}

export default Writing
