/**
 * Infinite marquee strip (pure CSS animation, transform-only, GPU-friendly).
 * Content is duplicated once and translated -50%. Pauses on hover.
 * prefers-reduced-motion pauses the animation via CSS (see index.css).
 */
function Marquee({ items, duration = 28, className = '' }) {
  const row = (ariaHidden) => (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {items.map((item, i) => (
        <span key={i} className="mx-5 flex items-center gap-5 whitespace-nowrap">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-slate-400 transition-colors duration-300 hover:text-cyan-300">
            {item}
          </span>
          <span className="h-1 w-1 rounded-full bg-violet-400/70" />
        </span>
      ))}
    </div>
  )

  return (
    <div className={`group relative overflow-hidden ${className}`}>
      <div
        className="animate-marquee flex w-max will-change-transform group-hover:[animation-play-state:paused]"
        style={{ '--marquee-duration': `${duration}s` }}
      >
        {row(false)}
        {row(true)}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#05060f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#05060f] to-transparent" />
    </div>
  )
}

export default Marquee
